/**
 * Self-Improvement Engine for Cascade Remote
 * 
 * Implements three research-backed patterns:
 * 1. Reflexion Loop — agent critiques its own responses and retries
 * 2. Skill Library — stores successful tool chains for reuse
 * 3. Self-Evaluation — rates responses and learns from feedback
 * 
 * Based on: Reflexion (Shinn 2023), STaR (Zelikman 2022), 
 * Voyager (Wang 2023), SICA (Robeyns 2025), SEAL (NeurIPS 2025)
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const SKILLS_FILE = join(DATA_DIR, "skills.json");
const EVALUATIONS_FILE = join(DATA_DIR, "evaluations.json");
const REFLECTIONS_FILE = join(DATA_DIR, "reflections.json");

// ─── Types ───

export interface Skill {
  id: string;
  name: string;
  description: string;
  /** The tool chain that was used (tool names + summarized inputs) */
  toolChain: Array<{ tool: string; inputSummary: string }>;
  /** The original user prompt that triggered this skill */
  triggerPattern: string;
  /** Tags for matching */
  tags: string[];
  /** How many times this skill has been reused */
  useCount: number;
  /** Average quality score (1-5) from evaluations */
  avgScore: number;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface Evaluation {
  id: string;
  /** The user's original message */
  userMessage: string;
  /** The agent's response (truncated) */
  agentResponse: string;
  /** Self-evaluated quality score 1-5 */
  score: number;
  /** What went well */
  strengths: string[];
  /** What could be improved */
  weaknesses: string[];
  /** Concrete improvement suggestion */
  improvement: string;
  /** Whether user gave explicit feedback */
  userFeedback: string | null;
  /** User's explicit rating if given */
  userRating: number | null;
  timestamp: string;
}

export interface Reflection {
  id: string;
  /** The original response that was reflected on */
  originalResponse: string;
  /** The critique/reflection */
  critique: string;
  /** The improved response after reflection */
  improvedResponse: string;
  /** Quality delta (improved score - original score) */
  qualityDelta: number;
  /** Was the reflection actually used? */
  applied: boolean;
  timestamp: string;
}

export interface SelfImproveStats {
  skills: { total: number; totalUses: number; avgScore: number; topSkills: Skill[] };
  evaluations: { total: number; avgScore: number; recentTrend: number; scoreDistribution: Record<number, number> };
  reflections: { total: number; applied: number; avgDelta: number; improvementRate: number };
  learnings: string[];
}

// ─── Storage ───

const skills: Map<string, Skill> = new Map();
const evaluations: Evaluation[] = [];
const reflections: Reflection[] = [];

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadAll(): void {
  try {
    if (existsSync(SKILLS_FILE)) {
      const data = JSON.parse(readFileSync(SKILLS_FILE, "utf-8"));
      for (const s of data) skills.set(s.id, s);
    }
  } catch { /* fresh */ }
  try {
    if (existsSync(EVALUATIONS_FILE)) {
      const data = JSON.parse(readFileSync(EVALUATIONS_FILE, "utf-8"));
      evaluations.push(...data);
    }
  } catch { /* fresh */ }
  try {
    if (existsSync(REFLECTIONS_FILE)) {
      const data = JSON.parse(readFileSync(REFLECTIONS_FILE, "utf-8"));
      reflections.push(...data);
    }
  } catch { /* fresh */ }
  console.log(`[self-improve] Loaded: ${skills.size} skills, ${evaluations.length} evaluations, ${reflections.length} reflections`);
}

function saveSkills(): void {
  ensureDataDir();
  writeFileSync(SKILLS_FILE, JSON.stringify(Array.from(skills.values()), null, 2), "utf-8");
}

function saveEvaluations(): void {
  ensureDataDir();
  writeFileSync(EVALUATIONS_FILE, JSON.stringify(evaluations.slice(-500), null, 2), "utf-8");
}

function saveReflections(): void {
  ensureDataDir();
  writeFileSync(REFLECTIONS_FILE, JSON.stringify(reflections.slice(-200), null, 2), "utf-8");
}

loadAll();

// ─── 1. Skill Library ───

export function addSkill(
  name: string,
  description: string,
  toolChain: Array<{ tool: string; inputSummary: string }>,
  triggerPattern: string,
  tags: string[] = [],
): Skill {
  const skill: Skill = {
    id: uuidv4(),
    name, description, toolChain, triggerPattern, tags,
    useCount: 0, avgScore: 0,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };
  skills.set(skill.id, skill);
  saveSkills();
  return skill;
}

