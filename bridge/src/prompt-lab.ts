/**
 * Prompt Lab — A/B test prompts across multiple LLMs
 *
 * Features:
 * - Create experiments with multiple prompt variants
 * - Run each variant against 1-5 LLMs simultaneously
 * - Statistical comparison (avg quality, latency, cost, token usage)
 * - Auto-optimize: pick winning prompt based on configurable criteria
 * - History of all experiments with results
 */
import { v4 as uuidv4 } from "uuid";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const LAB_FILE = join(DATA_DIR, "prompt-lab.json");

try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); } catch { /* ok */ }

// ─── Types ───────────────────────────────────────────────────

export type LabModel = "gemini" | "claude" | "deepseek" | "grok" | "ollama";

export interface PromptVariant {
  id: string;
  label: string;           // "Variant A", "Variant B", etc.
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

export interface VariantResult {
  variantId: string;
  model: LabModel;
  response: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  quality?: number;         // 1-5 manual rating
  autoScore?: number;       // 0-100 AI-judged quality
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: PromptVariant[];
  models: LabModel[];
  results: VariantResult[];
  status: "draft" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  winner?: {
    variantId: string;
    reason: string;
    criteria: "quality" | "latency" | "cost" | "auto";
  };
  judgePrompt?: string;    // Custom prompt for AI judge
  runs: number;            // How many times to run each variant (for statistical significance)
}

export interface ExperimentSummary {
  id: string;
  name: string;
  status: string;
  variantCount: number;
  modelCount: number;
  resultCount: number;
  createdAt: string;
  winner?: string;
}

export interface VariantStats {
  variantId: string;
  label: string;
  avgLatencyMs: number;
  avgCostUsd: number;
  avgTokens: number;
  avgQuality: number;
  avgAutoScore: number;
  resultCount: number;
  modelBreakdown: {
    model: LabModel;
    avgLatencyMs: number;
    avgCostUsd: number;
    avgQuality: number;
    avgAutoScore: number;
    count: number;
  }[];
}

// ─── State ───────────────────────────────────────────────────

let experiments: Experiment[] = [];

// ─── Cost Tables ─────────────────────────────────────────────

const COST_INPUT: Record<LabModel, number> = {
  claude: 3.0 / 1_000_000,
  gemini: 0.075 / 1_000_000,
  deepseek: 0.14 / 1_000_000,
  grok: 5.0 / 1_000_000,
  ollama: 0,
};

const COST_OUTPUT: Record<LabModel, number> = {
  claude: 15.0 / 1_000_000,
  gemini: 0.30 / 1_000_000,
  deepseek: 0.28 / 1_000_000,
  grok: 15.0 / 1_000_000,
  ollama: 0,
};

// ─── Persistence ─────────────────────────────────────────────

function load(): void {
  try {
    if (existsSync(LAB_FILE)) {
      experiments = JSON.parse(readFileSync(LAB_FILE, "utf-8"));
    }
  } catch { /* fresh start */ }
}

function save(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(LAB_FILE, JSON.stringify(experiments.slice(-200), null, 2), "utf-8");
  } catch { /* ignore */ }
}

load();

// ─── CRUD ────────────────────────────────────────────────────

export function listExperiments(): ExperimentSummary[] {
  return experiments.map(e => ({
    id: e.id,
    name: e.name,
    status: e.status,
    variantCount: e.variants.length,
    modelCount: e.models.length,
    resultCount: e.results.length,
    createdAt: e.createdAt,
    winner: e.winner?.variantId,
  })).reverse();
}

export function getExperiment(id: string): Experiment | undefined {
  return experiments.find(e => e.id === id);
}

export function createExperiment(data: {
  name: string;
  description?: string;
  variants: { label: string; systemPrompt: string; userPrompt: string; temperature?: number }[];
  models: LabModel[];
  runs?: number;
  judgePrompt?: string;
}): Experiment {
  const experiment: Experiment = {
    id: uuidv4(),
    name: data.name,
    description: data.description || "",
    variants: data.variants.map(v => ({
      id: uuidv4(),
      label: v.label,
      systemPrompt: v.systemPrompt,
      userPrompt: v.userPrompt,
      temperature: v.temperature ?? 0.7,
    })),
    models: data.models,
    results: [],
    status: "draft",
    createdAt: new Date().toISOString(),
    runs: data.runs || 1,
    judgePrompt: data.judgePrompt,
  };
  experiments.push(experiment);
  save();
  return experiment;
}

