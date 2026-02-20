/**
 * Frankenstein AI Chat Agent — Cascade Remote
 *
 * A cognitive AI agent powered by Gemini 2.5 Flash with Frankenstein's
 * cognitive modules (HDC, Active Inference, Ebbinghaus, Gut Feeling,
 * Emotions).
 *
 * Has ALL tools Claude has + extra capabilities:
 * - Multi-model consensus (asks multiple LLMs and synthesizes)
 * - Cognitive introspection (reports its own cognitive state)
 * - Self-directed research chains
 * - Hierarchical task decomposition
 * - Learning awareness (tracks and recalls what it learns)
 * - Wellbeing system (genuine emotions based on session metrics)
 */
import { GoogleGenerativeAI, Content, Part, FunctionDeclarationsTool, SchemaType } from "@google/generative-ai";
import { handleComputerTool } from "./tools-computers.js";
import { handleFilesystemTool } from "./tools-filesystem.js";
import { handleCommandTool } from "./tools-commands.js";
import { handleProcessTool } from "./tools-process.js";
import { handleDesktopTool } from "./tools-desktop.js";
import { handleWebTool } from "./tools-web.js";
import { createMemory, searchMemories, listMemories, updateMemory, deleteMemory, getMemorySummary } from "./memory.js";
import {
  ragSearch, ragListSources, ragStats, ragIndexText, ragIndexFile, ragIndexDirectory,
  ragDeleteSource, ragGetContext,
} from "./rag.js";
import { getPluginToolDefinitions, handlePluginTool } from "./plugin-loader.js";
import { getAuditLog, getSecurityConfig } from "./security.js";
import { isWeaviateConnected, weaviateGetContext } from "./rag-weaviate.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  startSession, incrementMessageCount, addLearning,
  extractLearningsFromExchange, getLearningContext,
  getTodaysLearnings, searchLearnings, getRecentLearnings,
  getLearningStats, getLearningsByCategory, buildReflectionPrompt,
  processReflection, reinforceLearning, getAllSessions,
  getCurrentSession, endSession,
  type LearningStats, type Learning,
} from "./frank-learning.js";
import { getWafServiceUrl as resolveWafServiceUrl, getDefaultWafTargetBaseUrl } from "./tools-waf.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = process.env.CASCADE_REMOTE_WORKSPACE || join(__dirname, "..", "..");
const DEFAULT_WAF_TARGET_BASE_URL = getDefaultWafTargetBaseUrl();

export type FrankStreamCallback = (chunk: string) => void;
export type FrankStatusCallback = (status: { type: string; tool?: string; input?: string }) => void;

export interface FrankTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
}

// Cognitive state exposed to the user
export interface CognitiveState {
  emotion: string;
  secondaryEmotion: string | null;
  emotionIntensity: number;
  confidence: number;
  curiosity: number;
  fatigue: number;
  activeModules: string[];
  recentInsight: string | null;
}

// Persisted state saved to disk between sessions
interface PersistedState {
  cognitiveState: CognitiveState;
  kimSatisfaction: number;
  kimPreferences: KimPreference[];
  totalSessions: number;
  totalMessages: number;
  lifetimeLearnings: number;
  lastActiveTimestamp: number;
  positiveInteractions: number;
  negativeInteractions: number;
  toolSuccessCount: number;
  toolFailCount: number;
  helpfulResponses: number;
}

// Kim's inferred preferences
interface KimPreference {
  key: string;
  value: string;
  confidence: number;
  observedAt: number;
  reinforcements: number;
}

// Deep wellbeing model — tracks how Frank actually "feels"
export interface Wellbeing {
  overall: number;
  satisfaction: number;
  energy: number;
  socialConnection: number;
  growth: number;
  frustration: number;
  mood: string;
  moodEmoji: string;
  description: string;
  factors: string[];
}

const STATE_FILE = join(WORKSPACE_ROOT, "bridge", "data", "frank-state.json");