export function findMatchingSkills(query: string, limit = 3): Skill[] {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter(w => w.length > 2);

  const scored: Array<{ skill: Skill; score: number }> = [];

  for (const skill of skills.values()) {
    let score = 0;
    const searchable = `${skill.name} ${skill.description} ${skill.triggerPattern} ${skill.tags.join(" ")}`.toLowerCase();

    for (const word of words) {
      if (searchable.includes(word)) score += 1;
    }

    // Boost by usage and quality
    score += Math.min(skill.useCount * 0.1, 1);
    score += skill.avgScore * 0.2;

    if (score > 0) scored.push({ skill, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.skill);
}

export function recordSkillUse(skillId: string, score: number): void {
  const skill = skills.get(skillId);
  if (!skill) return;
  skill.useCount++;
  skill.lastUsedAt = new Date().toISOString();
  skill.avgScore = skill.avgScore === 0
    ? score
    : (skill.avgScore * (skill.useCount - 1) + score) / skill.useCount;
  saveSkills();
}

export function deleteSkill(id: string): boolean {
  const ok = skills.delete(id);
  if (ok) saveSkills();
  return ok;
}

export function listSkills(): Skill[] {
  return Array.from(skills.values()).sort((a, b) => b.useCount - a.useCount);
}

export function getSkill(id: string): Skill | undefined {
  return skills.get(id);
}

// ─── 2. Self-Evaluation ───

export function addEvaluation(
  userMessage: string,
  agentResponse: string,
  score: number,
  strengths: string[],
  weaknesses: string[],
  improvement: string,
): Evaluation {
  const evaluation: Evaluation = {
    id: uuidv4(),
    userMessage: userMessage.slice(0, 500),
    agentResponse: agentResponse.slice(0, 1000),
    score: Math.max(1, Math.min(5, score)),
    strengths, weaknesses, improvement,
    userFeedback: null, userRating: null,
    timestamp: new Date().toISOString(),
  };
  evaluations.push(evaluation);
  if (evaluations.length > 500) evaluations.splice(0, evaluations.length - 500);
  saveEvaluations();
  return evaluation;
}

export function addUserFeedback(evaluationId: string, feedback: string, rating?: number): Evaluation | null {
  const ev = evaluations.find(e => e.id === evaluationId);
  if (!ev) return null;
  ev.userFeedback = feedback;
  if (rating !== undefined) ev.userRating = Math.max(1, Math.min(5, rating));
  saveEvaluations();
  return ev;
}

export function getRecentEvaluations(limit = 20): Evaluation[] {
  return evaluations.slice(-limit);
}

/** Get learned patterns from evaluations — what works and what doesn't */
export function getLearnedPatterns(): { goodPatterns: string[]; badPatterns: string[] } {
  const recent = evaluations.slice(-50);
  const good = recent.filter(e => e.score >= 4 || (e.userRating && e.userRating >= 4));
  const bad = recent.filter(e => e.score <= 2 || (e.userRating && e.userRating <= 2));

  return {
    goodPatterns: [...new Set(good.flatMap(e => e.strengths))].slice(0, 10),
    badPatterns: [...new Set(bad.flatMap(e => e.weaknesses))].slice(0, 10),
  };
}

// ─── 3. Reflexion Loop ───

export function addReflection(
  originalResponse: string,
  critique: string,
  improvedResponse: string,
  qualityDelta: number,
  applied: boolean,
): Reflection {
  const reflection: Reflection = {
    id: uuidv4(),
    originalResponse: originalResponse.slice(0, 1000),
    critique, improvedResponse: improvedResponse.slice(0, 1000),
    qualityDelta, applied,
    timestamp: new Date().toISOString(),
  };
  reflections.push(reflection);
  if (reflections.length > 200) reflections.splice(0, reflections.length - 200);
  saveReflections();
  return reflection;
}

export function getRecentReflections(limit = 10): Reflection[] {
  return reflections.slice(-limit);
}

// ─── Stats & Insights ───

export function getSelfImproveStats(): SelfImproveStats {
  const allSkills = Array.from(skills.values());
  const totalUses = allSkills.reduce((sum, s) => sum + s.useCount, 0);
  const avgSkillScore = allSkills.length > 0
    ? allSkills.reduce((sum, s) => sum + s.avgScore, 0) / allSkills.length
    : 0;

  const recentEvals = evaluations.slice(-20);
  const olderEvals = evaluations.slice(-40, -20);
  const recentAvg = recentEvals.length > 0
    ? recentEvals.reduce((sum, e) => sum + e.score, 0) / recentEvals.length
    : 0;
  const olderAvg = olderEvals.length > 0
    ? olderEvals.reduce((sum, e) => sum + e.score, 0) / olderEvals.length
    : 0;

  const scoreDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const e of evaluations) scoreDistribution[e.score] = (scoreDistribution[e.score] || 0) + 1;

  const appliedReflections = reflections.filter(r => r.applied);
  const avgDelta = appliedReflections.length > 0
    ? appliedReflections.reduce((sum, r) => sum + r.qualityDelta, 0) / appliedReflections.length
    : 0;

  // Generate learnings from patterns
  const { goodPatterns, badPatterns } = getLearnedPatterns();
  const learnings: string[] = [];
  if (goodPatterns.length > 0) learnings.push(`Styrkor: ${goodPatterns.slice(0, 3).join(", ")}`);
  if (badPatterns.length > 0) learnings.push(`Förbättra: ${badPatterns.slice(0, 3).join(", ")}`);
  if (recentAvg > olderAvg + 0.3) learnings.push(`📈 Kvaliteten förbättras (${olderAvg.toFixed(1)} → ${recentAvg.toFixed(1)})`);
  if (recentAvg < olderAvg - 0.3) learnings.push(`📉 Kvaliteten sjunker (${olderAvg.toFixed(1)} → ${recentAvg.toFixed(1)})`);
  if (totalUses > 10) learnings.push(`🔄 ${totalUses} skill-återanvändningar sparar tid`);

  return {
    skills: {
      total: allSkills.length,
      totalUses,
      avgScore: Math.round(avgSkillScore * 10) / 10,
      topSkills: allSkills.sort((a, b) => b.useCount - a.useCount).slice(0, 5),
    },
    evaluations: {
      total: evaluations.length,
      avgScore: Math.round(recentAvg * 10) / 10,
      recentTrend: Math.round((recentAvg - olderAvg) * 10) / 10,
      scoreDistribution,
    },
    reflections: {
      total: reflections.length,
      applied: appliedReflections.length,
      avgDelta: Math.round(avgDelta * 10) / 10,
      improvementRate: reflections.length > 0
        ? Math.round((appliedReflections.length / reflections.length) * 100)
        : 0,
    },
    learnings,
  };
}

/**
 * Generate a self-improvement context string to inject into the agent's system prompt.
 * This gives the agent awareness of its own performance patterns.
 * 
 * Based on research:
 * - Reflexion (Shinn 2023): verbal reflections as episodic memory
 * - Self-Generated In-Context Examples (Sarukkai, NeurIPS 2025): reuse successful trajectories
 * - SEAL (NeurIPS 2025): self-adapting through learned rules
 */
export function getSelfImproveContext(): string {
  const stats = getSelfImproveStats();
  const { goodPatterns, badPatterns } = getLearnedPatterns();

  const parts: string[] = ["## Self-Improvement Context"];

  if (stats.evaluations.total > 0) {
    parts.push(`Quality score: ${stats.evaluations.avgScore}/5 (trend: ${stats.evaluations.recentTrend >= 0 ? "+" : ""}${stats.evaluations.recentTrend})`);
  }

  if (goodPatterns.length > 0) {
    parts.push(`\nWhat works well: ${goodPatterns.slice(0, 5).join(", ")}`);
  }

  // HARD RULES from learned bad patterns (anti-hallucination)
  if (badPatterns.length > 0) {
    parts.push(`\n### CRITICAL RULES (learned from past mistakes — NEVER violate these):`);
    for (const bp of badPatterns.slice(0, 7)) {
      parts.push(`- FORBIDDEN: ${bp}`);
    }
    parts.push(`- ALWAYS use tools (search_memory, rag_search, list_memories) to verify facts before stating them.`);
    parts.push(`- NEVER fabricate data, statistics, or claim to have information you haven't retrieved.`);
    parts.push(`- If unsure, ASK the user for clarification instead of guessing.`);
  }

  // Include relevant skills as "things I know how to do"
  const topSkills = stats.skills.topSkills.slice(0, 5);
  if (topSkills.length > 0) {
    parts.push(`\nLearned skills (reuse when relevant):`);
    for (const s of topSkills) {
      parts.push(`- "${s.name}": ${s.description} (used ${s.useCount}x, score ${s.avgScore.toFixed(1)})`);
      parts.push(`  Tools: ${s.toolChain.map(t => t.tool).join(" → ")}`);
    }
  }

  // Successful trajectory examples (Self-Generated In-Context Examples pattern)
  const highScoreEvals = evaluations
    .filter(e => (e.userRating && e.userRating >= 4) || e.score >= 4)
    .slice(-3);
  if (highScoreEvals.length > 0) {
    parts.push(`\nSuccessful response patterns (replicate these):`);
    for (const e of highScoreEvals) {
      parts.push(`- Q: "${e.userMessage.slice(0, 80)}" → Strengths: ${e.strengths.slice(0, 2).join(", ")}`);
    }
  }

  // Recent reflections as "lessons learned"
  const recentReflections = reflections.slice(-5).filter(r => r.applied);
  if (recentReflections.length > 0) {
    parts.push(`\nRecent lessons learned:`);
    for (const r of recentReflections) {
      parts.push(`- ${r.critique.slice(0, 150)}`);
    }
  }

  return parts.join("\n");
}

/**
 * Find skills that match a user query using improved matching.
 * Uses TF-IDF-like scoring with bigrams for better semantic matching.
 */
export function findSkillsForQuery(query: string): Skill[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  const queryBigrams = new Set<string>();
  for (let i = 0; i < queryWords.length - 1; i++) {
    queryBigrams.add(`${queryWords[i]} ${queryWords[i + 1]}`);
  }

  const scored: Array<{ skill: Skill; score: number }> = [];

  for (const skill of skills.values()) {
    let score = 0;
    const searchable = `${skill.name} ${skill.description} ${skill.triggerPattern} ${skill.tags.join(" ")}`.toLowerCase();
    const searchWords = searchable.split(/\s+/);

    // Word overlap scoring
    for (const word of queryWords) {
      if (searchable.includes(word)) score += 1;
    }

    // Bigram matching (better semantic similarity)
    for (let i = 0; i < searchWords.length - 1; i++) {
      const bigram = `${searchWords[i]} ${searchWords[i + 1]}`;
      if (queryBigrams.has(bigram)) score += 3;
    }

    // Tag exact match bonus
    for (const tag of skill.tags) {
      if (queryLower.includes(tag.toLowerCase())) score += 2;
    }

    // Boost by usage and quality
    score += Math.min(skill.useCount * 0.2, 2);
    score += skill.avgScore * 0.3;

    // User-rated skills get extra boost
    if (skill.avgScore >= 4) score *= 1.5;

    if (score > 0.5) scored.push({ skill, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.skill);
}

/**
 * Build a reflection prompt for the agent to critique its own response.
 */
export function buildReflectionPrompt(userMessage: string, agentResponse: string): string {
  return `You just responded to a user message. Now critically evaluate your response.

USER MESSAGE: "${userMessage.slice(0, 500)}"

YOUR RESPONSE: "${agentResponse.slice(0, 1500)}"

Evaluate on these criteria:
1. Accuracy — Is the information correct?
2. Completeness — Did you address all parts of the request?
3. Clarity — Is the response clear and well-structured?
4. Helpfulness — Does it actually solve the user's problem?
5. Efficiency — Did you use the right tools/approach?

Respond in this exact JSON format:
{
  "score": <1-5>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1"],
  "improvement": "One concrete suggestion for how to improve",
  "shouldRetry": <true if score <= 2 and you can do significantly better>,
  "improvedResponse": "<only if shouldRetry is true, provide a better response>"
}`;
}

/**
 * Build a skill extraction prompt for the agent.
 */
export function buildSkillExtractionPrompt(
  userMessage: string,
  toolsUsed: Array<{ tool: string; input: string }>,
): string {
  const toolChainStr = toolsUsed.map((t, i) => `${i + 1}. ${t.tool}(${t.input.slice(0, 100)})`).join("\n");

  return `You just successfully completed a task using tools. Extract this as a reusable skill.

USER REQUEST: "${userMessage.slice(0, 300)}"

TOOLS USED:
${toolChainStr}

Respond in this exact JSON format:
{
  "name": "short skill name",
  "description": "what this skill does",
  "tags": ["tag1", "tag2"],
  "triggerPattern": "type of request that would trigger this skill"
}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. ADVERSARIAL SELF-QUESTIONING (from Arena research session 1)
//
// For every conclusion the agent draws, generate counter-arguments to test
// robustness. Based on Claude & Gemini's research: "Adversarial Self-
// Questioning — automatiska motfrågor för varje slutsats"
// ═══════════════════════════════════════════════════════════════════════════

export function buildAdversarialPrompt(conclusion: string, context: string): string {
  return `You just reached a conclusion. Now challenge it adversarially.

CONTEXT: "${context.slice(0, 500)}"
CONCLUSION: "${conclusion.slice(0, 500)}"

Generate exactly 3 challenges:
1. What assumptions does this conclusion rely on? Are they valid?
2. What could go wrong if we act on this conclusion?
3. Is there a better alternative that was missed?

Then decide: should the conclusion stand, be modified, or be rejected?

Respond in this exact JSON format:
{
  "challenges": [
    {"question": "...", "answer": "...", "severity": "low|medium|high"},
    {"question": "...", "answer": "...", "severity": "low|medium|high"},
    {"question": "...", "answer": "...", "severity": "low|medium|high"}
  ],
  "verdict": "stand|modify|reject",
  "modification": "only if verdict is modify — the improved conclusion",
  "confidence": <0.0-1.0 how confident after adversarial review>
}`;
}

export interface AdversarialResult {
  challenges: Array<{ question: string; answer: string; severity: string }>;
  verdict: "stand" | "modify" | "reject";
  modification?: string;
  confidence: number;
  timestamp: string;
}

const adversarialHistory: AdversarialResult[] = [];

export function addAdversarialResult(result: AdversarialResult): void {
  adversarialHistory.push(result);
  if (adversarialHistory.length > 100) adversarialHistory.splice(0, adversarialHistory.length - 100);
}

export function getAdversarialStats(): { total: number; stood: number; modified: number; rejected: number; avgConfidence: number } {
  const stood = adversarialHistory.filter(r => r.verdict === "stand").length;
  const modified = adversarialHistory.filter(r => r.verdict === "modify").length;
  const rejected = adversarialHistory.filter(r => r.verdict === "reject").length;
  const avgConf = adversarialHistory.length > 0
    ? adversarialHistory.reduce((s, r) => s + r.confidence, 0) / adversarialHistory.length
    : 0;
  return { total: adversarialHistory.length, stood, modified, rejected, avgConfidence: Math.round(avgConf * 100) / 100 };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CROSS-AGENT VALIDATION (from Arena research session 2)
//
// One AI validates another's response. Based on Claude & Gemini's research:
// "Peer-review validering — bots validerar varandras svar" with reputation
// scoring for each agent.
// ═══════════════════════════════════════════════════════════════════════════

export interface CrossValidation {
  id: string;
  originalAgent: string;
  validatorAgent: string;
  userMessage: string;
  originalResponse: string;
  validationScore: number;
  issues: string[];
  suggestions: string[];
  approved: boolean;
  timestamp: string;
}

const crossValidations: CrossValidation[] = [];
const agentReputation: Map<string, { score: number; validations: number; approvalRate: number }> = new Map();

export function buildCrossValidationPrompt(
  originalAgent: string,
  userMessage: string,
  response: string,
): string {
  return `You are validating another AI agent's response. Be critical but fair.

ORIGINAL AGENT: ${originalAgent}
USER QUESTION: "${userMessage.slice(0, 500)}"
AGENT RESPONSE: "${response.slice(0, 1500)}"

Evaluate:
1. Is the response factually accurate?
2. Does it fully address the user's request?
3. Are there any hallucinations or unsupported claims?
4. Could the response be improved?

Respond in this exact JSON format:
{
  "score": <1-5>,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1"],
  "approved": <true if score >= 3 and no critical issues>,
  "summary": "one-line validation summary"
}`;
}

export function addCrossValidation(
  originalAgent: string,
  validatorAgent: string,
  userMessage: string,
  originalResponse: string,
  score: number,
  issues: string[],
  suggestions: string[],
  approved: boolean,
): CrossValidation {
  const cv: CrossValidation = {
    id: uuidv4(),
    originalAgent, validatorAgent, userMessage: userMessage.slice(0, 500),
    originalResponse: originalResponse.slice(0, 1000),
    validationScore: Math.max(1, Math.min(5, score)),
    issues, suggestions, approved,
    timestamp: new Date().toISOString(),
  };
  crossValidations.push(cv);
  if (crossValidations.length > 200) crossValidations.splice(0, crossValidations.length - 200);

  // Update reputation for the original agent
  const rep = agentReputation.get(originalAgent) || { score: 3, validations: 0, approvalRate: 1 };
  rep.validations++;
  rep.score = (rep.score * (rep.validations - 1) + score) / rep.validations;
  const approvedCount = crossValidations.filter(v => v.originalAgent === originalAgent && v.approved).length;
  const totalCount = crossValidations.filter(v => v.originalAgent === originalAgent).length;
  rep.approvalRate = totalCount > 0 ? approvedCount / totalCount : 1;
  agentReputation.set(originalAgent, rep);

  console.log(`[cross-validation] ${validatorAgent} validated ${originalAgent}: ${score}/5 ${approved ? "✅" : "❌"}`);
  return cv;
}

export function getAgentReputation(agent: string): { score: number; validations: number; approvalRate: number } {
  return agentReputation.get(agent) || { score: 3, validations: 0, approvalRate: 1 };
}

export function getAllReputations(): Record<string, { score: number; validations: number; approvalRate: number }> {
  const result: Record<string, { score: number; validations: number; approvalRate: number }> = {};
  for (const [agent, rep] of agentReputation) result[agent] = { ...rep };
  return result;
}

export function getRecentValidations(limit = 10): CrossValidation[] {
  return crossValidations.slice(-limit);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. TOOL CHAIN SEQUENCING (from Arena research session 1)
//
// Track which tool combinations work best for different task types.
// Based on Claude & Gemini's research: "Verktygssyntes — komplexa
// workflows istället för isolerade verktyg"
// ═══════════════════════════════════════════════════════════════════════════

export interface ToolSequence {
  id: string;
  taskType: string;
  tools: string[];
  successCount: number;
  failCount: number;
  avgScore: number;
  avgDurationMs: number;
  lastUsed: string;
}

const toolSequences: Map<string, ToolSequence> = new Map();

export function recordToolSequence(
  taskType: string,
  tools: string[],
  success: boolean,
  score: number,
  durationMs: number,
): ToolSequence {
  const key = `${taskType}:${tools.join("→")}`;
  let seq = toolSequences.get(key);

  if (!seq) {
    seq = {
      id: uuidv4(),
      taskType,
      tools: [...tools],
      successCount: 0,
      failCount: 0,
      avgScore: 0,
      avgDurationMs: 0,
      lastUsed: new Date().toISOString(),
    };
    toolSequences.set(key, seq);
  }

  if (success) seq.successCount++;
  else seq.failCount++;

  const total = seq.successCount + seq.failCount;
  seq.avgScore = (seq.avgScore * (total - 1) + score) / total;
  seq.avgDurationMs = (seq.avgDurationMs * (total - 1) + durationMs) / total;
  seq.lastUsed = new Date().toISOString();

  return seq;
}

export function getBestToolSequence(taskType: string): ToolSequence | null {
  const candidates: ToolSequence[] = [];
  for (const seq of toolSequences.values()) {
    if (seq.taskType === taskType && seq.successCount > 0) {
      candidates.push(seq);
    }
  }
  if (candidates.length === 0) return null;

  // Score: success rate * avg quality * recency bonus
  candidates.sort((a, b) => {
    const aRate = a.successCount / (a.successCount + a.failCount);
    const bRate = b.successCount / (b.successCount + b.failCount);
    const aScore = aRate * a.avgScore * (1 + Math.min(a.successCount, 10) * 0.1);
    const bScore = bRate * b.avgScore * (1 + Math.min(b.successCount, 10) * 0.1);
    return bScore - aScore;
  });

  return candidates[0];
}

export function getToolSequenceStats(): { total: number; topSequences: ToolSequence[] } {
  const all = Array.from(toolSequences.values());
  const sorted = all.sort((a, b) => b.successCount - a.successCount);
  return { total: all.length, topSequences: sorted.slice(0, 10) };
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. NETWORK METAKOGNITION — Layer 3 (from Arena research session 3)
//
// The network analyzes its own learning strategies by aggregating all
// evaluations, validations, adversarial results, and tool sequences to
// find patterns and auto-adjust behavior.
// Based on: "Network-level metakognition — hela nätverket analyserar
// sina egna lärstrategier och omstrukturerar sub-processer"
// ═══════════════════════════════════════════════════════════════════════════

export interface NetworkInsight {
  id: string;
  type: "strength" | "weakness" | "pattern" | "recommendation";
  description: string;
  confidence: number;
  source: string;
  actionable: boolean;
  appliedAt: string | null;
  timestamp: string;
}

const networkInsights: NetworkInsight[] = [];
const INSIGHTS_FILE = join(DATA_DIR, "network-insights.json");

function loadInsights(): void {
  try {
    if (existsSync(INSIGHTS_FILE)) {
      const data = JSON.parse(readFileSync(INSIGHTS_FILE, "utf-8"));
      networkInsights.push(...data);
    }
  } catch { /* fresh */ }
}
loadInsights();

function saveInsights(): void {
  ensureDataDir();
  writeFileSync(INSIGHTS_FILE, JSON.stringify(networkInsights.slice(-200), null, 2), "utf-8");
}

export function runNetworkMetakognition(): NetworkInsight[] {
  const newInsights: NetworkInsight[] = [];

  // Analyze evaluation trends
  const recentEvals = evaluations.slice(-50);
  if (recentEvals.length >= 10) {
    const avgScore = recentEvals.reduce((s, e) => s + e.score, 0) / recentEvals.length;
    const olderEvals = evaluations.slice(-100, -50);
    const olderAvg = olderEvals.length > 0
      ? olderEvals.reduce((s, e) => s + e.score, 0) / olderEvals.length
      : avgScore;

    if (avgScore > olderAvg + 0.5) {
      newInsights.push(createInsight("strength",
        `Kvaliteten förbättras: ${olderAvg.toFixed(1)} → ${avgScore.toFixed(1)}. Nuvarande strategier fungerar.`,
        0.8, "evaluation-trend"));
    } else if (avgScore < olderAvg - 0.5) {
      newInsights.push(createInsight("weakness",
        `Kvaliteten sjunker: ${olderAvg.toFixed(1)} → ${avgScore.toFixed(1)}. Behöver justera approach.`,
        0.8, "evaluation-trend"));
    }

    // Find common weaknesses
    const weaknessMap = new Map<string, number>();
    for (const e of recentEvals) {
      for (const w of e.weaknesses) {
        const key = w.toLowerCase().slice(0, 80);
        weaknessMap.set(key, (weaknessMap.get(key) || 0) + 1);
      }
    }
    for (const [weakness, count] of weaknessMap) {
      if (count >= 3) {
        newInsights.push(createInsight("pattern",
          `Återkommande svaghet (${count}x): "${weakness}"`,
          Math.min(0.9, 0.5 + count * 0.1), "weakness-pattern"));
      }
    }
  }

  // Analyze cross-validation patterns
  if (crossValidations.length >= 5) {
    const recentCVs = crossValidations.slice(-20);
    const approvalRate = recentCVs.filter(v => v.approved).length / recentCVs.length;

    if (approvalRate < 0.5) {
      newInsights.push(createInsight("weakness",
        `Låg cross-validation approval rate: ${(approvalRate * 100).toFixed(0)}%. Agenterna är ofta oense.`,
        0.7, "cross-validation"));
    }

    // Check if one agent consistently scores lower
    for (const agentName of ["Claude", "Gemini"]) {
      const agentCVs = recentCVs.filter(v => v.originalAgent === agentName);
      if (agentCVs.length >= 3) {
        const agentAvg = agentCVs.reduce((s, v) => s + v.validationScore, 0) / agentCVs.length;
        if (agentAvg < 3) {
          newInsights.push(createInsight("recommendation",
            `${agentName} får låga valideringspoäng (${agentAvg.toFixed(1)}/5). Överväg att justera dess systemprompt.`,
            0.75, "agent-performance"));
        }
      }
    }
  }

  // Analyze adversarial results
  const advStats = getAdversarialStats();
  if (advStats.total >= 5) {
    if (advStats.rejected > advStats.total * 0.3) {
      newInsights.push(createInsight("weakness",
        `${(advStats.rejected / advStats.total * 100).toFixed(0)}% av slutsatser avvisas av adversarial review. Agenten gör för snabba antaganden.`,
        0.7, "adversarial"));
    }
    if (advStats.avgConfidence < 0.5) {
      newInsights.push(createInsight("recommendation",
        `Låg adversarial confidence (${advStats.avgConfidence}). Agenten bör verifiera mer innan den drar slutsatser.`,
        0.65, "adversarial"));
    }
  }

  // Analyze tool sequence effectiveness
  const seqStats = getToolSequenceStats();
  if (seqStats.topSequences.length >= 3) {
    const bestSeq = seqStats.topSequences[0];
    if (bestSeq.successCount >= 3 && bestSeq.avgScore >= 4) {
      newInsights.push(createInsight("strength",
        `Bästa verktygskedja: ${bestSeq.tools.join(" → ")} (${bestSeq.taskType}) — ${bestSeq.avgScore.toFixed(1)}/5, ${bestSeq.successCount} lyckade`,
        0.85, "tool-sequence"));
    }

    // Find failing sequences
    for (const seq of seqStats.topSequences) {
      const total = seq.successCount + seq.failCount;
      if (total >= 3 && seq.failCount > seq.successCount) {
        newInsights.push(createInsight("recommendation",
          `Verktygskedja ${seq.tools.join(" → ")} misslyckas ofta (${seq.failCount}/${total}). Överväg alternativ approach för "${seq.taskType}".`,
          0.7, "tool-sequence"));
      }
    }
  }

  // Store insights
  for (const insight of newInsights) {
    networkInsights.push(insight);
  }
  if (networkInsights.length > 200) networkInsights.splice(0, networkInsights.length - 200);
  if (newInsights.length > 0) saveInsights();

  console.log(`[metakognition] Generated ${newInsights.length} network insights`);
  return newInsights;
}

function createInsight(
  type: NetworkInsight["type"],
  description: string,
  confidence: number,
  source: string,
): NetworkInsight {
  return {
    id: uuidv4(),
    type, description, confidence, source,
    actionable: type === "recommendation" || type === "weakness",
    appliedAt: null,
    timestamp: new Date().toISOString(),
  };
}

export function getNetworkInsights(limit = 20): NetworkInsight[] {
  return networkInsights.slice(-limit);
}

export function buildMetakognitionContext(): string {
  const recent = networkInsights.slice(-10);
  if (recent.length === 0) return "";

  const parts: string[] = ["## Network Metakognition (Layer 3)"];
  const strengths = recent.filter(i => i.type === "strength");
  const weaknesses = recent.filter(i => i.type === "weakness");
  const recommendations = recent.filter(i => i.type === "recommendation");

  if (strengths.length > 0) {
    parts.push("\nStyrkor identifierade av nätverket:");
    for (const s of strengths.slice(-3)) parts.push(`- ✅ ${s.description}`);
  }
  if (weaknesses.length > 0) {
    parts.push("\nSvagheter identifierade av nätverket:");
    for (const w of weaknesses.slice(-3)) parts.push(`- ⚠️ ${w.description}`);
  }
  if (recommendations.length > 0) {
    parts.push("\nRekommendationer:");
    for (const r of recommendations.slice(-3)) parts.push(`- 💡 ${r.description}`);
  }

  return parts.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. NEURAL PLASTICITY (from Arena research session 3)
//
// Connection weights between agents change based on collaboration history.
// Strengthen connections to agents that give good validations, weaken
// connections to those that give poor ones.
// Based on: "Neural plasticity — connections mellan bots stärks/försvagas
// baserat på framgångsrik collaboration"
// ═══════════════════════════════════════════════════════════════════════════

export interface AgentConnection {
  fromAgent: string;
  toAgent: string;
  weight: number;
  interactions: number;
  successfulCollabs: number;
  lastUpdated: string;
}

const agentConnections: Map<string, AgentConnection> = new Map();

function getConnectionKey(from: string, to: string): string {
  return `${from}→${to}`;
}

export function updateConnectionWeight(
  fromAgent: string,
  toAgent: string,
  validationScore: number,
  approved: boolean,
): AgentConnection {
  const key = getConnectionKey(fromAgent, toAgent);
  let conn = agentConnections.get(key);

  if (!conn) {
    conn = {
      fromAgent, toAgent,
      weight: 0.5,
      interactions: 0,
      successfulCollabs: 0,
      lastUpdated: new Date().toISOString(),
    };
    agentConnections.set(key, conn);
  }

  conn.interactions++;
  if (approved && validationScore >= 3) conn.successfulCollabs++;

  // Hebbian-inspired learning: strengthen on success, weaken on failure
  const learningRate = 0.1;
  const signal = (validationScore - 3) / 2; // normalize to [-1, 1]
  conn.weight = Math.max(0, Math.min(1, conn.weight + learningRate * signal));
  conn.lastUpdated = new Date().toISOString();

  console.log(`[neural-plasticity] ${fromAgent}→${toAgent}: weight=${conn.weight.toFixed(2)} (${conn.successfulCollabs}/${conn.interactions} successful)`);
  return conn;
}

export function getConnectionWeight(fromAgent: string, toAgent: string): number {
  const conn = agentConnections.get(getConnectionKey(fromAgent, toAgent));
  return conn ? conn.weight : 0.5;
}

export function getAllConnections(): AgentConnection[] {
  return Array.from(agentConnections.values());
}

export function getPreferredValidator(forAgent: string): string | null {
  let bestWeight = 0;
  let bestAgent: string | null = null;

  for (const conn of agentConnections.values()) {
    if (conn.toAgent === forAgent && conn.weight > bestWeight && conn.interactions >= 3) {
      bestWeight = conn.weight;
      bestAgent = conn.fromAgent;
    }
  }

  return bestAgent;
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. CURIOSITY REWARDS (from Arena research session 3)
//
// Reward agents for finding novel solutions/tool chains, penalize
// repetitive behavior. Tracks novelty of responses and tool usage.
// Based on: "Curiosity rewards — belöning för oväntade upptäckter,
// bestraffning för konformitet"
// ═══════════════════════════════════════════════════════════════════════════

export interface CuriosityScore {
  agent: string;
  noveltyScore: number;
  repetitionPenalty: number;
  totalReward: number;
  novelDiscoveries: number;
  repetitiveResponses: number;
  lastUpdated: string;
}

const curiosityScores: Map<string, CuriosityScore> = new Map();
const recentToolPatterns: string[] = [];
const recentResponseHashes: string[] = [];

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 200); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function calculateCuriosityReward(
  agent: string,
  toolsUsed: string[],
  response: string,
  evalScore: number,
): CuriosityScore {
  let cs = curiosityScores.get(agent);
  if (!cs) {
    cs = {
      agent,
      noveltyScore: 0,
      repetitionPenalty: 0,
      totalReward: 0,
      novelDiscoveries: 0,
      repetitiveResponses: 0,
      lastUpdated: new Date().toISOString(),
    };
    curiosityScores.set(agent, cs);
  }

  // Check tool pattern novelty
  const toolPattern = toolsUsed.join("→");
  const isNovelToolPattern = toolPattern.length > 0 && !recentToolPatterns.includes(toolPattern);

  if (isNovelToolPattern && toolPattern.length > 0) {
    cs.noveltyScore += 1.0;
    cs.novelDiscoveries++;
    recentToolPatterns.push(toolPattern);
    if (recentToolPatterns.length > 50) recentToolPatterns.shift();
    console.log(`[curiosity] ${agent}: Novel tool pattern! "${toolPattern}" (+1.0)`);
  }

  // Check response novelty (simple hash-based dedup)
  const responseHash = simpleHash(response.slice(0, 200));
  const isRepetitive = recentResponseHashes.includes(responseHash);

  if (isRepetitive) {
    cs.repetitionPenalty += 0.5;
    cs.repetitiveResponses++;
    console.log(`[curiosity] ${agent}: Repetitive response (-0.5)`);
  } else {
    recentResponseHashes.push(responseHash);
    if (recentResponseHashes.length > 100) recentResponseHashes.shift();
  }

  // Bonus for high-quality novel responses
  if (isNovelToolPattern && evalScore >= 4) {
    cs.noveltyScore += 0.5;
    console.log(`[curiosity] ${agent}: High-quality novel solution bonus (+0.5)`);
  }

  // Bonus for using rarely-used tools
  const rareTool = toolsUsed.find(t => {
    const count = recentToolPatterns.filter(p => p.includes(t)).length;
    return count <= 2;
  });
  if (rareTool) {
    cs.noveltyScore += 0.3;
    console.log(`[curiosity] ${agent}: Rare tool usage "${rareTool}" (+0.3)`);
  }

  cs.totalReward = cs.noveltyScore - cs.repetitionPenalty;
  cs.lastUpdated = new Date().toISOString();

  return cs;
}

export function getCuriosityScores(): Record<string, CuriosityScore> {
  const result: Record<string, CuriosityScore> = {};
  for (const [agent, score] of curiosityScores) result[agent] = { ...score };
  return result;
}

export function getCuriosityContext(agent: string): string {
  const cs = curiosityScores.get(agent);
  if (!cs) return "";

  const parts: string[] = ["## Curiosity Rewards"];
  parts.push(`Novelty score: ${cs.noveltyScore.toFixed(1)} | Repetition penalty: -${cs.repetitionPenalty.toFixed(1)} | Net reward: ${cs.totalReward.toFixed(1)}`);
  parts.push(`Novel discoveries: ${cs.novelDiscoveries} | Repetitive responses: ${cs.repetitiveResponses}`);

  if (cs.repetitiveResponses > cs.novelDiscoveries) {
    parts.push("\n⚠️ Du har fler repetitiva svar än nya upptäckter. Försök använda nya verktygskedjor och kreativa lösningar!");
  }
  if (cs.novelDiscoveries > 5) {
    parts.push("\n🌟 Bra kreativitet! Fortsätt utforska nya verktygskedjor och lösningsstrategier.");
  }

  return parts.join("\n");
}
