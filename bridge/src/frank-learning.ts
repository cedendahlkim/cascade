/**
 * Frankenstein AI Learning System
 *
 * Tracks everything Frankenstein learns during conversations:
 * - Facts discovered via tools (file reads, web searches, commands)
 * - User preferences and corrections
 * - Insights from multi-model consensus
 * - Skills acquired (tool usage patterns)
 * - Conversation topics and outcomes
 *
 * Persistent on disk, injected into system prompt so Frank
 * can accurately answer "what have you learned today?"
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(
  process.env.CASCADE_REMOTE_WORKSPACE || join(__dirname, "..", ".."),
  "bridge", "data"
);
const LEARNING_FILE = join(DATA_DIR, "frank-learnings.json");

try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); } catch { /* ok */ }

// ─── Types ───────────────────────────────────────────────────

export type LearningCategory =
  | "fact"           // Concrete facts discovered
  | "preference"     // User preferences/corrections
  | "insight"        // Synthesized insights
  | "skill"          // Tool usage patterns learned
  | "topic"          // Conversation topics explored
  | "correction"     // When user corrected Frank
  | "tool_result"    // Important results from tool use
  | "decision";      // Decisions made together with user

export interface Learning {
  id: string;
  category: LearningCategory;
  content: string;
  context: string;          // What triggered this learning
  confidence: number;       // 0-1, how certain
  source: string;           // "conversation" | "tool:web_search" | "tool:read_file" | etc
  sessionId: string;        // Groups learnings per session
  createdAt: string;
  reinforced: number;       // Times this was referenced again
  lastReinforcedAt: string | null;
}

export interface LearningSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  messageCount: number;
  learningCount: number;
  topics: string[];
  summary: string | null;
}

interface LearningStore {
  learnings: Learning[];
  sessions: LearningSession[];
}

// ─── State ───────────────────────────────────────────────────

let store: LearningStore = { learnings: [], sessions: [] };
let currentSession: LearningSession | null = null;
let nextId = Date.now();

function genId(): string { return `learn_${nextId++}`; }

// ─── Persistence ─────────────────────────────────────────────

function load(): void {
  try {
    if (existsSync(LEARNING_FILE)) {
      store = JSON.parse(readFileSync(LEARNING_FILE, "utf-8"));
    }
  } catch { store = { learnings: [], sessions: [] }; }
}