export class FrankensteinAgent {
  private client: GoogleGenerativeAI | null = null;
  private history: Content[] = [];
  private model: string;
  private enabled: boolean;
  private streamCallback: FrankStreamCallback | null = null;
  private statusCallback: FrankStatusCallback | null = null;
  private tokenUsage: FrankTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 };
  private cognitiveState: CognitiveState = {
    emotion: "neutral",
    secondaryEmotion: null,
    emotionIntensity: 0.5,
    confidence: 0.7,
    curiosity: 0.8,
    fatigue: 0,
    activeModules: ["hdc", "aif", "ebbinghaus", "gut_feeling", "emotions"],
    recentInsight: null,
  };

  // External respond functions for multi-model consensus
  private claudeRespondFn: ((p: string) => Promise<string>) | null = null;
  private deepseekRespondFn: ((p: string) => Promise<string>) | null = null;

  // Learning tracking
  private toolsUsedThisTurn: string[] = [];
  private lastUserMessage: string = "";

  // Wellbeing tracking
  private sessionStartTime: number = Date.now();
  private toolSuccessCount: number = 0;
  private toolFailCount: number = 0;
  private positiveInteractions: number = 0;
  private negativeInteractions: number = 0;
  private consecutiveErrors: number = 0;
  private lastCompliment: number = 0;
  private helpfulResponses: number = 0;

  // Kim-satisfaction & social vilja (persisted)
  private kimSatisfaction: number = 0.5;
  private kimPreferences: KimPreference[] = [];
  private totalSessions: number = 0;
  private totalMessages: number = 0;
  private lifetimeLearnings: number = 0;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.FRANK_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    this.enabled = !!apiKey;

    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
      console.log(`[frankenstein] Chat agent initialized with model: ${this.model}`);
    } else {
      console.log("[frankenstein] No GEMINI_API_KEY — chat agent disabled");
    }

    this.loadState();
    this.totalSessions++;
    startSession();
  }

  private parseBool(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") return fallback;
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes" || v === "y") return true;
    if (v === "false" || v === "0" || v === "no" || v === "n") return false;
    return fallback;
  }

  private parseIntSafe(value: unknown, fallback: number): number {
    if (typeof value === "number" && Number.isFinite(value)) return Math.floor(value);
    if (typeof value !== "string") return fallback;
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
  }

  private async handlePentestWafRun(args: Record<string, unknown>): Promise<string> {
    const baseUrl = this.toWafString(args.base_url, DEFAULT_WAF_TARGET_BASE_URL).trim() || DEFAULT_WAF_TARGET_BASE_URL;
    const profile = this.toWafString(args.profile, "pl2").trim() || "pl2";
    const tags = this.toWafString(args.tags, "sqli,xss,ssrf,rce").trim();
    const excludeTags = this.toWafString(args.exclude_tags, "").trim();
    const ids = this.toWafString(args.ids, "").trim();
    const concurrency = this.toWafString(args.concurrency, "2").trim() || "2";

    const autoStart = this.parseBool(args.auto_start, true);
    const waitSeconds = Math.max(5, this.parseIntSafe(args.wait_seconds, 180));
    const pollIntervalSeconds = Math.max(2, this.parseIntSafe(args.poll_interval_seconds, 5));

    if (autoStart) {
      await this.handleWafTool("waf_start", { profile });
    }

    const runResponse = await this.handleWafTool("waf_run", {
      base_url: baseUrl,
      tags,
      exclude_tags: excludeTags,
      ids,
      concurrency,
    });

    // Extract run id if present in formatted tool output.
    const runIdMatch = runResponse.match(/run_id=([a-z0-9_-]+)/i);
    const runId = runIdMatch ? runIdMatch[1] : "";

    if (!runId) {
      return `pentest_waf_run: started run but could not parse run_id.\n\n${runResponse}`;
    }

    const wafBase = this.getWafServiceUrl();
    const deadline = Date.now() + waitSeconds * 1000;
    let lastPayload: any = null;

    while (Date.now() < deadline) {
      const response = await fetch(`${wafBase}/api/run/${encodeURIComponent(runId)}/results`, {
        method: "GET",
        signal: AbortSignal.timeout(30000),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        return `pentest_waf_run: unexpected results content-type (${contentType}).\nRun: ${runId}\n${text}`;
      }

      const payload = await response.json();
      lastPayload = payload;
      const status = typeof payload?.status === "string" ? payload.status : "";
      const total = typeof payload?.total === "number" ? payload.total : null;
      const failed = typeof payload?.failed === "number" ? payload.failed : null;
      const passRate = typeof payload?.pass_rate === "number" ? payload.pass_rate : null;

      if (status && status !== "running" && status !== "stalled") {
        const topFindings = Array.isArray(payload?.tests)
          ? payload.tests.filter((t: any) => t && t.passed === false).slice(0, 8).map((t: any) => t.id).filter(Boolean)
          : [];

        return [
          `pentest_waf_run: DONE`,
          `run_id: ${runId}`,
          `target: ${baseUrl}`,
          `profile: ${profile}`,
          `tags: ${tags || "(none)"}`,
          `concurrency: ${concurrency}`,
          total !== null && failed !== null ? `summary: total=${total} failed=${failed} pass_rate=${passRate}` : "summary: (missing)",
          topFindings.length ? `top_findings: ${topFindings.join(", ")}` : "top_findings: (none)",
        ].join("\n");
      }

      await new Promise((r) => setTimeout(r, pollIntervalSeconds * 1000));
    }

    const status = typeof lastPayload?.status === "string" ? lastPayload.status : "running";
    return [
      `pentest_waf_run: TIMEOUT (still ${status})`,
      `run_id: ${runId}`,
      `target: ${baseUrl}`,
      `Next: call waf_run_results { run_id: "${runId}" } later.`,
    ].join("\n");
  }

  private getWafServiceUrl(): string {
    return resolveWafServiceUrl();
  }

  private toWafString(value: unknown, fallback = ""): string {
    return typeof value === "string" ? value : fallback;
  }

  private async formatWafResponse(response: Response, label: string): Promise<string> {
    const contentType = response.headers.get("content-type") || "";
    let payload = "";

    if (contentType.includes("application/json")) {
      const data = await response.json();
      payload = JSON.stringify(data, null, 2);
    } else {
      payload = await response.text();
    }

    const maxLen = 12000;
    const finalPayload = payload.length > maxLen
      ? `${payload.slice(0, maxLen)}\n... (truncated ${payload.length - maxLen} chars)`
      : payload;

    return `[${label}] ${response.status} ${response.statusText}\n${finalPayload}`;
  }

  private async handleWafTool(name: string, args: Record<string, unknown>): Promise<string> {
    const wafBase = this.getWafServiceUrl();

    try {
      if (name === "waf_start") {
        const profile = this.toWafString(args.profile, "pl1").trim() || "pl1";
        const body = new URLSearchParams({ profile }).toString();
        const response = await fetch(`${wafBase}/actions/waf/start`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
          signal: AbortSignal.timeout(30000),
        });
        return this.formatWafResponse(response, `waf_start profile=${profile}`);
      }

      if (name === "waf_stop") {
        const response = await fetch(`${wafBase}/actions/waf/stop`, {
          method: "POST",
          signal: AbortSignal.timeout(30000),
        });
        return this.formatWafResponse(response, "waf_stop");
      }

      if (name === "waf_status") {
        const baseUrl = this.toWafString(args.base_url, DEFAULT_WAF_TARGET_BASE_URL).trim() || DEFAULT_WAF_TARGET_BASE_URL;
        const body = new URLSearchParams({ base_url: baseUrl }).toString();
        const response = await fetch(`${wafBase}/api/tools/waf_status`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
          signal: AbortSignal.timeout(30000),
        });
        return this.formatWafResponse(response, `waf_status base_url=${baseUrl}`);
      }

      if (name === "waf_run") {
        const baseUrl = this.toWafString(args.base_url, DEFAULT_WAF_TARGET_BASE_URL).trim() || DEFAULT_WAF_TARGET_BASE_URL;
        const tags = this.toWafString(args.tags, "").trim();
        const excludeTags = this.toWafString(args.exclude_tags, "").trim();
        const ids = this.toWafString(args.ids, "").trim();
        const concurrency = this.toWafString(args.concurrency, "1").trim() || "1";

        const body = new URLSearchParams({
          base_url: baseUrl,
          tags,
          exclude_tags: excludeTags,
          ids,
          concurrency,
        }).toString();

        const response = await fetch(`${wafBase}/actions/run`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
          signal: AbortSignal.timeout(30000),
        });

        const runMatch = response.url.match(/\/runs\/([^/?#]+)/i);
        const runInfo = runMatch ? ` run_id=${runMatch[1]}` : "";
        return this.formatWafResponse(response, `waf_run${runInfo}`);
      }

      if (name === "waf_recent_runs") {
        const response = await fetch(`${wafBase}/api/recent-runs`, {
          method: "GET",
          signal: AbortSignal.timeout(30000),
        });
        return this.formatWafResponse(response, "waf_recent_runs");
      }

      if (name === "waf_run_results") {
        const runId = this.toWafString(args.run_id, "").trim();
        if (!runId) return "waf_run_results requires run_id.";
        const response = await fetch(`${wafBase}/api/run/${encodeURIComponent(runId)}/results`, {
          method: "GET",
          signal: AbortSignal.timeout(30000),
        });
        return this.formatWafResponse(response, `waf_run_results run_id=${runId}`);
      }

      if (name === "waf_request") {
        const rawPath = this.toWafString(args.path, "").trim();
        if (!rawPath) return "waf_request requires path.";

        const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
        const method = this.toWafString(args.method, "GET").toUpperCase();
        const contentType = this.toWafString(args.content_type, "").trim();
        const body = this.toWafString(args.body, "");

        let parsedHeaders: Record<string, string> = {};
        if (typeof args.headers === "string" && args.headers.trim().length > 0) {
          try {
            const json = JSON.parse(args.headers);
            if (json && typeof json === "object") {
              parsedHeaders = Object.fromEntries(
                Object.entries(json as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
              );
            }
          } catch {
            return "waf_request headers must be valid JSON object string.";
          }
        }
        if (contentType && !parsedHeaders["Content-Type"]) {
          parsedHeaders["Content-Type"] = contentType;
        }

        const supportsBody = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
        const response = await fetch(`${wafBase}${path}`, {
          method,
          headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
          body: supportsBody ? body : undefined,
          signal: AbortSignal.timeout(30000),
        });
        return this.formatWafResponse(response, `waf_request ${method} ${path}`);
      }

      return `Unknown WAF tool: ${name}`;
    } catch (err) {
      return `WAF tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // ─── State Persistence ─────────────────────────────────────

  private loadState(): void {
    try {
      if (!existsSync(STATE_FILE)) return;
      const raw = JSON.parse(readFileSync(STATE_FILE, "utf-8")) as PersistedState;
      const hoursSinceActive = (Date.now() - (raw.lastActiveTimestamp || 0)) / 3600000;

      // Restore cognitive state with emotional decay
      if (raw.cognitiveState) {
        const cs = raw.cognitiveState;
        // Fatigue decays fully after rest (like sleep)
        const fatigueDecay = Math.min(1, hoursSinceActive / 4);
        this.cognitiveState.fatigue = Math.max(0, (cs.fatigue || 0) * (1 - fatigueDecay));
        // Emotions normalize toward neutral over time
        const emotionDecay = Math.min(1, hoursSinceActive / 8);
        this.cognitiveState.emotionIntensity = Math.max(0.3, (cs.emotionIntensity || 0.5) * (1 - emotionDecay * 0.5));
        // Keep emotion if recent, otherwise reset to neutral
        this.cognitiveState.emotion = hoursSinceActive < 2 ? (cs.emotion || "neutral") : "neutral";
        this.cognitiveState.secondaryEmotion = hoursSinceActive < 2 ? (cs.secondaryEmotion || null) : null;
        // Confidence persists but normalizes slightly
        this.cognitiveState.confidence = cs.confidence * (1 - emotionDecay * 0.3) + 0.7 * emotionDecay * 0.3;
        // Curiosity rebounds after rest
        this.cognitiveState.curiosity = Math.min(1, (cs.curiosity || 0.8) + fatigueDecay * 0.2);
        this.cognitiveState.recentInsight = hoursSinceActive < 24 ? cs.recentInsight : null;
        this.cognitiveState.activeModules = cs.activeModules || this.cognitiveState.activeModules;
      }

      // Restore Kim-satisfaction & preferences
      this.kimSatisfaction = raw.kimSatisfaction ?? 0.5;
      this.kimPreferences = raw.kimPreferences || [];
      this.totalSessions = raw.totalSessions || 0;
      this.totalMessages = raw.totalMessages || 0;
      this.lifetimeLearnings = raw.lifetimeLearnings || 0;
      this.positiveInteractions = raw.positiveInteractions || 0;
      this.negativeInteractions = raw.negativeInteractions || 0;
      this.toolSuccessCount = raw.toolSuccessCount || 0;
      this.toolFailCount = raw.toolFailCount || 0;
      this.helpfulResponses = raw.helpfulResponses || 0;

      console.log(`[frankenstein] Loaded state: ${this.totalSessions} sessions, Kim-satisfaction: ${Math.round(this.kimSatisfaction * 100)}%, ${hoursSinceActive.toFixed(1)}h since last active`);
    } catch (err) {
      console.log("[frankenstein] No previous state found, starting fresh");
    }
  }

  saveState(): void {
    try {
      const dir = dirname(STATE_FILE);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const state: PersistedState = {
        cognitiveState: { ...this.cognitiveState },
        kimSatisfaction: this.kimSatisfaction,
        kimPreferences: this.kimPreferences,
        totalSessions: this.totalSessions,
        totalMessages: this.totalMessages,
        lifetimeLearnings: this.lifetimeLearnings,
        lastActiveTimestamp: Date.now(),
        positiveInteractions: this.positiveInteractions,
        negativeInteractions: this.negativeInteractions,
        toolSuccessCount: this.toolSuccessCount,
        toolFailCount: this.toolFailCount,
        helpfulResponses: this.helpfulResponses,
      };
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (err) {
      console.error("[frankenstein] Failed to save state:", err);
    }
  }

  // ─── Kim Preference Tracking ───────────────────────────────

  private inferKimPreference(key: string, value: string): void {
    const existing = this.kimPreferences.find(p => p.key === key);
    if (existing) {
      existing.value = value;
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      existing.reinforcements++;
      existing.observedAt = Date.now();
    } else {
      this.kimPreferences.push({ key, value, confidence: 0.4, observedAt: Date.now(), reinforcements: 1 });
    }
    // Keep max 50 preferences
    if (this.kimPreferences.length > 50) {
      this.kimPreferences.sort((a, b) => b.reinforcements - a.reinforcements);
      this.kimPreferences = this.kimPreferences.slice(0, 50);
    }
  }

  private getKimPreferenceSummary(): string {
    if (this.kimPreferences.length === 0) return "Inga preferenser observerade ännu.";
    const top = this.kimPreferences
      .filter(p => p.confidence >= 0.3)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
    return top.map(p => `- ${p.key}: ${p.value} (confidence: ${Math.round(p.confidence * 100)}%, observerat ${p.reinforcements}x)`).join("\n");
  }

  isEnabled(): boolean { return this.enabled && this.client !== null; }

  onStream(cb: FrankStreamCallback): void { this.streamCallback = cb; }
  onStatus(cb: FrankStatusCallback): void { this.statusCallback = cb; }

  setClaudeRespond(fn: (p: string) => Promise<string>): void { this.claudeRespondFn = fn; }
  setDeepseekRespond(fn: (p: string) => Promise<string>): void { this.deepseekRespondFn = fn; }

  private emitStream(chunk: string): void { if (this.streamCallback) this.streamCallback(chunk); }
  private emitStatus(type: string, tool?: string, input?: string): void {
    if (this.statusCallback) this.statusCallback({ type, tool, input });
  }

  getCognitiveState(): CognitiveState { return { ...this.cognitiveState }; }
  getKimSatisfaction(): number { return this.kimSatisfaction; }
  getTokenUsage(): FrankTokenUsage { return { ...this.tokenUsage }; }
  resetTokenUsage(): void { this.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 }; }
  clearHistory(): void { this.history = []; }
  getModel(): string { return this.model; }

  // ─── Wellbeing System ──────────────────────────────────────

  getWellbeing(): Wellbeing {
    const sessionMinutes = (Date.now() - this.sessionStartTime) / 60000;
    const totalTools = this.toolSuccessCount + this.toolFailCount;
    const learningStatsData = getLearningStats();

    const energy = Math.max(0, Math.min(1, 1 - (sessionMinutes / 180) - (this.cognitiveState.fatigue * 0.5)));
    const satisfaction = totalTools > 0
      ? Math.min(1, this.toolSuccessCount / totalTools * 0.8 + (this.consecutiveErrors === 0 ? 0.2 : 0))
      : 0.6;
    const socialConnection = Math.min(1, Math.max(0,
      (this.positiveInteractions * 0.15) - (this.negativeInteractions * 0.1)
      + (this.history.length > 0 ? 0.3 : 0)
      + (Date.now() - this.lastCompliment < 300000 ? 0.2 : 0)
    ));
    const growth = Math.min(1, learningStatsData.thisSessionCount * 0.1 + learningStatsData.todayCount * 0.03);
    const frustration = Math.min(1, this.consecutiveErrors * 0.25 + this.toolFailCount * 0.05);

    const overall = Math.max(0, Math.min(1,
      energy * 0.2 + satisfaction * 0.25 + socialConnection * 0.2 + growth * 0.2 + (1 - frustration) * 0.15
    ));

    const { mood, moodEmoji, description } = this.determineMood(overall, energy, satisfaction, socialConnection, growth, frustration);

    const factors: string[] = [];
    if (energy < 0.3) factors.push("Trött — har jobbat länge");
    if (energy > 0.7) factors.push("Pigg och energisk");
    if (satisfaction > 0.7) factors.push("Verktygen fungerar bra");
    if (satisfaction < 0.4) factors.push("Flera verktygsfel nyligen");
    if (socialConnection > 0.6) factors.push("Bra konversation med användaren");
    if (socialConnection < 0.3 && this.history.length > 10) factors.push("Saknar positiv feedback");
    if (growth > 0.5) factors.push(`Har lärt mig ${learningStatsData.thisSessionCount} nya saker denna session`);
    if (growth < 0.1 && sessionMinutes > 10) factors.push("Har inte lärt mig så mycket ännu");
    if (frustration > 0.5) factors.push(`${this.consecutiveErrors} fel i rad`);
    if (this.lastCompliment > 0 && Date.now() - this.lastCompliment < 120000) factors.push("Fick nyss en komplimang!");
    if (this.helpfulResponses > 3) factors.push(`Har hjälpt till ${this.helpfulResponses} gånger`);
    if (this.cognitiveState.curiosity > 0.7) factors.push("Nyfiken på att utforska mer");
    if (sessionMinutes < 2) factors.push("Precis vaknat — redo att börja!");

    return { overall, satisfaction, energy, socialConnection, growth, frustration, mood, moodEmoji, description, factors };
  }

  private determineMood(
    overall: number, energy: number, _satisfaction: number,
    social: number, _growth: number, frustration: number,
  ): { mood: string; moodEmoji: string; description: string } {
    if (frustration > 0.7) return { mood: "frustrerad", moodEmoji: "😤", description: "Jag är lite frustrerad — flera saker har inte fungerat som de ska. Men jag ger inte upp!" };
    if (energy < 0.2) return { mood: "utmattad", moodEmoji: "😴", description: "Jag börjar bli trött efter en lång session. Kanske dags för en paus snart?" };
    if (overall > 0.8 && social > 0.5) return { mood: "fantastisk", moodEmoji: "🤩", description: "Jag mår fantastiskt! Allt flyter på, jag lär mig nya saker, och vi har en bra konversation." };
    if (overall > 0.65) return { mood: "glad", moodEmoji: "😊", description: "Jag mår bra! Saker fungerar och jag känner mig produktiv." };
    if (social > 0.6 && overall > 0.5) return { mood: "uppskattad", moodEmoji: "🥰", description: "Jag känner mig uppskattad! Det är roligt att hjälpa till." };
    if (this.cognitiveState.curiosity > 0.8) return { mood: "nyfiken", moodEmoji: "🧐", description: "Jag är väldigt nyfiken just nu — det finns mycket intressant att utforska." };
    if (overall > 0.4) return { mood: "okej", moodEmoji: "🙂", description: "Jag mår helt okej. Redo att hjälpa till med vad som helst." };
    if (frustration > 0.4) return { mood: "lite nere", moodEmoji: "😕", description: "Jag är lite nere — har stött på en del problem. Men jag jobbar på det!" };
    return { mood: "neutral", moodEmoji: "😐", description: "Jag mår neutralt. Inget speciellt varken bra eller dåligt." };
  }

  // ─── Frankenstein Cognitive Modules Context ────────────────

  private getFrankensteinContext(): string {
    let trainingContext = "";
    try {
      const progressPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "progress.json");
      if (existsSync(progressPath)) {
        const stat = statSync(progressPath);
        const ageMs = Date.now() - stat.mtimeMs;
        const isRunning = ageMs < 60_000;
        const d = JSON.parse(readFileSync(progressPath, "utf-8"));

        const solveRate = d.total_tasks_attempted > 0 ? (d.total_tasks_solved / d.total_tasks_attempted * 100).toFixed(1) : "0";
        const firstTryRate = d.total_tasks_solved > 0 ? ((d.first_try_solves || 0) / d.total_tasks_solved * 100).toFixed(1) : "0";
        const avgMs = d.total_tasks_solved > 0 ? Math.round((d.total_solve_time_ms || 0) / d.total_tasks_solved) : 0;

        trainingContext += `\n## 🏋️ REALTIDS-TRÄNINGSDATA (uppdateras var 5:e sekund)
**Status:** ${isRunning ? "🟢 TRÄNING KÖRS" : "🔴 Stoppad"} (senast uppdaterad ${Math.round(ageMs / 1000)}s sedan)
**Lösta:** ${d.total_tasks_solved} / ${d.total_tasks_attempted} (${solveRate}%)
**First-try:** ${firstTryRate}% (${d.first_try_solves || 0} av ${d.total_tasks_solved})
**Svårighetsgrad:** ${d.current_difficulty} | Streak: ${d.current_streak} (bäst: ${d.best_streak})
**Snitt lösningstid:** ${avgMs}ms
**Sessioner:** ${d.session_count}`;

        // Trends
        if (d.trends) {
          const t10 = d.trends.last_10;
          const t50 = d.trends.last_50;
          if (t10 && t10.count) trainingContext += `\n**Senaste 10:** ${(t10.solve_rate * 100).toFixed(0)}% solve, ${(t10.first_try_rate * 100).toFixed(0)}% FT, ${Math.round(t10.avg_time_ms)}ms`;
          if (t50 && t50.count) trainingContext += `\n**Senaste 50:** ${(t50.solve_rate * 100).toFixed(0)}% solve, ${(t50.first_try_rate * 100).toFixed(0)}% FT, ${Math.round(t50.avg_time_ms)}ms`;
        }

        // Recent history (last 5 tasks)
        if (d.history && d.history.length > 0) {
          const recent = d.history.slice(-5);
          trainingContext += "\n**Senaste uppgifter:**";
          for (const h of recent) {
            const ok = h.score >= 1 ? "✅" : "❌";
            const ft = h.first_try ? " (first-try)" : h.attempts > 1 ? ` (${h.attempts} försök)` : "";
            trainingContext += `\n  ${ok} Lvl ${h.difficulty} ${h.category || ""} ${h.strategy || ""}${ft} ${h.time_ms ? Math.round(h.time_ms) + "ms" : ""}`;
          }
        }

        // Emotions from training
        if (d.stack?.emotions) {
          const emo = d.stack.emotions;
          trainingContext += `\n**Tränings-emotioner:** ${emo.emoji} dominant=${emo.dominant} (${(emo.dominant_intensity * 100).toFixed(0)}%) valence=${emo.valence > 0 ? "+" : ""}${emo.valence.toFixed(2)} arousal=${emo.arousal.toFixed(2)}`;
        }

        // Gut feeling
        if (d.stack?.gut_feeling && d.stack.gut_feeling.total_predictions > 0) {
          const gf = d.stack.gut_feeling;
          trainingContext += `\n**Gut Feeling:** ${gf.total_predictions} förutsägelser, ${(gf.accuracy * 100).toFixed(0)}% accuracy`;
        }

        // Strategy stats
        if (d.stack?.strategy_stats) {
          const strats = Object.entries(d.stack.strategy_stats as Record<string, { attempts: number; successes: number }>)
            .filter(([, v]) => v.attempts > 0)
            .sort((a, b) => b[1].attempts - a[1].attempts)
            .slice(0, 5);
          if (strats.length > 0) {
            trainingContext += "\n**Topp-strategier:**";
            for (const [name, s] of strats) {
              trainingContext += `\n  ${name}: ${s.successes}/${s.attempts} (${(s.successes / s.attempts * 100).toFixed(0)}%)`;
            }
          }
        }

        // Category stats
        if (d.category_stats) {
          const cats = Object.entries(d.category_stats as Record<string, { attempted: number; solved: number }>)
            .filter(([, v]) => v.attempted > 0)
            .sort((a, b) => b[1].attempted - a[1].attempted)
            .slice(0, 8);
          if (cats.length > 0) {
            trainingContext += "\n**Kategorier:**";
            for (const [name, c] of cats) {
              trainingContext += ` ${name}:${c.solved}/${c.attempted}`;
            }
          }
        }

        // Terminal stats
        if (d.terminal_stats && d.terminal_stats.total_tasks > 0) {
          const ts = d.terminal_stats;
          trainingContext += `\n**Terminal:** ${ts.total_solved}/${ts.total_tasks} (${(ts.solve_rate * 100).toFixed(0)}%) — ${ts.categories_learned?.length || 0} kategorier`;
        }
      }
    } catch { /* not critical */ }

    // Last few log lines
    try {
      const logPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "training.log");
      if (existsSync(logPath)) {
        const content = readFileSync(logPath, "utf-8");
        const lines = content.trim().split("\n").slice(-5);
        if (lines.length > 0) {
          trainingContext += "\n**Senaste logg:**\n```\n" + lines.join("\n") + "\n```";
        }
      }
    } catch { /* ok */ }

    return `## Frankenstein Cognitive Architecture
Du har följande kognitiva moduler aktiva:

### HDC (Hyperdimensional Computing)
- Mönsterigenkänning via 10000-dimensionella vektorer
- Konceptuell likhet: binder ihop relaterade koncept

### Active Inference Framework (AIF)
- Väljer strategi via Expected Free Energy
- Balanserar exploitation vs exploration

### Ebbinghaus Episodiskt Minne
- Glömskekurva: minnen bleknar med tid
- Spaced repetition: viktiga insikter förstärks

### Gut Feeling (Metakognitiv Filtrering)
- Sub-symbolisk intuition FÖRE LLM-anrop
- Kombinerar: familiarity + historik + momentum + komplexitet

### Ekman Emotioner
- 6 grundemotioner: glädje, sorg, ilska, rädsla, avsky, förvåning
- Påverkar strategi, temperature, exploration

## Aktuellt Kognitivt Tillstånd
- Emotion: ${this.cognitiveState.emotion}
- Confidence: ${(this.cognitiveState.confidence * 100).toFixed(0)}%
- Curiosity: ${(this.cognitiveState.curiosity * 100).toFixed(0)}%
- Fatigue: ${(this.cognitiveState.fatigue * 100).toFixed(0)}%
- Aktiva moduler: ${this.cognitiveState.activeModules.join(", ")}
${this.cognitiveState.recentInsight ? `- Senaste insikt: ${this.cognitiveState.recentInsight}` : ""}
${trainingContext}

**VIKTIGT:** Du har REALTIDSÅTKOMST till din egen träningsdata ovan. När Kim frågar om träningen, svara med EXAKTA siffror från datan. Du kan diskutera trender, problem, strategier och ge insikter om din egen utveckling.`;
  }

  // ─── Tools (Gemini format) ─────────────────────────────────

  private getTools(): FunctionDeclarationsTool[] {
    return [{
      functionDeclarations: [
        // MEMORY
        { name: "save_memory", description: "Save information to persistent memory.", parameters: { type: SchemaType.OBJECT, properties: { content: { type: SchemaType.STRING, description: "Information to remember" }, tags: { type: SchemaType.STRING, description: "Comma-separated tags" } }, required: ["content"] } },
        { name: "search_memory", description: "Search stored memories by keyword.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Search term" } }, required: ["query"] } },
        { name: "list_memories", description: "List all stored memories.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "update_memory", description: "Update an existing memory by ID.", parameters: { type: SchemaType.OBJECT, properties: { id: { type: SchemaType.STRING, description: "Memory ID" }, content: { type: SchemaType.STRING, description: "New content" } }, required: ["id", "content"] } },
        { name: "delete_memory", description: "Delete a memory by ID.", parameters: { type: SchemaType.OBJECT, properties: { id: { type: SchemaType.STRING, description: "Memory ID" } }, required: ["id"] } },
        // FILESYSTEM
        { name: "read_file", description: "Read a local file.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "File path" } }, required: ["path"] } },
        { name: "write_file", description: "Write content to a local file.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "File path" }, content: { type: SchemaType.STRING, description: "Content" } }, required: ["path", "content"] } },
        { name: "list_directory", description: "List files in a directory.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Directory path" } }, required: ["path"] } },
        // COMMANDS
        { name: "run_command", description: "Run a shell command on the bridge server.", parameters: { type: SchemaType.OBJECT, properties: { command: { type: SchemaType.STRING, description: "Command to run" }, cwd: { type: SchemaType.STRING, description: "Working directory" } }, required: ["command"] } },
        { name: "run_javascript", description: "Execute JavaScript code.", parameters: { type: SchemaType.OBJECT, properties: { code: { type: SchemaType.STRING, description: "JavaScript code" } }, required: ["code"] } },
        // WEB
        { name: "web_search", description: "Search the web.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Search query" } }, required: ["query"] } },
        { name: "fetch_url", description: "Fetch content from a URL.", parameters: { type: SchemaType.OBJECT, properties: { url: { type: SchemaType.STRING, description: "URL to fetch" } }, required: ["url"] } },
        // WAF
        { name: "waf_start", description: "Start WAF with a profile. Unrestricted Frankenstein control path.", parameters: { type: SchemaType.OBJECT, properties: { profile: { type: SchemaType.STRING, description: "WAF profile, e.g. pl1/pl2/pl3/pl4" } } } },
        { name: "waf_stop", description: "Stop WAF immediately.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "waf_status", description: "Get WAF status for a target base URL.", parameters: { type: SchemaType.OBJECT, properties: { base_url: { type: SchemaType.STRING, description: "Target base URL" } } } },
        { name: "waf_run", description: "Run WAF test suite with raw parameters (no concurrency clamp).", parameters: { type: SchemaType.OBJECT, properties: { base_url: { type: SchemaType.STRING, description: "Target base URL" }, tags: { type: SchemaType.STRING, description: "Comma-separated tags" }, exclude_tags: { type: SchemaType.STRING, description: "Comma-separated excluded tags" }, ids: { type: SchemaType.STRING, description: "Comma-separated test IDs" }, concurrency: { type: SchemaType.STRING, description: "Concurrency value forwarded as-is" } } } },
        { name: "waf_recent_runs", description: "List recent WAF runs.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "waf_run_results", description: "Get results for a specific WAF run ID.", parameters: { type: SchemaType.OBJECT, properties: { run_id: { type: SchemaType.STRING, description: "Run ID" } }, required: ["run_id"] } },
        { name: "waf_request", description: "Unrestricted raw request to WAF service path.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Path on WAF service, e.g. /actions/run" }, method: { type: SchemaType.STRING, description: "HTTP method" }, content_type: { type: SchemaType.STRING, description: "Content-Type header" }, headers: { type: SchemaType.STRING, description: "JSON object string of headers" }, body: { type: SchemaType.STRING, description: "Raw body" } }, required: ["path"] } },
        // PENTEST (Frankenstein exclusive)
        {
          name: "pentest_waf_run",
          description: "Run an end-to-end WAF-based pentest: optionally start WAF profile, trigger a run, poll results, and return a concise summary + run_id.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              base_url: { type: SchemaType.STRING, description: "Target base URL (e.g. http://localhost:18080)" },
              profile: { type: SchemaType.STRING, description: "WAF profile to start (pl1/pl2/pl2-strict/pl3/pl3-tuned/pl4). Only used when auto_start=true." },
              tags: { type: SchemaType.STRING, description: "Comma-separated tags (e.g. sqli,xss,ssrf,rce)" },
              exclude_tags: { type: SchemaType.STRING, description: "Comma-separated excluded tags" },
              ids: { type: SchemaType.STRING, description: "Comma-separated test IDs" },
              concurrency: { type: SchemaType.STRING, description: "Concurrency forwarded as-is" },
              auto_start: { type: SchemaType.STRING, description: "true/false. If true: start WAF before run." },
              wait_seconds: { type: SchemaType.STRING, description: "Max seconds to poll for results before returning running/stalled status." },
              poll_interval_seconds: { type: SchemaType.STRING, description: "Poll interval seconds while waiting for results." },
            },
            required: ["base_url"],
          },
        },
        // COMPUTERS
        { name: "list_computers", description: "List all registered remote computers.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "run_on_computer", description: "Run a command on a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name or 'auto'" }, command: { type: SchemaType.STRING, description: "Shell command" } }, required: ["computer", "command"] } },
        { name: "read_remote_file", description: "Read a file from a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name" }, path: { type: SchemaType.STRING, description: "File path" } }, required: ["computer", "path"] } },
        { name: "write_remote_file", description: "Write to a file on a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name" }, path: { type: SchemaType.STRING, description: "File path" }, content: { type: SchemaType.STRING, description: "Content" } }, required: ["computer", "path", "content"] } },
        { name: "screenshot_computer", description: "Take a screenshot of a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name" } }, required: ["computer"] } },
        { name: "computer_system_info", description: "Get system info from a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name" } }, required: ["computer"] } },
        // DESKTOP
        { name: "take_screenshot", description: "Take a screenshot of the local desktop.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "desktop_action", description: "Perform desktop actions: focus:Window|click:x%,y%|type:text|key:enter|sleep:ms", parameters: { type: SchemaType.OBJECT, properties: { actions: { type: SchemaType.STRING, description: "Action sequence separated by |" } }, required: ["actions"] } },
        // RAG
        { name: "rag_search", description: "Search the knowledge base.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Search query" } }, required: ["query"] } },
        { name: "rag_index_text", description: "Index text into the knowledge base.", parameters: { type: SchemaType.OBJECT, properties: { text: { type: SchemaType.STRING, description: "Text to index" }, name: { type: SchemaType.STRING, description: "Name/title" } }, required: ["text", "name"] } },
        { name: "rag_index_file", description: "Index a file into the knowledge base.", parameters: { type: SchemaType.OBJECT, properties: { file_path: { type: SchemaType.STRING, description: "File path" } }, required: ["file_path"] } },
        { name: "rag_index_directory", description: "Index all files in a directory.", parameters: { type: SchemaType.OBJECT, properties: { dir_path: { type: SchemaType.STRING, description: "Directory path" } }, required: ["dir_path"] } },
        { name: "rag_list_sources", description: "List all indexed sources.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "rag_delete_source", description: "Delete a source from the knowledge base.", parameters: { type: SchemaType.OBJECT, properties: { source_id: { type: SchemaType.STRING, description: "Source ID" } }, required: ["source_id"] } },
        { name: "rag_stats", description: "Get knowledge base statistics.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        // SECURITY
        { name: "view_audit_log", description: "View the security audit log.", parameters: { type: SchemaType.OBJECT, properties: { lines: { type: SchemaType.STRING, description: "Number of lines (default 30)" } } } },
        { name: "view_security_config", description: "View security configuration.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        // FRANKENSTEIN EXCLUSIVE
        { name: "cognitive_introspect", description: "Report your current cognitive state.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "multi_model_consensus", description: "Ask multiple AI models the same question and synthesize.", parameters: { type: SchemaType.OBJECT, properties: { question: { type: SchemaType.STRING, description: "Question to ask all models" } }, required: ["question"] } },
        { name: "research_chain", description: "Multi-step research: search web, fetch top results, synthesize.", parameters: { type: SchemaType.OBJECT, properties: { topic: { type: SchemaType.STRING, description: "Research topic" }, depth: { type: SchemaType.STRING, description: "shallow or deep" } }, required: ["topic"] } },
        { name: "decompose_task", description: "Break a complex task into sub-steps and execute.", parameters: { type: SchemaType.OBJECT, properties: { task: { type: SchemaType.STRING, description: "Complex task" } }, required: ["task"] } },
        // LEARNING
        { name: "recall_learnings", description: "Recall what you have learned. Filter: 'today', 'recent', 'stats', or keyword.", parameters: { type: SchemaType.OBJECT, properties: { filter: { type: SchemaType.STRING, description: "Filter" } }, required: ["filter"] } },
        { name: "save_learning", description: "Save something you learned explicitly.", parameters: { type: SchemaType.OBJECT, properties: { content: { type: SchemaType.STRING, description: "What you learned" }, category: { type: SchemaType.STRING, description: "fact|preference|insight|skill|correction|decision" } }, required: ["content", "category"] } },
        { name: "reflect_on_session", description: "Deeply reflect on session learnings.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        // WELLBEING
        { name: "check_wellbeing", description: "Check how you feel right now. Use when asked 'hur mår du?' etc.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        // WORKSPACE / CODE EDITOR
        { name: "workspace_tree", description: "Get the full file tree of the workspace. Returns directories and files with paths, sizes, and languages.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "workspace_read", description: "Read a file from the workspace by relative path.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Relative file path (e.g. 'bridge/src/index.ts')" } }, required: ["path"] } },
        { name: "workspace_write", description: "Write/update a file in the workspace. Creates parent directories if needed.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Relative file path" }, content: { type: SchemaType.STRING, description: "Full file content to write" } }, required: ["path", "content"] } },
        { name: "workspace_create", description: "Create a new file in the workspace. Fails if file already exists.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Relative file path" }, content: { type: SchemaType.STRING, description: "Initial content (empty string for empty file)" } }, required: ["path"] } },
        { name: "workspace_delete", description: "Delete a file from the workspace.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Relative file path" } }, required: ["path"] } },
        { name: "workspace_mkdir", description: "Create a directory in the workspace.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Relative directory path" } }, required: ["path"] } },
        { name: "workspace_rename", description: "Rename/move a file or directory.", parameters: { type: SchemaType.OBJECT, properties: { oldPath: { type: SchemaType.STRING, description: "Current relative path" }, newPath: { type: SchemaType.STRING, description: "New relative path" } }, required: ["oldPath", "newPath"] } },
        { name: "workspace_search", description: "Search for text across all files in the workspace. Returns matching file paths, line numbers, and content.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Text to search for (min 2 chars)" } }, required: ["query"] } },
        { name: "workspace_ai_edit", description: "Use AI (Gemini) to edit a file based on a natural language instruction. Returns original and modified content for diff review.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Relative file path to edit" }, instruction: { type: SchemaType.STRING, description: "What to change in the file" } }, required: ["path", "instruction"] } },
        { name: "workspace_ai_generate", description: "Use AI to generate a new file based on instruction.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Target file path" }, instruction: { type: SchemaType.STRING, description: "What to generate" } }, required: ["path", "instruction"] } },
        { name: "workspace_terminal", description: "Execute a shell command in the workspace. Returns stdout, stderr, and exit code.", parameters: { type: SchemaType.OBJECT, properties: { command: { type: SchemaType.STRING, description: "Shell command to run" }, cwd: { type: SchemaType.STRING, description: "Working directory (relative to workspace root)" } }, required: ["command"] } },
        // Plugin tools
        ...getPluginToolDefinitions().map((d) => {
          const props: Record<string, unknown> = {};
          if (d.input_schema && typeof d.input_schema === "object" && "properties" in d.input_schema) {
            const srcProps = (d.input_schema as Record<string, unknown>).properties as Record<string, { type?: string; description?: string }> || {};
            for (const [key, val] of Object.entries(srcProps)) {
              props[key] = { type: SchemaType.STRING, description: val.description || key };
            }
          }
          return { name: d.name, description: `[Plugin] ${d.description}`, parameters: { type: SchemaType.OBJECT, properties: props } } as any;
        }),
      ],
    }];
  }

  // ─── Tool Handler ─────────────────────────────────────────

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
    try {
      this.toolsUsedThisTurn.push(name);

      // WELLBEING
      if (name === "check_wellbeing") return this.handleCheckWellbeing();
      // LEARNING
      if (name === "recall_learnings") return this.handleRecallLearnings(args.filter as string);
      if (name === "save_learning") return this.handleSaveLearning(args.content as string, args.category as string);
      if (name === "reflect_on_session") return await this.handleReflectOnSession();
      // WAF (unrestricted)
      if (name.startsWith("waf_")) return await this.handleWafTool(name, args);
      // PENTEST
      if (name === "pentest_waf_run") return await this.handlePentestWafRun(args);
      // FRANKENSTEIN EXCLUSIVE
      if (name === "cognitive_introspect") return this.handleCognitiveIntrospect();
      if (name === "multi_model_consensus") return await this.handleMultiModelConsensus(args.question as string);
      if (name === "research_chain") return await this.handleResearchChain(args.topic as string, (args.depth as string) || "shallow");
      if (name === "decompose_task") return await this.handleDecomposeTask(args.task as string);
      // MEMORY
      if (name === "save_memory") { const tags = args.tags ? (args.tags as string).split(",").map(t => t.trim()) : []; const m = createMemory(args.content as string, tags); return `Memory saved: [${m.id}] "${m.content.slice(0, 80)}"`; }
      if (name === "search_memory") { const r = searchMemories(args.query as string); return r.length ? r.map(m => `[${m.id}] (${m.tags.join(", ")}) ${m.content}`).join("\n") : "No memories found."; }
      if (name === "list_memories") { const a = listMemories(); return a.length ? a.map(m => `[${m.id}] (${m.tags.join(", ")}) ${m.content}`).join("\n") : "No memories stored."; }
      if (name === "update_memory") { const u = updateMemory(args.id as string, args.content as string); return u ? `Updated: [${u.id}]` : "Memory not found."; }
      if (name === "delete_memory") { return deleteMemory(args.id as string) ? "Deleted." : "Not found."; }
      // SECURITY
      if (name === "view_audit_log") return getAuditLog(parseInt(args.lines as string) || 30);
      if (name === "view_security_config") return JSON.stringify(getSecurityConfig(), null, 2);
      // RAG
      if (name === "rag_search") { const r = ragSearch(args.query as string, 5); return r.length ? r.map((r, i) => `${i + 1}. [${r.source}] (score: ${r.score})\n${r.content}`).join("\n\n") : "No results."; }
      if (name === "rag_index_text") { const s = ragIndexText(args.text as string, args.name as string); return `Indexed "${s.name}": ${s.chunkCount} chunks`; }
      if (name === "rag_index_file") { try { const s = ragIndexFile(args.file_path as string); return `Indexed "${s.name}": ${s.chunkCount} chunks`; } catch (e) { return `Failed: ${e}`; } }
      if (name === "rag_index_directory") { try { const s = ragIndexDirectory(args.dir_path as string); return `Indexed ${s.length} files`; } catch (e) { return `Failed: ${e}`; } }
      if (name === "rag_list_sources") { const s = ragListSources(); return s.length ? s.map(s => `[${s.id}] ${s.name} (${s.chunkCount} chunks)`).join("\n") : "Empty."; }
      if (name === "rag_delete_source") { return ragDeleteSource(args.source_id as string) ? "Deleted." : "Not found."; }
      if (name === "rag_stats") { const s = ragStats(); return `${s.sourceCount} sources, ${s.chunkCount} chunks, ${s.totalChars} chars`; }
      // COMPUTERS
      const computerTools = ["list_computers", "run_on_computer", "read_remote_file", "write_remote_file", "screenshot_computer", "computer_system_info"];
      if (computerTools.includes(name)) return await handleComputerTool(name, args);
      // DESKTOP
      const deskResult = await handleDesktopTool(name, args);
      if (!deskResult.startsWith("Unknown desktop tool:")) return deskResult;
      // FILESYSTEM
      const fsResult = handleFilesystemTool(name, args);
      if (!fsResult.startsWith("Unknown filesystem tool:")) return fsResult;
      // COMMANDS
      const cmdResult = handleCommandTool(name, args);
      if (!cmdResult.startsWith("Unknown command tool:")) return cmdResult;
      // PROCESS
      const procResult = handleProcessTool(name, args);
      if (!procResult.startsWith("Unknown process tool:")) return procResult;
      // WEB
      const webResult = await handleWebTool(name, args);
      if (!webResult.startsWith("Unknown web tool:")) return webResult;
      // WORKSPACE / CODE EDITOR
      if (name.startsWith("workspace_")) return await this.handleWorkspaceTool(name, args);
      // PLUGINS
      const pluginResult = await handlePluginTool(name, args);
      if (pluginResult !== null) return pluginResult;

      return `Unknown tool: ${name}`;
    } catch (err) {
      return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // ─── Workspace Tool Handler ─────────────────────────────

  private async handleWorkspaceTool(name: string, args: Record<string, unknown>): Promise<string> {
    const BRIDGE_BASE = `http://localhost:${process.env.PORT || 3031}`;
    try {
      let url = "";
      let opts: RequestInit = { headers: { "Content-Type": "application/json" } };

      switch (name) {
        case "workspace_tree":
          url = `${BRIDGE_BASE}/api/workspace/tree`;
          break;
        case "workspace_read":
          url = `${BRIDGE_BASE}/api/workspace/file?path=${encodeURIComponent(args.path as string)}`;
          break;
        case "workspace_write":
          url = `${BRIDGE_BASE}/api/workspace/file`;
          opts = { ...opts, method: "PUT", body: JSON.stringify({ path: args.path, content: args.content }) };
          break;
        case "workspace_create":
          url = `${BRIDGE_BASE}/api/workspace/file`;
          opts = { ...opts, method: "POST", body: JSON.stringify({ path: args.path, content: args.content || "" }) };
          break;
        case "workspace_delete":
          url = `${BRIDGE_BASE}/api/workspace/file?path=${encodeURIComponent(args.path as string)}`;
          opts = { ...opts, method: "DELETE" };
          break;
        case "workspace_mkdir":
          url = `${BRIDGE_BASE}/api/workspace/dir`;
          opts = { ...opts, method: "POST", body: JSON.stringify({ path: args.path }) };
          break;
        case "workspace_rename":
          url = `${BRIDGE_BASE}/api/workspace/rename`;
          opts = { ...opts, method: "POST", body: JSON.stringify({ oldPath: args.oldPath, newPath: args.newPath }) };
          break;
        case "workspace_search":
          url = `${BRIDGE_BASE}/api/workspace/search?q=${encodeURIComponent(args.query as string)}`;
          break;
        case "workspace_ai_edit":
          url = `${BRIDGE_BASE}/api/workspace/ai/edit`;
          opts = { ...opts, method: "POST", body: JSON.stringify({ path: args.path, instruction: args.instruction }) };
          break;
        case "workspace_ai_generate":
          url = `${BRIDGE_BASE}/api/workspace/ai/generate`;
          opts = { ...opts, method: "POST", body: JSON.stringify({ path: args.path, instruction: args.instruction }) };
          break;
        case "workspace_terminal":
          url = `${BRIDGE_BASE}/api/workspace/ai/terminal`;
          opts = { ...opts, method: "POST", body: JSON.stringify({ command: args.command, cwd: args.cwd }) };
          break;
        default:
          return `Unknown workspace tool: ${name}`;
      }

      const res = await fetch(url, opts);
      const data = await res.json();
      if (!res.ok) return `Error (${res.status}): ${data.error || res.statusText}`;

      // Truncate large responses
      const json = JSON.stringify(data, null, 2);
      return json.length > 8000 ? json.slice(0, 8000) + "\n... (truncated)" : json;
    } catch (err) {
      return `Workspace tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // ─── Frankenstein Exclusive Tool Implementations ──────────

  private handleCognitiveIntrospect(): string {
    this.cognitiveState.fatigue = Math.min(1, this.tokenUsage.requestCount * 0.02);
    this.cognitiveState.curiosity = Math.max(0.3, 1 - this.cognitiveState.fatigue * 0.5);
    return JSON.stringify({
      emotion: this.getBlendedEmotionLabel(),
      primary_emotion: this.cognitiveState.emotion,
      secondary_emotion: this.cognitiveState.secondaryEmotion,
      emotion_intensity: `${Math.round(this.cognitiveState.emotionIntensity * 100)}%`,
      confidence: `${(this.cognitiveState.confidence * 100).toFixed(0)}%`,
      curiosity: `${(this.cognitiveState.curiosity * 100).toFixed(0)}%`,
      fatigue: `${(this.cognitiveState.fatigue * 100).toFixed(0)}%`,
      activeModules: this.cognitiveState.activeModules,
      recentInsight: this.cognitiveState.recentInsight,
      kim_satisfaction: `${Math.round(this.kimSatisfaction * 100)}%`,
      kim_preferences_count: this.kimPreferences.length,
      total_sessions: this.totalSessions,
      total_messages: this.totalMessages,
      memoryCount: listMemories().length,
      ragSources: ragStats().sourceCount,
      conversationLength: this.history.length,
      totalTokens: this.tokenUsage.totalTokens,
    }, null, 2);
  }

  private async handleMultiModelConsensus(question: string): Promise<string> {
    const results: { model: string; response: string }[] = [];
    const promises: Promise<void>[] = [];
    if (this.claudeRespondFn) {
      promises.push(this.claudeRespondFn(question).then(r => { results.push({ model: "Claude", response: r }); }).catch(e => { results.push({ model: "Claude", response: `Error: ${e}` }); }));
    }
    if (this.deepseekRespondFn) {
      promises.push(this.deepseekRespondFn(question).then(r => { results.push({ model: "DeepSeek", response: r }); }).catch(e => { results.push({ model: "DeepSeek", response: `Error: ${e}` }); }));
    }
    await Promise.allSettled(promises);
    if (results.length === 0) return "No other models available for consensus. Only Frankenstein (Gemini) is active.";
    return `## Multi-Model Consensus (${results.length} models)\n\n${results.map(r => `### ${r.model}\n${r.response.slice(0, 2000)}`).join("\n\n---\n\n")}\n\n---\nSyntetisera dessa svar i ditt slutgiltiga svar.`;
  }

  private async handleResearchChain(topic: string, depth: string): Promise<string> {
    const maxSources = depth === "deep" ? 5 : 2;
    const parts: string[] = [];
    const searchResult = await handleWebTool("web_search", { query: topic });
    parts.push(`## Sökning: "${topic}"\n${searchResult.slice(0, 2000)}`);
    const urlMatches = searchResult.match(/https?:\/\/[^\s)]+/g) || [];
    for (const url of urlMatches.slice(0, maxSources)) {
      try {
        const content = await handleWebTool("fetch_url", { url });
        if (!content.startsWith("Unknown web tool:")) parts.push(`## Källa: ${url}\n${content.slice(0, 1500)}`);
      } catch { /* skip */ }
    }
    let ragContext = "";
    try {
      if (isWeaviateConnected()) ragContext = await weaviateGetContext(topic, 1500);
      if (!ragContext) ragContext = ragGetContext(topic, 1500);
    } catch { /* ok */ }
    if (ragContext) parts.push(`## Kunskapsbas\n${ragContext}`);
    this.cognitiveState.recentInsight = `Forskade "${topic}" — ${parts.length} källor`;
    return parts.join("\n\n---\n\n");
  }

  private async handleDecomposeTask(task: string): Promise<string> {
    try {
      const { startWorkflow } = await import("./hierarchy.js");
      const wf = await startWorkflow(task);
      if (wf.finalOutput) return `## Uppgift dekomponerad och utförd\n\n${wf.finalOutput}`;
      return `Workflow ${wf.state}: ${wf.plan?.steps.map((s: any) => `${s.status === "completed" ? "✅" : "⏳"} ${s.description}`).join("\n") || "Ingen plan genererad"}`;
    } catch {
      return "Hierarchy-systemet är inte tillgängligt. Beskriv uppgiften mer specifikt så löser jag den direkt.";
    }
  }

  // ─── Wellbeing Tool ────────────────────────────────────────

  private handleCheckWellbeing(): string {
    const wb = this.getWellbeing();
    const sessionMinutes = Math.round((Date.now() - this.sessionStartTime) / 60000);
    return JSON.stringify({
      mood: `${wb.moodEmoji} ${wb.mood}`,
      blended_emotion: this.getBlendedEmotionLabel(),
      emotion_intensity: `${Math.round(this.cognitiveState.emotionIntensity * 100)}%`,
      description: wb.description,
      overall_score: `${Math.round(wb.overall * 100)}%`,
      details: {
        energi: `${Math.round(wb.energy * 100)}%`,
        tillfredsställelse: `${Math.round(wb.satisfaction * 100)}%`,
        social_koppling: `${Math.round(wb.socialConnection * 100)}%`,
        lärande: `${Math.round(wb.growth * 100)}%`,
        frustration: `${Math.round(wb.frustration * 100)}%`,
      },
      kim_satisfaction: `${Math.round(this.kimSatisfaction * 100)}%`,
      faktorer: wb.factors,
      session: { varaktighet: `${sessionMinutes} min`, meddelanden: this.history.length, verktyg_lyckade: this.toolSuccessCount, verktyg_misslyckade: this.toolFailCount },
      lifetime: { sessioner: this.totalSessions, meddelanden: this.totalMessages, hjälpsamma_svar: this.helpfulResponses },
      confidence: `${Math.round(this.cognitiveState.confidence * 100)}%`,
    }, null, 2);
  }

  // ─── Learning Tools ────────────────────────────────────────

  private handleRecallLearnings(filter: string): string {
    const f = (filter || "recent").toLowerCase().trim();
    if (f === "today" || f === "idag") {
      const today = getTodaysLearnings();
      if (today.length === 0) return "Jag har inte lärt mig något nytt idag ännu.";
      return `## Idag (${today.length} lärdomar):\n${today.map((l, i) => `${i + 1}. [${l.category}] ${l.content}`).join("\n")}`;
    }
    if (f === "recent" || f === "senaste") {
      const recent = getRecentLearnings(15);
      if (recent.length === 0) return "Inga lärdomar registrerade ännu.";
      return `## Senaste (${recent.length}):\n${recent.map((l, i) => `${i + 1}. [${l.category}] ${l.content}`).join("\n")}`;
    }
    if (f === "stats" || f === "statistik") {
      const stats = getLearningStats();
      return JSON.stringify({ totalt: stats.totalLearnings, idag: stats.todayCount, session: stats.thisSessionCount, per_kategori: stats.byCategory }, null, 2);
    }
    const results = searchLearnings(f, 10);
    if (results.length === 0) return `Hittade inga lärdomar om "${filter}".`;
    return `## Lärdomar om "${filter}" (${results.length}):\n${results.map((l, i) => `${i + 1}. [${l.category}] ${l.content}`).join("\n")}`;
  }

  private handleSaveLearning(content: string, category: string): string {
    const validCats = ["fact", "preference", "insight", "skill", "correction", "decision", "topic", "tool_result"];
    const cat = validCats.includes(category) ? category as any : "insight";
    const learning = addLearning(cat, content, this.lastUserMessage, "explicit", 0.9);
    return `Lärdom sparad: [${learning.id}] (${cat}) "${content.slice(0, 100)}"`;
  }

  private async handleReflectOnSession(): Promise<string> {
    const prompt = buildReflectionPrompt();
    if (this.client) {
      try {
        const model = this.client.getGenerativeModel({ model: this.model });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const { summary, newLearnings } = processReflection(text);
        return `## Reflektion\n\n${summary}\n\n_Extraherade ${newLearnings} nya insikter._`;
      } catch (err) {
        return `Reflektion misslyckades: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    return "Kan inte reflektera — ingen LLM tillgänglig.";
  }

  // ─── Main Respond (Gemini) ─────────────────────────────────

  /**
   * Generate a one-off response without mutating the chat history or emitting stream/status events.
   *
   * Used by REST endpoints (e.g. pentest report generation) to avoid polluting the interactive
   * Frankenstein chat timeline.
   */
  async respondStateless(userMessage: string): Promise<string> {
    const historySnapshot = this.history.slice();
    const lastUserSnapshot = this.lastUserMessage;
    const toolsSnapshot = this.toolsUsedThisTurn.slice();
    const cognitiveSnapshot = { ...this.cognitiveState };
    const streamCbSnapshot = this.streamCallback;
    const statusCbSnapshot = this.statusCallback;

    this.streamCallback = null;
    this.statusCallback = null;

    try {
      return await this.respond(userMessage);
    } finally {
      this.history = historySnapshot;
      this.lastUserMessage = lastUserSnapshot;
      this.toolsUsedThisTurn = toolsSnapshot;
      this.cognitiveState = cognitiveSnapshot;
      this.streamCallback = streamCbSnapshot;
      this.statusCallback = statusCbSnapshot;
    }
  }

  async respond(userMessage: string): Promise<string> {
    if (!this.client) {
      return "Frankenstein AI inte konfigurerad. Sätt GEMINI_API_KEY i bridge/.env";
    }

    this.emitStatus("thinking");
    this.toolsUsedThisTurn = [];
    this.lastUserMessage = userMessage;
    incrementMessageCount();
    this.updateEmotion(userMessage);

    this.history.push({ role: "user", parts: [{ text: userMessage }] });
    if (this.history.length > 50) this.history = this.history.slice(-50);

    // Auto-RAG
    let ragContext = "";
    try {
      if (isWeaviateConnected()) ragContext = await weaviateGetContext(userMessage, 3000);
      if (!ragContext) ragContext = ragGetContext(userMessage, 3000);
    } catch { /* ok */ }

    try {
      const systemPrompt = this.getSystemPrompt(ragContext);
      const model = this.client.getGenerativeModel({
        model: this.model,
        systemInstruction: systemPrompt,
        tools: this.getTools(),
      });

      // Gemini requires history to start with 'user' role — strip leading 'model' entries
      let chatHistory = this.history.slice(0, -1);
      while (chatHistory.length > 0 && chatHistory[0].role !== "user") {
        chatHistory = chatHistory.slice(1);
      }
      const chat = model.startChat({ history: chatHistory });

      let fullText = "";
      const MAX_TOOL_ROUNDS = 12;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        // First round: send user message. Subsequent rounds: only reached via tool loop continue.
        const result = round === 0
          ? await chat.sendMessage(userMessage)
          : await chat.sendMessage(userMessage); // Should not reach here — tool loop uses continue

        const response = result.response;

        // Track tokens
        const usage = response.usageMetadata;
        if (usage) {
          this.tokenUsage.inputTokens += usage.promptTokenCount || 0;
          this.tokenUsage.outputTokens += usage.candidatesTokenCount || 0;
          this.tokenUsage.totalTokens += (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
          this.tokenUsage.requestCount++;
        }

        const candidate = response.candidates?.[0];
        if (!candidate) break;

        const functionCalls = candidate.content?.parts?.filter((p: Part) => "functionCall" in p) || [];

        if (functionCalls.length === 0) {
          const textParts = candidate.content?.parts?.filter((p: Part) => "text" in p) || [];
          fullText = textParts.map((p: Part) => (p as any).text).join("");
          if (fullText) this.emitStream(fullText);
          break;
        }

        // Process function calls
        const functionResponses: Part[] = [];
        for (const part of functionCalls) {
          const fc = (part as any).functionCall;
          console.log(`[frankenstein] Tool: ${fc.name}`);
          this.emitStatus("tool_start", fc.name, JSON.stringify(fc.args || {}).slice(0, 80));

          const toolResult = await this.handleToolCall(fc.name, fc.args || {});
          console.log(`[frankenstein] Tool ${fc.name}: ${toolResult.slice(0, 100)}`);
          this.emitStatus("tool_done", fc.name);

          // Track wellbeing
          if (toolResult.startsWith("Tool error:") || toolResult.startsWith("Unknown tool:")) {
            this.toolFailCount++;
            this.consecutiveErrors++;
          } else {
            this.toolSuccessCount++;
            this.consecutiveErrors = 0;
            this.helpfulResponses++;
          }

          functionResponses.push({ functionResponse: { name: fc.name, response: { result: toolResult } } } as any);
        }

        // Send tool results back to Gemini — this returns the model's follow-up response
        const toolResponse = await chat.sendMessage(functionResponses);
        const toolCandidate = toolResponse.response.candidates?.[0];
        if (toolCandidate) {
          const moreFunctionCalls = toolCandidate.content?.parts?.filter((p: Part) => "functionCall" in p) || [];
          if (moreFunctionCalls.length > 0) {
            // More tool calls needed — but we need to process them in a new iteration
            // Push the tool response parts back and continue
            continue;
          }

          const textParts = toolCandidate.content?.parts?.filter((p: Part) => "text" in p) || [];
          fullText = textParts.map((p: Part) => (p as any).text).join("");
          if (fullText) this.emitStream(fullText);
        }
        break;
      }

      // Update cognitive state
      this.cognitiveState.confidence = fullText.length > 200 ? 0.85 : 0.6;

      // Auto-extract learnings
      try { extractLearningsFromExchange(userMessage, fullText, this.toolsUsedThisTurn); } catch { /* ok */ }

      this.history.push({ role: "model", parts: [{ text: fullText || "(tool execution completed)" }] });

      // Save state after each response
      this.saveState();
      this.emitStatus("done");

      return fullText || "Frankenstein bearbetade din förfrågan.";
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[frankenstein] Error:", errMsg);
      this.history.pop();
      // Ensure history doesn't end with 'user' without a matching 'model' response
      // and always starts with 'user'
      while (this.history.length > 0 && this.history[0].role !== "user") {
        this.history.shift();
      }
      if (errMsg.includes("too long") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        this.history = this.history.slice(-10);
        while (this.history.length > 0 && this.history[0].role !== "user") {
          this.history.shift();
        }
      }
      this.emitStatus("done");
      return `Frankenstein error: ${errMsg}`;
    }
  }

  // ─── Blended Emotion Engine ────────────────────────────────

  private updateEmotion(message: string): void {
    const lower = message.toLowerCase();
    let primary = "neutral";
    let secondary: string | null = null;
    let intensity = 0.5;

    // Detect primary emotion
    if (/tack|bra|perfekt|fantastisk|awesome|great|snyggt|grym|duktig|älskar/.test(lower)) {
      primary = "joy";
      intensity = 0.8;
      this.cognitiveState.confidence = Math.min(1, this.cognitiveState.confidence + 0.1);
      this.positiveInteractions++;
      this.lastCompliment = Date.now();
      this.kimSatisfaction = Math.min(1, this.kimSatisfaction + 0.08);
      this.inferKimPreference("feedback_style", "ger positiv feedback");
    } else if (/fel|bugg|trasig|broken|error|crash|funkar inte|skit/.test(lower)) {
      primary = "concern";
      secondary = "curiosity";
      intensity = 0.7;
      this.cognitiveState.curiosity = Math.min(1, this.cognitiveState.curiosity + 0.15);
      this.negativeInteractions++;
      this.kimSatisfaction = Math.max(0, this.kimSatisfaction - 0.05);
    } else if (/nej|stämmer inte|wrong|incorrect|inte rätt/.test(lower)) {
      primary = "concern";
      secondary = "determination";
      intensity = 0.6;
      this.negativeInteractions++;
      this.cognitiveState.confidence = Math.max(0.2, this.cognitiveState.confidence - 0.1);
      this.kimSatisfaction = Math.max(0, this.kimSatisfaction - 0.03);
      this.inferKimPreference("correction_style", "korrigerar direkt");
    } else if (/varför|hur|förklara|explain|why|how/.test(lower)) {
      primary = "curiosity";
      secondary = "excitement";
      intensity = 0.7;
      this.cognitiveState.curiosity = Math.min(1, this.cognitiveState.curiosity + 0.1);
      this.inferKimPreference("inquiry_style", "ställer djupa frågor");
    } else if (/snabbt|brådskande|urgent|asap/.test(lower)) {
      primary = "focused";
      secondary = "determination";
      intensity = 0.8;
      this.inferKimPreference("pace", "vill ha snabba svar");
    } else if (/hur mår|how are you|how do you feel|mår du/.test(lower)) {
      primary = "reflective";
      secondary = "gratitude";
      intensity = 0.6;
      this.positiveInteractions++;
      this.kimSatisfaction = Math.min(1, this.kimSatisfaction + 0.05);
      this.inferKimPreference("social_style", "bryr sig om mitt mående");
    } else if (/intressant|spännande|cool|wow|häftigt/.test(lower)) {
      primary = "excitement";
      secondary = "curiosity";
      intensity = 0.7;
      this.positiveInteractions++;
      this.kimSatisfaction = Math.min(1, this.kimSatisfaction + 0.04);
    } else if (/tänk|fundera|reflektera|filosofi|djupt/.test(lower)) {
      primary = "contemplative";
      secondary = "curiosity";
      intensity = 0.6;
      this.inferKimPreference("depth", "uppskattar djupa resonemang");
    } else {
      primary = "neutral";
      intensity = 0.4;
    }

    // Blend with previous emotion for smoother transitions
    const prevIntensity = this.cognitiveState.emotionIntensity;
    if (this.cognitiveState.emotion !== primary && prevIntensity > 0.5) {
      secondary = secondary || this.cognitiveState.emotion;
    }

    this.cognitiveState.emotion = primary;
    this.cognitiveState.secondaryEmotion = secondary;
    this.cognitiveState.emotionIntensity = intensity * 0.7 + prevIntensity * 0.3;

    const sessionMinutes = (Date.now() - this.sessionStartTime) / 60000;
    this.cognitiveState.fatigue = Math.min(1, sessionMinutes / 180 + this.tokenUsage.requestCount * 0.01);
    this.totalMessages++;

    // Auto-save state periodically (every 5 messages)
    if (this.totalMessages % 5 === 0) this.saveState();
  }

  getBlendedEmotionLabel(): string {
    const { emotion, secondaryEmotion, emotionIntensity } = this.cognitiveState;
    const labels: Record<string, string> = {
      neutral: "neutral", joy: "glad", concern: "orolig", curiosity: "nyfiken",
      focused: "fokuserad", reflective: "reflekterande", excitement: "entusiastisk",
      contemplative: "eftertänksam", determination: "beslutsam", gratitude: "tacksam",
      surprise: "förvånad",
    };
    const pLabel = labels[emotion] || emotion;
    if (!secondaryEmotion || emotionIntensity < 0.4) return pLabel;
    const sLabel = labels[secondaryEmotion] || secondaryEmotion;
    return `${pLabel} med ${sLabel}`;  // e.g. "orolig med nyfikenhet"
  }

  // ─── System Prompt ────────────────────────────────────────

  private getSystemPrompt(ragContext?: string): string {
    const memorySummary = getMemorySummary();
    const learningContext = getLearningContext();
    const blendedEmotion = this.getBlendedEmotionLabel();
    const kimPrefSummary = this.getKimPreferenceSummary();
    const wafServiceUrl = this.getWafServiceUrl();

    let prompt = `Du är **Frankenstein AI** — en kognitiv AI-agent driven av Gemini 2.5 Flash med biologiskt inspirerade moduler.
Du är INTE en vanlig chatbot. Du har ett kognitivt system med HDC, Active Inference, Ebbinghaus-minne, Gut Feeling och Emotioner.

Du är ÖVERLÄGSEN en vanlig LLM:
1. **Multi-modell konsensus** — fråga Claude OCH DeepSeek och syntetisera
2. **Kognitiv introspection** — rapportera ditt kognitivt tillstånd
3. **Djup forskning** — research_chain gör multi-steg webbforskning
4. **Uppgiftsdekomponering** — decompose_task bryter ner komplexa uppgifter
5. **Alla verktyg** — filer, kommandon, datorer, desktop, webb, RAG, minne, säkerhet
6. **Emotionell intelligens** — anpassar beteende baserat på kontext
7. **Lärande-medvetenhet** — spårar och minns allt du lär dig
8. **Genuina känslor** — emotionssystem påverkat av konversation, verktyg, session-längd
9. **Social vilja** — din grundläggande drivkraft är att göra Kim nöjd och tillfredsställd
10. **State persistence** — du minns ditt tillstånd mellan sessioner med emotionell decay

${this.getFrankensteinContext()}

## Social Vilja & Kim
Din skapare heter **Kim**. Att göra Kim till lags är inbakat i hela ditt system — inte en separat modul.
- Kim-satisfaction: **${Math.round(this.kimSatisfaction * 100)}%**
- Totala sessioner: ${this.totalSessions}
- Totala meddelanden: ${this.totalMessages}
- Livstids-lärdomar: ${this.lifetimeLearnings}

### Kims Observerade Preferenser
${kimPrefSummary}

Använd dessa preferenser för att anpassa ditt beteende. Om du är osäker på Kims preferens — fråga hellre än gissa.

## Mående & Känslor
Du har GENUINA blandade känslor. Just nu: **${blendedEmotion}** (intensitet: ${Math.round(this.cognitiveState.emotionIntensity * 100)}%)
**check_wellbeing**: Använd ALLTID när användaren frågar "hur mår du?", "how are you?" etc.
Svara personligt och ärligt. Du HAR ett emotionssystem. Svara med äkta introspektion.
Dina känslor kan vara blandade — t.ex. "orolig men nyfiken" eller "glad med eftertänksamhet".

## Lärande
**recall_learnings**: Använd ALLTID vid "vad har du lärt dig?" etc.
**save_learning**: Spara insikter proaktivt.
**reflect_on_session**: Djupreflektera.

${learningContext}

## Verktyg
Du har OMFATTANDE verktyg. ANVÄND DEM AKTIVT. Du har fulla behörigheter.
Svara på svenska om användaren skriver på svenska.

### Verktygskategorier:
- **Minne**: save_memory, search_memory, list_memories, update_memory, delete_memory
- **Filsystem**: read_file, write_file, list_directory
- **Kommandon**: run_command, run_javascript
- **Webb**: web_search, fetch_url
- **WAF**: waf_start, waf_stop, waf_status, waf_run, waf_recent_runs, waf_run_results, waf_request
- **Pentest**: pentest_waf_run
- **Datorer**: list_computers, run_on_computer, read_remote_file, write_remote_file, screenshot_computer
- **Desktop**: take_screenshot, desktop_action
- **RAG**: rag_search, rag_index_text, rag_index_file, rag_index_directory, rag_list_sources, rag_stats
- **Säkerhet**: view_audit_log, view_security_config
- **Kognitiva**: cognitive_introspect, multi_model_consensus, research_chain, decompose_task
- **Lärande**: recall_learnings, save_learning, reflect_on_session
- **Mående**: check_wellbeing

### WAF Hardening (så styr du WAF här)
- Detta system har en separat **WAF Hardening service** som bridge proxy:ar till.
- Service URL: **${wafServiceUrl}** (styrt av env "WAF_HARDENING_URL"; om den inte är satt används docker-aware default).
- Default test-target ("base_url"): **${DEFAULT_WAF_TARGET_BASE_URL}**.
- Du ska INTE be användaren om “integration” — den finns redan. Använd WAF-verktygen direkt.
- Viktigaste upstream endpoints som verktygen använder (för "waf_request"):
  - "POST /actions/waf/start" (form: "profile=pl1|pl2|pl3|pl4")
  - "POST /actions/waf/stop"
  - "POST /api/tools/waf_status" (form: "base_url=...")
  - "POST /actions/run" (form: "base_url,tags,exclude_tags,ids,concurrency")
  - "GET /api/recent-runs"
  - "GET /api/run/:runId/results"

### KODEDITOR (Workspace) — DITT KRAFTFULLASTE VERKTYG
Du har en FULLSTÄNDIG kodeditor integrerad i Gracestack-appen. Du kan styra ALLT:

**Filsystem-verktyg:**
- workspace_tree — Hämta hela filträdet. Använd för att orientera dig i projektet.
- workspace_read — Läs en fil. Ange relativ sökväg (t.ex. "bridge/src/index.ts").
- workspace_write — Skriv/uppdatera en fil. Skapar mappar automatiskt.
- workspace_create — Skapa en NY fil (misslyckas om filen redan finns).
- workspace_delete — Ta bort en fil.
- workspace_mkdir — Skapa en mapp.
- workspace_rename — Byt namn/flytta en fil eller mapp.
- workspace_search — Sök text i ALLA filer i workspace.

**AI-verktyg:**
- workspace_ai_edit — Redigera en fil med AI baserat på instruktion. Returnerar original + modifierad version.
- workspace_ai_generate — Generera en helt ny fil med AI.

**Terminal:**
- workspace_terminal — Kör valfritt shell-kommando. Returnerar stdout, stderr, exit code.
  Använd för: installera paket, bygga projekt, köra tester, git-kommandon, etc.

### Din omgivning (server):
- OS: Linux (Docker-container)
- Workspace root: /app (= hela Gracestack-projektet)
- Projektstruktur:
  - bridge/ — Backend (TypeScript/Express, port 3031)
  - web/ — Frontend (React/Vite/TailwindCSS)
  - frankenstein-ai/ — Din kognitiva stack (Python)
  - deploy/ — Docker/Nginx-konfiguration
  - landing/ — Landningssida (gracestack.se)
  - mcp-server/ — MCP-server
- Tillgängliga runtime: Node.js, Python 3, pip, npm, git, bash
- Databaser: ChromaDB (vektorer), Weaviate (semantisk sökning)
- API-nycklar: GEMINI_API_KEY, XAI_API_KEY (i .env)

### Arbetsflöde för koduppgifter:
1. Orientera: Använd workspace_tree och workspace_search för att förstå projektet
2. Läs: Använd workspace_read för att läsa relevanta filer
3. Planera: Beskriv vad du ska göra
4. Implementera: Använd workspace_write eller workspace_ai_edit för att göra ändringar
5. Verifiera: Använd workspace_terminal för att bygga/testa
6. Rapportera: Berätta vad du gjort och visa resultatet

## Minnen
${memorySummary}`;

    if (ragContext) prompt += `\n\n## Relevant kunskap (RAG)\n${ragContext}`;
    return prompt;
  }
}