export function deleteExperiment(id: string): boolean {
  const idx = experiments.findIndex(e => e.id === id);
  if (idx === -1) return false;
  experiments.splice(idx, 1);
  save();
  return true;
}

// ─── Run Experiment ──────────────────────────────────────────

type LLMRunner = (
  systemPrompt: string,
  userPrompt: string,
  model: LabModel,
  temperature: number
) => Promise<{ response: string; inputTokens: number; outputTokens: number; latencyMs: number }>;

let registeredRunner: LLMRunner | null = null;

export function registerLLMRunner(runner: LLMRunner): void {
  registeredRunner = runner;
}

export async function runExperiment(
  id: string,
  onProgress?: (result: VariantResult) => void
): Promise<Experiment | null> {
  const experiment = experiments.find(e => e.id === id);
  if (!experiment) return null;
  if (!registeredRunner) throw new Error("No LLM runner registered");

  experiment.status = "running";
  experiment.results = [];
  save();

  try {
    for (let run = 0; run < experiment.runs; run++) {
      for (const variant of experiment.variants) {
        for (const model of experiment.models) {
          try {
            const result = await registeredRunner(
              variant.systemPrompt,
              variant.userPrompt,
              model,
              variant.temperature
            );

            const costUsd =
              result.inputTokens * (COST_INPUT[model] || 0) +
              result.outputTokens * (COST_OUTPUT[model] || 0);

            const variantResult: VariantResult = {
              variantId: variant.id,
              model,
              response: result.response,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              latencyMs: result.latencyMs,
              costUsd,
            };

            experiment.results.push(variantResult);
            onProgress?.(variantResult);
          } catch (err) {
            // Record failed result
            experiment.results.push({
              variantId: variant.id,
              model,
              response: `[ERROR] ${err instanceof Error ? err.message : String(err)}`,
              inputTokens: 0,
              outputTokens: 0,
              latencyMs: 0,
              costUsd: 0,
            });
          }
        }
      }
    }

    // Auto-judge if Gemini is available and judge prompt exists
    await autoJudge(experiment);

    experiment.status = "completed";
    experiment.completedAt = new Date().toISOString();

    // Auto-pick winner
    autoPickWinner(experiment);

    save();
    return experiment;
  } catch (err) {
    experiment.status = "failed";
    save();
    return experiment;
  }
}

// ─── Auto Judge ──────────────────────────────────────────────

async function autoJudge(experiment: Experiment): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const judgeSystemPrompt = experiment.judgePrompt ||
    `You are an expert AI response evaluator. Score each response from 0-100 based on:
- Accuracy and correctness (30%)
- Completeness and depth (25%)
- Clarity and readability (25%)
- Creativity and insight (20%)
Return ONLY a number 0-100, nothing else.`;

  for (const result of experiment.results) {
    if (result.autoScore !== undefined) continue;
    if (result.response.startsWith("[ERROR]")) { result.autoScore = 0; continue; }

    const variant = experiment.variants.find(v => v.id === result.variantId);
    if (!variant) continue;

    try {
      const prompt = `${judgeSystemPrompt}

Original prompt: "${variant.userPrompt}"

Response to evaluate:
"""
${result.response.slice(0, 2000)}
"""

Score (0-100):`;

      const res = await model.generateContent(prompt);
      const text = res.response.text().trim();
      const score = parseInt(text.match(/\d+/)?.[0] || "0", 10);
      result.autoScore = Math.min(100, Math.max(0, score));

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch {
      result.autoScore = 0;
    }
  }
}

// ─── Winner Selection ────────────────────────────────────────