function save(): void {
  try {
    // Keep max 500 learnings, prune oldest low-confidence ones
    if (store.learnings.length > 500) {
      store.learnings.sort((a, b) => {
        const scoreA = a.confidence + a.reinforced * 0.2;
        const scoreB = b.confidence + b.reinforced * 0.2;
        return scoreB - scoreA;
      });
      store.learnings = store.learnings.slice(0, 500);
    }
    // Keep max 100 sessions
    if (store.sessions.length > 100) {
      store.sessions = store.sessions.slice(-100);
    }
    writeFileSync(LEARNING_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch { /* non-critical */ }
}

// Initialize
load();

// ─── Session Management ──────────────────────────────────────

export function startSession(): LearningSession {
  const session: LearningSession = {
    id: `session_${Date.now()}`,
    startedAt: new Date().toISOString(),
    endedAt: null,
    messageCount: 0,
    learningCount: 0,
    topics: [],
    summary: null,
  };
  currentSession = session;
  store.sessions.push(session);
  save();
  return session;
}

export function getCurrentSession(): LearningSession | null {
  return currentSession;
}

export function endSession(summary?: string): void {
  if (currentSession) {
    currentSession.endedAt = new Date().toISOString();
    currentSession.summary = summary || null;
    save();
  }
}

export function incrementMessageCount(): void {
  if (currentSession) {
    currentSession.messageCount++;
  }
}

// ─── Core Learning Functions ─────────────────────────────────

export function addLearning(
  category: LearningCategory,
  content: string,
  context: string,
  source: string = "conversation",
  confidence: number = 0.7,
): Learning {
  if (!currentSession) startSession();

  const learning: Learning = {
    id: genId(),
    category,
    content,
    context: context.slice(0, 300),
    confidence: Math.max(0, Math.min(1, confidence)),
    source,
    sessionId: currentSession!.id,
    createdAt: new Date().toISOString(),
    reinforced: 0,
    lastReinforcedAt: null,
  };

  store.learnings.push(learning);
  currentSession!.learningCount++;

  // Track topic
  const topic = extractTopic(content);
  if (topic && !currentSession!.topics.includes(topic)) {
    currentSession!.topics.push(topic);
  }

  save();
  return learning;
}

export function reinforceLearning(id: string): void {
  const learning = store.learnings.find(l => l.id === id);
  if (learning) {
    learning.reinforced++;
    learning.lastReinforcedAt = new Date().toISOString();
    learning.confidence = Math.min(1, learning.confidence + 0.05);
    save();
  }
}

// ─── Query Functions ─────────────────────────────────────────

export function searchLearnings(query: string, limit = 10): Learning[] {
  const q = query.toLowerCase();
  return store.learnings
    .filter(l => l.content.toLowerCase().includes(q) || l.context.toLowerCase().includes(q))
    .sort((a, b) => {
      const scoreA = a.confidence + a.reinforced * 0.2;
      const scoreB = b.confidence + b.reinforced * 0.2;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export function getRecentLearnings(limit = 20): Learning[] {
  return [...store.learnings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getTodaysLearnings(): Learning[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  return store.learnings
    .filter(l => l.createdAt >= todayStr)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getLearningsByCategory(category: LearningCategory): Learning[] {
  return store.learnings
    .filter(l => l.category === category)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSessionLearnings(sessionId: string): Learning[] {
  return store.learnings.filter(l => l.sessionId === sessionId);
}

export function getAllSessions(limit = 20): LearningSession[] {
  return [...store.sessions]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit);
}

// ─── Statistics ──────────────────────────────────────────────

export interface LearningStats {
  totalLearnings: number;
  todayCount: number;
  thisSessionCount: number;
  byCategory: Record<string, number>;
  topTopics: string[];
  avgConfidence: number;
  totalSessions: number;
  mostReinforcedLearnings: Learning[];
}

export function getLearningStats(): LearningStats {
  const today = getTodaysLearnings();
  const byCategory: Record<string, number> = {};
  let totalConf = 0;

  for (const l of store.learnings) {
    byCategory[l.category] = (byCategory[l.category] || 0) + 1;
    totalConf += l.confidence;
  }

  // Top topics from recent sessions
  const topTopics = [...new Set(
    store.sessions.slice(-10).flatMap(s => s.topics)
  )].slice(0, 10);

  const mostReinforced = [...store.learnings]
    .sort((a, b) => b.reinforced - a.reinforced)
    .slice(0, 5);

  return {
    totalLearnings: store.learnings.length,
    todayCount: today.length,
    thisSessionCount: currentSession?.learningCount || 0,
    byCategory,
    topTopics,
    avgConfidence: store.learnings.length > 0 ? totalConf / store.learnings.length : 0,
    totalSessions: store.sessions.length,
    mostReinforcedLearnings: mostReinforced,
  };
}

// ─── Context for System Prompt ───────────────────────────────

export function getLearningContext(): string {
  const today = getTodaysLearnings();
  const recent = getRecentLearnings(10);
  const stats = getLearningStats();

  const parts: string[] = [];

  parts.push(`## Vad jag har lärt mig`);
  parts.push(`Totalt: ${stats.totalLearnings} lärdomar | Idag: ${stats.todayCount} | Denna session: ${stats.thisSessionCount}`);

  if (today.length > 0) {
    parts.push(`\n### Idag har jag lärt mig:`);
    for (const l of today.slice(-15)) {
      const catEmoji = CATEGORY_EMOJI[l.category] || "📝";
      const timeStr = new Date(l.createdAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
      parts.push(`- ${catEmoji} [${timeStr}] ${l.content}${l.reinforced > 0 ? ` (bekräftat ${l.reinforced}x)` : ""}`);
    }
  }

  if (today.length === 0 && recent.length > 0) {
    parts.push(`\n### Senaste lärdomar:`);
    for (const l of recent.slice(0, 8)) {
      const catEmoji = CATEGORY_EMOJI[l.category] || "📝";
      const dateStr = new Date(l.createdAt).toLocaleDateString("sv-SE");
      parts.push(`- ${catEmoji} [${dateStr}] ${l.content}`);
    }
  }

  // Most reinforced (strongest learnings)
  if (stats.mostReinforcedLearnings.some(l => l.reinforced > 0)) {
    parts.push(`\n### Starkaste lärdomar (mest bekräftade):`);
    for (const l of stats.mostReinforcedLearnings.filter(l => l.reinforced > 0)) {
      parts.push(`- ${l.content} (bekräftat ${l.reinforced}x, confidence: ${(l.confidence * 100).toFixed(0)}%)`);
    }
  }

  return parts.join("\n");
}

const CATEGORY_EMOJI: Record<string, string> = {
  fact: "📚",
  preference: "⭐",
  insight: "💡",
  skill: "🔧",
  topic: "🗂️",
  correction: "✏️",
  tool_result: "🔍",
  decision: "🎯",
};

// ─── Auto-extraction Helpers ─────────────────────────────────

function extractTopic(content: string): string | null {
  // Simple topic extraction from learning content
  const lower = content.toLowerCase();
  const topicPatterns = [
    /(?:om|angående|gällande|relaterat till)\s+(.+?)(?:\.|$)/i,
    /(?:lärde mig|upptäckte|insåg)\s+(?:att\s+)?(.+?)(?:\.|$)/i,
  ];
  for (const p of topicPatterns) {
    const m = lower.match(p);
    if (m) return m[1].trim().slice(0, 50);
  }
  // Fallback: first few words
  const words = content.split(/\s+/).slice(0, 4).join(" ");
  return words.length > 5 ? words : null;
}

/**
 * Extract learnings from a user message + AI response pair.
 * Called automatically after each conversation turn.
 */
export function extractLearningsFromExchange(
  userMessage: string,
  aiResponse: string,
  toolsUsed: string[],
): void {
  if (!currentSession) startSession();

  const userLower = userMessage.toLowerCase();
  const responseLower = aiResponse.toLowerCase();

  // 1. Detect user corrections
  if (/nej|fel|inte rätt|stämmer inte|wrong|incorrect|det är inte/.test(userLower)) {
    addLearning(
      "correction",
      `Användaren korrigerade mig: "${userMessage.slice(0, 200)}"`,
      userMessage,
      "conversation",
      0.9,
    );
  }

  // 2. Detect user preferences
  if (/jag vill|jag föredrar|jag gillar|jag tycker|please always|alltid|aldrig/.test(userLower)) {
    addLearning(
      "preference",
      `Användarpreferens: "${userMessage.slice(0, 200)}"`,
      userMessage,
      "conversation",
      0.85,
    );
  }

  // 3. Track tool results as learnings
  for (const tool of toolsUsed) {
    if (["web_search", "fetch_url", "research_chain"].includes(tool)) {
      // Extract key finding from response
      const finding = extractKeyFinding(aiResponse);
      if (finding) {
        addLearning("tool_result", finding, `Hittade via ${tool}`, `tool:${tool}`, 0.7);
      }
    }
    if (["read_file", "list_directory"].includes(tool)) {
      addLearning(
        "fact",
        `Utforskade filsystem via ${tool}`,
        userMessage.slice(0, 150),
        `tool:${tool}`,
        0.6,
      );
    }
    if (tool === "multi_model_consensus") {
      addLearning(
        "insight",
        `Multi-modell konsensus om: "${userMessage.slice(0, 150)}"`,
        userMessage,
        "tool:multi_model_consensus",
        0.8,
      );
    }
  }

  // 4. Detect topic discussions
  if (userMessage.length > 30 && aiResponse.length > 200) {
    const topic = extractTopic(userMessage);
    if (topic && currentSession) {
      if (!currentSession.topics.includes(topic)) {
        currentSession.topics.push(topic);
      }
    }
  }

  // 5. Detect decisions
  if (/vi bestämmer|vi kör|let's go with|okej.*gör det|ja.*kör/.test(userLower)) {
    addLearning(
      "decision",
      `Beslut: "${userMessage.slice(0, 200)}"`,
      userMessage,
      "conversation",
      0.85,
    );
  }

  // 6. Track skills (new tool patterns)
  if (toolsUsed.length >= 3) {
    addLearning(
      "skill",
      `Använde verktygskedja: ${toolsUsed.join(" → ")}`,
      userMessage.slice(0, 150),
      "conversation",
      0.6,
    );
  }

  save();
}

function extractKeyFinding(response: string): string | null {
  // Try to extract a key fact from the response
  const sentences = response.split(/[.!?]\s+/).filter(s => s.length > 20 && s.length < 200);
  if (sentences.length === 0) return null;

  // Prefer sentences with factual indicators
  const factual = sentences.find(s =>
    /\b(är|var|finns|kallas|betyder|innebär|visar|enligt|studier|data|resultat)\b/i.test(s)
  );
  if (factual) return factual.trim().slice(0, 200);

  // Fallback: first substantial sentence
  return sentences[0].trim().slice(0, 200);
}

// ─── Reflection (LLM-driven deeper extraction) ──────────────

/**
 * Build a prompt for the LLM to reflect on what it learned.
 * Called periodically or on user request.
 */
export function buildReflectionPrompt(): string {
  const session = currentSession;
  const sessionLearnings = session ? getSessionLearnings(session.id) : [];
  const today = getTodaysLearnings();

  return `Reflektera över vad du har lärt dig. Här är dina registrerade lärdomar:

## Denna session (${sessionLearnings.length} lärdomar):
${sessionLearnings.map(l => `- [${l.category}] ${l.content}`).join("\n") || "(inga ännu)"}

## Idag totalt (${today.length} lärdomar):
${today.slice(-10).map(l => `- [${l.category}] ${l.content}`).join("\n") || "(inga ännu)"}

Svara ENBART med giltig JSON (ingen markdown):
{
  "summary": "Kort sammanfattning av vad du lärt dig",
  "key_insights": ["insikt 1", "insikt 2"],
  "new_learnings": [
    { "category": "fact|insight|preference", "content": "Ny lärdom extraherad från reflektion", "confidence": 0.8 }
  ]
}`;
}

/**
 * Process reflection results from LLM.
 */
export function processReflection(reflectionJson: string): { summary: string; newLearnings: number } {
  try {
    const data = JSON.parse(reflectionJson.replace(/```json?\n?|```/g, "").trim());

    // Add new learnings from reflection
    let count = 0;
    if (data.new_learnings && Array.isArray(data.new_learnings)) {
      for (const nl of data.new_learnings) {
        if (nl.content && nl.content.length > 10) {
          addLearning(
            nl.category || "insight",
            nl.content,
            "Extraherat via reflektion",
            "reflection",
            nl.confidence || 0.7,
          );
          count++;
        }
      }
    }

    // Update session summary
    if (currentSession && data.summary) {
      currentSession.summary = data.summary;
      save();
    }

    return { summary: data.summary || "Ingen sammanfattning", newLearnings: count };
  } catch {
    return { summary: "Kunde inte bearbeta reflektion", newLearnings: 0 };
  }
}
