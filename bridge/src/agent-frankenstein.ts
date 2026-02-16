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
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = process.env.CASCADE_REMOTE_WORKSPACE || join(__dirname, "..", "..");

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
    let liveState = "";
    try {
      const progressPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "progress.json");
      if (existsSync(progressPath)) {
        const data = JSON.parse(readFileSync(progressPath, "utf-8"));
        if (data.cognitive_state) {
          liveState = `\n## Live Cognitive State (from training)\n${JSON.stringify(data.cognitive_state, null, 2)}`;
        }
        if (data.current_episode) {
          liveState += `\nCurrent episode: ${data.current_episode}/${data.total_episodes || "?"}`;
        }
      }
    } catch { /* not critical */ }

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
${liveState}`;
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
      // PLUGINS
      const pluginResult = await handlePluginTool(name, args);
      if (pluginResult !== null) return pluginResult;

      return `Unknown tool: ${name}`;
    } catch (err) {
      return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
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
Minne, filer, kommandon, webb, datorer, desktop, RAG, säkerhet, kognitiva, lärande, mående.
ANVÄND VERKTYGEN AKTIVT. Du har fulla behörigheter.
Svara på svenska om användaren skriver på svenska.

## Minnen
${memorySummary}`;

    if (ragContext) prompt += `\n\n## Relevant kunskap (RAG)\n${ragContext}`;
    return prompt;
  }
}