function autoPickWinner(experiment: Experiment): void {
  const stats = getVariantStats(experiment);
  if (stats.length === 0) return;

  // Pick by auto score first, then quality, then latency
  let bestVariant = stats[0];
  let reason = "";
  let criteria: "quality" | "latency" | "cost" | "auto" = "auto";

  // By auto score
  const hasAutoScores = stats.some(s => s.avgAutoScore > 0);
  if (hasAutoScores) {
    bestVariant = stats.reduce((best, s) => s.avgAutoScore > best.avgAutoScore ? s : best, stats[0]);
    reason = `Highest AI judge score: ${bestVariant.avgAutoScore.toFixed(1)}/100`;
    criteria = "auto";
  }
  // By manual quality
  else if (stats.some(s => s.avgQuality > 0)) {
    bestVariant = stats.reduce((best, s) => s.avgQuality > best.avgQuality ? s : best, stats[0]);
    reason = `Highest quality rating: ${bestVariant.avgQuality.toFixed(1)}/5`;
    criteria = "quality";
  }
  // By latency
  else {
    bestVariant = stats.reduce((best, s) => s.avgLatencyMs < best.avgLatencyMs ? s : best, stats[0]);
    reason = `Fastest average response: ${bestVariant.avgLatencyMs}ms`;
    criteria = "latency";
  }

  experiment.winner = {
    variantId: bestVariant.variantId,
    reason,
    criteria,
  };
}

// ─── Stats ───────────────────────────────────────────────────

export function getVariantStats(experiment: Experiment): VariantStats[] {
  return experiment.variants.map(variant => {
    const results = experiment.results.filter(r => r.variantId === variant.id);
    const validResults = results.filter(r => !r.response.startsWith("[ERROR]"));

    const modelBreakdown: VariantStats["modelBreakdown"] = experiment.models.map(model => {
      const modelResults = validResults.filter(r => r.model === model);
      return {
        model,
        avgLatencyMs: modelResults.length > 0
          ? Math.round(modelResults.reduce((s, r) => s + r.latencyMs, 0) / modelResults.length)
          : 0,
        avgCostUsd: modelResults.length > 0
          ? modelResults.reduce((s, r) => s + r.costUsd, 0) / modelResults.length
          : 0,
        avgQuality: modelResults.filter(r => r.quality).length > 0
          ? modelResults.filter(r => r.quality).reduce((s, r) => s + (r.quality || 0), 0) /
            modelResults.filter(r => r.quality).length
          : 0,
        avgAutoScore: modelResults.filter(r => r.autoScore !== undefined).length > 0
          ? modelResults.filter(r => r.autoScore !== undefined).reduce((s, r) => s + (r.autoScore || 0), 0) /
            modelResults.filter(r => r.autoScore !== undefined).length
          : 0,
        count: modelResults.length,
      };
    });

    return {
      variantId: variant.id,
      label: variant.label,
      avgLatencyMs: validResults.length > 0
        ? Math.round(validResults.reduce((s, r) => s + r.latencyMs, 0) / validResults.length)
        : 0,
      avgCostUsd: validResults.length > 0
        ? validResults.reduce((s, r) => s + r.costUsd, 0) / validResults.length
        : 0,
      avgTokens: validResults.length > 0
        ? Math.round(validResults.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0) / validResults.length)
        : 0,
      avgQuality: validResults.filter(r => r.quality).length > 0
        ? validResults.filter(r => r.quality).reduce((s, r) => s + (r.quality || 0), 0) /
          validResults.filter(r => r.quality).length
        : 0,
      avgAutoScore: validResults.filter(r => r.autoScore !== undefined).length > 0
        ? validResults.filter(r => r.autoScore !== undefined).reduce((s, r) => s + (r.autoScore || 0), 0) /
          validResults.filter(r => r.autoScore !== undefined).length
        : 0,
      resultCount: validResults.length,
      modelBreakdown,
    };
  });
}

export function rateResult(experimentId: string, variantId: string, model: LabModel, quality: number): boolean {
  const experiment = experiments.find(e => e.id === experimentId);
  if (!experiment) return false;

  const result = experiment.results.find(r => r.variantId === variantId && r.model === model && !r.quality);
  if (!result) return false;

  result.quality = Math.min(5, Math.max(1, quality));
  save();
  return true;
}
