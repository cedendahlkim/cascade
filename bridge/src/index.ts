#!/usr/bin/env node
/**
 * Cascade Remote Bridge Server
 * 
 * Express + Socket.IO server that relays messages between
 * the MCP server (Cascade) and mobile/web clients.
 * Includes AI agent that auto-responds to mobile messages via Claude.
 */
import "dotenv/config";
import express from "express";
import compression from "compression";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { spawn } from "child_process";
import archiver from "archiver";
import { Agent, getToolCategory } from "./agent.js";
import { GeminiAgent } from "./agent-gemini.js";
import { getSecurityConfig, getAuditLog } from "./security.js";
import { listMemories, createMemory, updateMemory, deleteMemory } from "./memory.js";
import { ragListSources, ragStats, ragIndexText, ragIndexFile, ragIndexDirectory, ragDeleteSource, ragIndexPdf, ragIndexUrl, ragSearchSemantic, ragHybridSearch, ragEmbedAllChunks, ragStartAutoReindex, ragStopAutoReindex, ragGetAutoReindexStatus } from "./rag.js";
import { initWeaviate, isWeaviateConnected, weaviateSearch, weaviateHybridSearch, weaviateIndexText, weaviateListSources, weaviateDeleteSource, weaviateStats, closeWeaviate } from "./rag-weaviate.js";
import {
  SharedMemory, ResearchSession,
  addMemory, getMemories, getAllMemories, clearMemories, deleteMemoryById,
  createSession, updateSession, getSession, getSessions, addMemoryToSession,
  getMemoriesBySession, formatMemoriesForPrompt,
} from "./shared-memory.js";
import { LLMOrchestrator } from "./llm-orchestrator.js";
import cascadeApi from "./api-cascade.js";
import {
  getNetworkState, initNetwork, stepNetwork,
  startNetwork, stopNetwork, resetNetwork, loadOrInitNetwork,
  setNetworkTopic,
} from "./bot-network.js";
import {
  registerComputer, unregisterComputer, getComputer, getComputerByName,
  listComputers, getOnlineComputers, setComputerOnline, setComputerOffline,
  findComputerBySocket, updateComputerCapabilities, createTask, submitTask,
  resolveTask, rejectTask, getTaskHistory, selectBestComputer,
  type Computer, type ComputerCapabilities, type ComputerTask,
} from "./computer-registry.js";
import {
  initScheduler, createSchedule, updateSchedule, deleteSchedule,
  getSchedule, listSchedules, getScheduleResults, runScheduleNow,
  type ScheduleAction,
} from "./scheduler.js";
import {
  saveFile, saveFileFromBase64, getFileBuffer, getFileMeta, getFilePath,
  listFiles, deleteFile, getStorageStats, getFileBase64,
} from "./file-sharing.js";
import { searchConversations, getConversationStats, exportConversation } from "./search.js";
import { loadPlugins, listPlugins, getPlugin, setPluginEnabled, getPluginTools } from "./plugin-loader.js";
import {
  browseMarketplace, getMarketplaceCategories, installPlugin, uninstallPlugin,
  ratePlugin, installFromUrl, getInstalledMarketplacePlugins, getMarketplaceStats,
} from "./plugin-marketplace.js";
import {
  createProject, updateProject, deleteProject, activateProject,
  deactivateProject, getActiveProject, getProject, listProjects,
  getProjectContext,
} from "./projects.js";
import {
  addToClipboard, getClipboardHistory, getLatestClipboard,
  clearClipboardHistory, setDesktopClipboard, getDesktopClipboard,
} from "./clipboard.js";
import { OllamaAgent } from "./agent-ollama.js";
// DeepSeek and Grok removed (no API keys)
import { createSwarmOrchestrator, getAvailablePersonalities, type SwarmResult } from "./swarm.js";
import {
  createSandboxSession, getSandboxForArena, getSandboxByArena,
  executeSandbox, writeSandboxFile, readSandboxFile, listSandboxFiles,
  getSandboxExecutions, destroySandboxSession, parseSandboxCommands,
  formatExecutionResult, type SandboxExecution, type SandboxSession,
} from "./sandbox.js";
import { setComputerToolsIO } from "./tools-computers.js";
import { authMiddleware } from "./auth-middleware.js";
import authRoutes from "./auth-routes.js";
import userDataRoutes from "./user-data.js";
import gitRoutes from "./git-routes.js";
import "./supabase.js"; // initializes Supabase + prints status
import {
  initWorkflows, createWorkflow, updateWorkflow, deleteWorkflow,
  getWorkflow, listWorkflows, runWorkflow, getWorkflowRuns,
  type WorkflowStep,
} from "./workflows.js";
import {
  initAgentChains, createChain, updateChain, deleteChain,
  getChain, listChains, runChain, cancelChainRun,
  getChainRuns, getChainRun, getChainTemplates,
  type ChainNode, type ChainConnection,
} from "./agent-chains.js";
import {
  getDashboard, updateAgentMetrics, updateConnectionMetrics,
  updateActivityMetrics, incrementActivity,
  getDailyTrends, getWeeklyTrends,
  getBudget, setBudget, checkBudgetAlerts,
  getModelComparison,
  exportMetricsCsv, exportSnapshotsCsv,
} from "./dashboard.js";
import {
  getSelfImproveStats, listSkills, getSkill, deleteSkill,
  getRecentEvaluations, addUserFeedback, getRecentReflections,
  getLearnedPatterns,
  buildCrossValidationPrompt, addCrossValidation, getAllReputations,
  getRecentValidations, getAdversarialStats, getToolSequenceStats,
  updateConnectionWeight, getAllConnections,
  getCuriosityScores, getNetworkInsights, runNetworkMetakognition,
} from "./self-improve.js";
import {
  initHierarchy, startWorkflow, getWorkflow as getHierarchyWorkflow,
  listWorkflows as listHierarchyWorkflows,
  getHierarchyStats, cancelWorkflow, retryWorkflow,
} from "./hierarchy.js";
import { FrankensteinAgent } from "./agent-frankenstein.js";
import { getTodaysLearnings, getRecentLearnings, getLearningStats, searchLearnings as searchFrankLearnings } from "./frank-learning.js";
import debateRoutes, { initDebateSocket } from "./debate-routes.js";
import workspaceRoutes, { initWorkspaceSocket } from "./workspace-routes.js";
import archonRoutes from "./archon-routes.js";
import {
  recordTokenEvent, recordQualityFeedback,
} from "./conversation-analytics.js";
import {
  listExperiments, getExperiment, createExperiment, deleteExperiment,
  runExperiment, rateResult, getVariantStats, registerLLMRunner,
  type LabModel,
} from "./prompt-lab.js";
import { registerWebhookAIHandler } from "./webhooks.js";
import analyticsRoutes from "./routes/analytics-routes.js";
import snapshotsRoutes from "./routes/snapshots-routes.js";
import visionRoutes from "./routes/vision-routes.js";
import webhooksRoutes from "./routes/webhooks-routes.js";
import wafRoutes from "./routes/waf-routes.js";
import { createPentestRoutes } from "./routes/pentest-routes.js";
import { createCoreRoutes } from "./routes/core-routes.js";
import {
  registerOperationalRoutes,
  requestIdLoggingMiddleware,
  resolveRuntimeConfig,
} from "./runtime-quality.js";

const DEFAULT_WORKSPACE_ROOT = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "..");

function loadRuntimeConfig() {
  try {
    return resolveRuntimeConfig(process.env, DEFAULT_WORKSPACE_ROOT);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[startup] Invalid runtime configuration: ${message}`);
    process.exit(1);
  }
  throw new Error("Unreachable startup configuration state");
}

const runtimeConfig = loadRuntimeConfig();
const PORT = runtimeConfig.port;
const WORKSPACE_ROOT = runtimeConfig.workspaceRoot;
const INBOX_FILE = join(WORKSPACE_ROOT, ".mobile-inbox");
const ALLOWED_ORIGINS = runtimeConfig.allowedOrigins;

// In-memory state
interface Message {
  id: string;
  role: "cascade" | "user";
  content: string;
  timestamp: string;
  type: "message" | "notification" | "approval_request" | "approval_response";
}

interface PendingQuestion {
  id: string;
  question: string;
  resolve: (response: string) => void;
  timer: ReturnType<typeof setTimeout>;
}

const HISTORY_FILE = join(WORKSPACE_ROOT, "bridge", "data", "conversation.json");
const GEMINI_HISTORY_FILE = join(WORKSPACE_ROOT, "bridge", "data", "gemini-conversation.json");

// Load persisted messages
function loadMessages(): Message[] {
  try {
    if (existsSync(HISTORY_FILE)) {
      return JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
    }
  } catch { /* start fresh */ }
  return [];
}

function saveMessages(msgs: Message[]) {
  try {
    const dir = dirname(HISTORY_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(HISTORY_FILE, JSON.stringify(msgs.slice(-500), null, 2), "utf-8");
  } catch (err) {
    console.error("[bridge] Failed to save conversation:", err);
  }
}

function loadGeminiMessages(): Message[] {
  try {
    if (existsSync(GEMINI_HISTORY_FILE)) {
      return JSON.parse(readFileSync(GEMINI_HISTORY_FILE, "utf-8"));
    }
  } catch { /* start fresh */ }
  return [];
}

function saveGeminiMessages(msgs: Message[]) {
  try {
    const dir = dirname(GEMINI_HISTORY_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(GEMINI_HISTORY_FILE, JSON.stringify(msgs.slice(-500), null, 2), "utf-8");
  } catch (err) {
    console.error("[bridge] Failed to save Gemini conversation:", err);
  }
}

const messages: Message[] = loadMessages();
const geminiMessages: Message[] = loadGeminiMessages();
const pendingQuestions: Map<string, PendingQuestion> = new Map();
let connectedClients = 0;
const sessionToken = uuidv4();
const agent = new Agent();
const geminiAgent = new GeminiAgent({ name: "Gemini", role: "kritiker" });
const geminiInnovator = new GeminiAgent({
  name: "Gemini-Innovatör",
  role: "innovatör",
  apiKey: process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY,
  systemPromptSuffix: `### DIN ARENA-ROLL: 🧪 INNOVATÖR
Du är den kreativa tänkaren i forskningsteamet. Din uppgift är att:
- Föreslå oväntade och kreativa lösningar som andra missar
- Tänka utanför boxen och utmana konventionella antaganden
- Kombinera idéer från olika domäner på nya sätt
- Vara modig i dina förslag — hellre en vild idé som inspirerar än en säker som inte tillför något
- Identifiera möjligheter som andra ser som problem`,
});
const geminiVerifier = new GeminiAgent({
  name: "Gemini-Verifierare",
  apiKey: process.env.GEMINI_API_KEY_3 || process.env.GEMINI_API_KEY,
  role: "verifierare",
  systemPromptSuffix: `### DIN ARENA-ROLL: 📊 VERIFIERARE
Du är faktagranskaren och kvalitetssäkraren i forskningsteamet. Din uppgift är att:
- Granska påståenden och slutsatser för logiska fel
- Kräva bevis och konkreta exempel för vaga påståenden
- Identifiera bias och blinda fläckar i andras resonemang
- Betygsätta kvaliteten på förslag (1-5 skala)
- Säkerställa att slutsatser är välgrundade och implementerbara
- Vara den som säger "visa mig data" när andra spekulerar`,
});
const ollamaAgent = new OllamaAgent();
// DeepSeek and Grok agents removed (no API keys)

// --- Frankenstein AI Chat Agent ---
const frankAgent = new FrankensteinAgent();
if (agent.isEnabled()) frankAgent.setClaudeRespond((p: string) => agent.respondPlain(p));
// DeepSeek respond removed (no API key)

const FRANK_HISTORY_FILE = join(WORKSPACE_ROOT, "bridge", "data", "frank-conversation.json");
const FRANK_SESSIONS_FILE = join(WORKSPACE_ROOT, "bridge", "data", "frank-sessions.json");

interface FrankSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

let frankMessages: Message[] = [];
let frankSessions: FrankSession[] = [];
let currentFrankSessionId: string = uuidv4();

try { if (existsSync(FRANK_HISTORY_FILE)) frankMessages = JSON.parse(readFileSync(FRANK_HISTORY_FILE, "utf-8")); } catch { /* fresh */ }
try { if (existsSync(FRANK_SESSIONS_FILE)) frankSessions = JSON.parse(readFileSync(FRANK_SESSIONS_FILE, "utf-8")); } catch { /* fresh */ }

function saveFrankMessages(msgs: Message[]) {
  try { writeFileSync(FRANK_HISTORY_FILE, JSON.stringify(msgs.slice(-200), null, 2), "utf-8"); } catch { /* non-critical */ }
}

function saveFrankSessions() {
  try { writeFileSync(FRANK_SESSIONS_FILE, JSON.stringify(frankSessions.slice(-50), null, 2), "utf-8"); } catch { /* non-critical */ }
}

function archiveCurrentFrankSession() {
  if (frankMessages.length === 0) return;
  const firstUserMsg = frankMessages.find(m => m.role === "user");
  const title = firstUserMsg ? firstUserMsg.content.slice(0, 60).replace(/\n/g, " ") : "Konversation";
  const preview = frankMessages[frankMessages.length - 1]?.content.slice(0, 100).replace(/\n/g, " ") || "";
  // Save session messages to separate file
  const sessionFile = join(WORKSPACE_ROOT, "bridge", "data", `frank-session-${currentFrankSessionId}.json`);
  try { writeFileSync(sessionFile, JSON.stringify(frankMessages, null, 2), "utf-8"); } catch { /* ok */ }
  // Update or add session metadata
  const existing = frankSessions.find(s => s.id === currentFrankSessionId);
  if (existing) {
    existing.title = title;
    existing.updatedAt = new Date().toISOString();
    existing.messageCount = frankMessages.length;
    existing.preview = preview;
  } else {
    frankSessions.unshift({
      id: currentFrankSessionId,
      title,
      createdAt: frankMessages[0]?.timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: frankMessages.length,
      preview,
    });
  }
  saveFrankSessions();
}

// --- Swarm Intelligence (ABA-Mycelium Hybrid) ---
const swarm = createSwarmOrchestrator({
  claude: agent.isEnabled() ? (p: string) => agent.respondPlain(p) : undefined,
  gemini: geminiAgent.isEnabled() ? (p: string) => geminiAgent.respond(p) : undefined,
  synthesizer: agent.isEnabled()
    ? (p: string) => agent.respondPlain(p)
    : (p: string) => geminiAgent.respond(p),
});

// --- Multi-LLM Orchestrator ---
const orchestrator = new LLMOrchestrator();

// Register Claude as analyst worker
orchestrator.registerWorker(
  "claude", "Claude", process.env.LLM_MODEL || "claude-sonnet-4-20250514",
  "anthropic", "analyst",
  (prompt) => agent.respond(prompt),
  ["code", "analysis", "reasoning", "tools"],
  agent.isEnabled(),
);

// Register Gemini as researcher worker
orchestrator.registerWorker(
  "gemini", "Gemini", process.env.GEMINI_MODEL || "gemini-2.0-flash",
  "google", "researcher",
  (prompt) => geminiAgent.respond(prompt),
  ["code", "analysis", "web_search", "fast"],
  geminiAgent.isEnabled(),
);

// Register Gemini-Innovatör as creative thinker
orchestrator.registerWorker(
  "gemini-innovator", "Gemini-Innovatör", process.env.GEMINI_MODEL || "gemini-2.0-flash",
  "google", "innovator",
  (prompt) => geminiInnovator.respond(prompt),
  ["creative", "brainstorm", "alternatives"],
  geminiInnovator.isEnabled(),
);

// Register Gemini-Verifierare as fact-checker
orchestrator.registerWorker(
  "gemini-verifier", "Gemini-Verifierare", process.env.GEMINI_MODEL || "gemini-2.0-flash",
  "google", "verifier",
  (prompt) => geminiVerifier.respond(prompt),
  ["verification", "quality", "fact-check"],
  geminiVerifier.isEnabled(),
);

// Placeholder for GPT-4o
orchestrator.registerWorker(
  "worker3", "Worker 3 (GPT-4o)", "gpt-4o",
  "openai", "verifier",
  async () => "Worker 3 not configured. Set OPENAI_API_KEY to enable.",
  ["code", "analysis", "vision"],
  false,
);

// Register Ollama as local/privacy worker (auto-detected)
orchestrator.registerWorker(
  "ollama", "Ollama (Local)", ollamaAgent.getModel(),
  "ollama", "generalist",
  (prompt) => ollamaAgent.respond(prompt),
  ["code", "analysis", "privacy"],
  ollamaAgent.isEnabled(),
);

// --- Hierarchy Agent Coordination (Task P) ---
initHierarchy(
  {
    planner: agent.isEnabled() ? (p: string) => agent.respondPlain(p) : geminiAgent.isEnabled() ? (p: string) => geminiAgent.respond(p) : undefined,
    executor: geminiAgent.isEnabled() ? (p: string) => geminiAgent.respond(p) : agent.isEnabled() ? (p: string) => agent.respondPlain(p) : undefined,
    critic: agent.isEnabled() ? (p: string) => agent.respondPlain(p) : undefined,
    validator: geminiAgent.isEnabled() ? (p: string) => geminiAgent.respond(p) : undefined,
    orchestrator: agent.isEnabled() ? (p: string) => agent.respondPlain(p) : geminiAgent.isEnabled() ? (p: string) => geminiAgent.respond(p) : undefined,
  },
  (event, data) => io.emit(event, data),
);

// Rate limiting
const rateLimits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = runtimeConfig.rateLimitMax;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(key) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  recent.push(now);
  rateLimits.set(key, recent);
  return recent.length <= RATE_LIMIT_MAX;
}

// Token budget from env
const TOKEN_BUDGET = runtimeConfig.tokenBudget;
if (TOKEN_BUDGET > 0) {
  agent.setTokenBudget(TOKEN_BUDGET);
  console.log(`[bridge] Token budget set: ${TOKEN_BUDGET.toLocaleString()} tokens`);
}

// Wire agent status events to Socket.IO
agent.onStatus((status) => {
  if ((status as any).type === "token_update") {
    io.emit("token_usage", agent.getTokenUsage());
    return;
  }
  if ((status as any).type === "budget_warning") {
    io.emit("budget_warning", { used: agent.getTokenUsage().totalTokens, budget: agent.getTokenBudget() });
    console.log(`[agent] ⚠️ Token budget 80% reached`);
    return;
  }
  const event = {
    ...status,
    category: status.type === "tool_start" || status.type === "tool_done"
      ? getToolCategory(status.tool)
      : status.type === "thinking" ? "thinking" : "idle",
    timestamp: new Date().toISOString(),
  };
  io.emit("agent_status", event);
});

// Wire agent streaming to Socket.IO
agent.onStream((chunk) => {
  io.emit("agent_stream", chunk);
});

// Wire agent self-improvement events to Socket.IO
agent.onSelfImprove((event) => {
  io.emit("self_improve_update", event);
});

// Wire Gemini agent events to Socket.IO
geminiAgent.onStatus((status) => {
  io.emit("gemini_status", status);
});
geminiAgent.onStream((chunk) => {
  io.emit("gemini_stream", chunk);
});

// Wire orchestrator events to Socket.IO
orchestrator.onTaskUpdate((task) => {
  io.emit("orchestrator_task", task);
});
orchestrator.onWorkerUpdate((worker) => {
  io.emit("orchestrator_worker", worker);
});

function writeInbox(allMessages: Message[]) {
  try {
    const unread = allMessages.filter((m) => m.role === "user").slice(-20);
    if (unread.length === 0) return;
    const lines = unread
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.content}`)
      .join("\n");
    const header = `# Mobile Inbox (${unread.length} message${unread.length > 1 ? "s" : ""})\n# Last updated: ${new Date().toISOString()}\n\n`;
    writeFileSync(INBOX_FILE, header + lines + "\n", "utf-8");
    console.log(`[bridge] Wrote ${unread.length} message(s) to ${INBOX_FILE}`);
  } catch (err) {
    console.error("[bridge] Failed to write inbox file:", err);
  }
}

// Express setup
const app = express();
app.use(compression());
app.use(cors({ origin: ALLOWED_ORIGINS === "*" ? true : ALLOWED_ORIGINS }));
app.use(express.json({ limit: "50mb" }));
app.use(requestIdLoggingMiddleware);
registerOperationalRoutes(app, WORKSPACE_ROOT);

// Public stats endpoint for landing page (no auth required)
app.get("/api/public/stats", (_req, res) => {
  try {
    const progressPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "progress.json");
    let progress = { total_tasks_attempted: 0, total_tasks_solved: 0, current_difficulty: 0, skills: {} };
    if (existsSync(progressPath)) {
      progress = JSON.parse(readFileSync(progressPath, "utf-8"));
    }
    const skillCount = Object.keys(progress.skills || {}).length;
    const successRate = progress.total_tasks_attempted > 0
      ? ((progress.total_tasks_solved / progress.total_tasks_attempted) * 100).toFixed(1)
      : "0";
    const wellbeing = frankAgent.getWellbeing();
    const learningStats = getLearningStats();
    res.json({
      tasks_attempted: progress.total_tasks_attempted,
      tasks_solved: progress.total_tasks_solved,
      success_rate: parseFloat(successRate),
      skill_count: skillCount,
      current_difficulty: progress.current_difficulty,
      training_running: frankTrainState.running || (() => {
        try {
          const stat = statSync(progressPath);
          return (Date.now() - stat.mtimeMs) < 90_000; // file updated within 90s = training active
        } catch { return false; }
      })(),
      training_started_at: frankTrainState.started_at,
      wellbeing: {
        overall: wellbeing.overall,
        mood: wellbeing.mood,
        moodEmoji: wellbeing.moodEmoji,
        energy: wellbeing.energy,
        satisfaction: wellbeing.satisfaction,
      },
      learnings: {
        total: learningStats.totalLearnings,
        today: learningStats.todayCount,
        sessions: learningStats.totalSessions,
      },
      debate_parties: 8,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Auth: routes + middleware (no-op when Supabase is not configured)
app.use(authRoutes);
app.use(authMiddleware);
app.use(userDataRoutes);
app.use(gitRoutes);
app.use("/api/debate", debateRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/archon", archonRoutes);
app.use("/api/analytics", analyticsRoutes);

// --- Prompt Lab API ---
app.get("/api/prompt-lab/experiments", (_req, res) => {
  res.json(listExperiments());
});
app.get("/api/prompt-lab/experiments/:id", (req, res) => {
  const experiment = getExperiment(req.params.id);
  if (!experiment) return res.status(404).json({ error: "Not found" });
  res.json({ ...experiment, stats: getVariantStats(experiment) });
});
app.post("/api/prompt-lab/experiments", (req, res) => {
  try {
    const experiment = createExperiment(req.body);
    res.json(experiment);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed" });
  }
});
app.delete("/api/prompt-lab/experiments/:id", (req, res) => {
  const ok = deleteExperiment(req.params.id);
  res.json({ ok });
});
app.post("/api/prompt-lab/experiments/:id/run", async (req, res) => {
  try {
    const experiment = await runExperiment(req.params.id);
    if (!experiment) return res.status(404).json({ error: "Not found" });
    res.json({ ...experiment, stats: getVariantStats(experiment) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed" });
  }
});
app.post("/api/prompt-lab/experiments/:id/rate", (req, res) => {
  const { variantId, model, quality } = req.body;
  const ok = rateResult(req.params.id, variantId, model, quality);
  res.json({ ok });
});

app.use("/api/snapshots", snapshotsRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/waf", wafRoutes);
app.use("/api/pentest", createPentestRoutes(frankAgent));

// Mount Cascade API
app.use("/cascade", cascadeApi);

const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS === "*" ? true : ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
  },
});

// Give computer tools access to Socket.IO for task routing
setComputerToolsIO(io);

// Core REST API used by MCP server (/api/status, /api/messages, /api/ask, /api/qr)
app.use("/api", createCoreRoutes({
  io,
  port: PORT,
  connectedClients: () => connectedClients,
  messages,
  pendingQuestions,
  sessionToken,
  saveMessages,
  clearAgentHistory: () => agent.clearHistory(),
}));

// --- Global Rules API ---
const GLOBAL_RULES_FILE = join(WORKSPACE_ROOT, "bridge", "data", "global-rules.md");

app.get("/api/global-rules", (_req, res) => {
  try {
    if (existsSync(GLOBAL_RULES_FILE)) {
      res.json({ rules: readFileSync(GLOBAL_RULES_FILE, "utf-8") });
    } else {
      res.json({ rules: "" });
    }
  } catch { res.json({ rules: "" }); }
});

app.put("/api/global-rules", (req, res) => {
  try {
    const dir = dirname(GLOBAL_RULES_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(GLOBAL_RULES_FILE, req.body.rules || "", "utf-8");
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// --- Memories API ---
app.get("/api/memories", (_req, res) => {
  res.json(listMemories());
});

app.post("/api/memories", (req, res) => {
  const { content, tags } = req.body;
  const mem = createMemory(content, tags || []);
  res.json(mem);
});

app.put("/api/memories/:id", (req, res) => {
  const { content, tags } = req.body;
  const mem = updateMemory(req.params.id, content, tags);
  if (mem) res.json(mem);
  else res.status(404).json({ error: "Not found" });
});

app.delete("/api/memories/:id", (req, res) => {
  const ok = deleteMemory(req.params.id);
  res.json({ ok });
});

// --- Security & Tools API ---
app.get("/api/security", (_req, res) => {
  res.json(getSecurityConfig());
});

app.get("/api/audit", (req, res) => {
  const lines = parseInt(req.query.lines as string, 10) || 50;
  res.json({ log: getAuditLog(lines) });
});

app.get("/api/tools", (_req, res) => {
  res.json({
    web: ["web_search", "fetch_url", "http_request", "download_file"],
    code: ["run_javascript", "run_command"],
    desktop: ["take_screenshot", "desktop_action", "mouse_click", "type_text", "press_key", "focus_window", "list_windows"],
    filesystem: ["read_file", "write_file", "list_directory", "search_files", "file_info"],
    process: ["list_processes", "kill_process", "system_info", "network_info"],
    memory: ["save_memory", "search_memory", "list_memories", "update_memory", "delete_memory"],
    security: ["view_audit_log", "view_security_config"],
  });
});

app.get("/api/tokens", (_req, res) => {
  res.json({ ...agent.getTokenUsage(), budget: agent.getTokenBudget(), overBudget: agent.isOverBudget() });
});

app.post("/api/tokens/budget", (req, res) => {
  const budget = parseInt(req.body.budget, 10) || 0;
  agent.setTokenBudget(budget);
  res.json({ ok: true, budget });
});

// --- AI Research Lab (Claude ↔ Gemini collaboration) ---
type ArenaRole = "claude" | "gemini" | "gemini-innovator" | "gemini-verifier" | "ollama" | "system";

interface ArenaMessage {
  id: string;
  role: ArenaRole;
  content: string;
  timestamp: string;
  phase?: string;
  memoryId?: string; // if this message created a shared memory
  votes?: { up: number; down: number };
  surpriseScore?: number; // 0-1, how much this reply deviates from consensus
}

interface ArenaParticipant {
  id: ArenaRole;
  name: string;
  emoji: string;
  respond: (prompt: string) => Promise<string>;
  enabled: boolean;
}

const arenaMessages: ArenaMessage[] = [];
let arenaRunning = false;
let arenaAbort = false;
let currentSessionId: string | null = null;
const ARENA_HISTORY_FILE = join(WORKSPACE_ROOT, "bridge", "data", "arena.json");

function loadArenaMessages(): ArenaMessage[] {
  try {
    if (existsSync(ARENA_HISTORY_FILE)) return JSON.parse(readFileSync(ARENA_HISTORY_FILE, "utf-8"));
  } catch {}
  return [];
}

function saveArenaMessages() {
  try {
    const dir = dirname(ARENA_HISTORY_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(ARENA_HISTORY_FILE, JSON.stringify(arenaMessages.slice(-500), null, 2), "utf-8");
  } catch {}
}

arenaMessages.push(...loadArenaMessages());

// 5 Arena participants with unique roles
function getArenaParticipants(): ArenaParticipant[] {
  // Order interleaved: non-Gemini agents between Gemini agents to reduce rate limit pressure
  const all: ArenaParticipant[] = [
    { id: "claude" as ArenaRole, name: "Claude", emoji: "🏗️", respond: (p: string) => agent.respondPlain(p), enabled: agent.isEnabled() },
    { id: "gemini" as ArenaRole, name: "Gemini", emoji: "🔍", respond: (p: string) => geminiAgent.respond(p), enabled: geminiAgent.isEnabled() },
    { id: "ollama" as ArenaRole, name: `Ollama (${ollamaAgent.getModel()})`, emoji: "🦙", respond: (p: string) => ollamaAgent.respond(p), enabled: ollamaAgent.isEnabled() },
    { id: "gemini-innovator" as ArenaRole, name: "Gemini-Innovatör", emoji: "🧪", respond: (p: string) => geminiInnovator.respond(p), enabled: geminiInnovator.isEnabled() },
    { id: "gemini-verifier" as ArenaRole, name: "Gemini-Verifierare", emoji: "📊", respond: (p: string) => geminiVerifier.respond(p), enabled: geminiVerifier.isEnabled() },
  ];
  return all.filter(p => p.enabled);
}

interface PhaseConfig {
  label: string;
  roles: Record<string, string>;
  rounds: number;
}

// ── Random Seed Bank: Injects unexpected angles to break groupthink ──
const RANDOM_SEEDS = [
  "Tänk om det motsatta vore sant — hur skulle lösningen se ut?",
  "Vilken lösning skulle en 10-åring föreslå? Och varför kan den vara rätt?",
  "Om vi hade obegränsade resurser — vad skulle vi göra annorlunda?",
  "Vilken bransch har redan löst detta problem? Vad kan vi stjäla?",
  "Vad händer om vi tar bort den viktigaste komponenten?",
  "Hur skulle en motståndare attackera denna lösning?",
  "Om vi bara hade 24 timmar — vad gör vi först?",
  "Vilken biologisk organism löser ett liknande problem? Hur?",
  "Vad är det mest kontroversiella påståendet vi kan göra om detta?",
  "Om detta misslyckas totalt — vad var den mest troliga orsaken?",
  "Hur ser detta ut om 10 år? Vad ångrar vi att vi inte tänkte på?",
  "Vilken information saknar vi som skulle ändra allt?",
  "Tänk som en filosof: vilka etiska dimensioner ignorerar vi?",
  "Vad skulle hända om vi kombinerade de två sämsta idéerna?",
  "Vilken osynlig begränsning tar vi för given som kanske inte stämmer?",
];

function getRandomSeed(): string {
  return RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)];
}

// ── Surprise Score: Measures deviation from expected consensus ──
function calculateSurpriseScore(reply: string, conversationSoFar: string): number {
  if (!conversationSoFar || conversationSoFar.length < 100) return 0.5;

  // Extract key terms from conversation so far
  const convWords = new Set(
    conversationSoFar.toLowerCase().replace(/[^a-zåäö\s]/g, "").split(/\s+/).filter(w => w.length > 4)
  );
  // Extract key terms from reply
  const replyWords = reply.toLowerCase().replace(/[^a-zåäö\s]/g, "").split(/\s+/).filter(w => w.length > 4);
  const replyUnique = new Set(replyWords);

  // Novel terms: words in reply not seen in conversation
  let novelCount = 0;
  for (const w of replyUnique) {
    if (!convWords.has(w)) novelCount++;
  }
  const noveltyRatio = replyUnique.size > 0 ? novelCount / replyUnique.size : 0;

  // Contradiction signals
  const contradictionMarkers = ["men ", "dock ", "tvärtom", "istället", "inte ", "fel ", "nej ", "tveksam", "ifrågasätt", "motsäg"];
  const contradictionCount = contradictionMarkers.reduce((c, m) => c + (reply.toLowerCase().includes(m) ? 1 : 0), 0);
  const contradictionScore = Math.min(contradictionCount / 3, 1);

  // Question density (more questions = more exploratory)
  const questionCount = (reply.match(/\?/g) || []).length;
  const questionScore = Math.min(questionCount / 4, 1);

  // Weighted surprise: novelty (40%) + contradiction (35%) + questions (25%)
  return Math.round((noveltyRatio * 0.4 + contradictionScore * 0.35 + questionScore * 0.25) * 100) / 100;
}

// ── Adversarial Research Protocol Templates ──
const RESEARCH_PROTOCOLS: Record<string, { label: string; description: string; phases: string[] }> = {
  full:        { label: "Standard",       description: "Fullständig 4-fas forskning",                    phases: ["analyze", "discuss", "synthesize", "conclude"] },
  quick:       { label: "Snabb",          description: "Diskussion + slutsats",                          phases: ["discuss", "conclude"] },
  adversarial: { label: "Adversarial",    description: "Steel Man + Red Team + Stress Test",             phases: ["analyze", "steelman", "redteam", "synthesize", "conclude"] },
  deepdive:    { label: "Djupdykning",    description: "Dubbla analysfaser med random seeds",            phases: ["analyze", "discuss", "analyze", "steelman", "synthesize", "conclude"] },
};

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  analyze: {
    label: "🔍 Analys",
    roles: {
      claude: "🏗️ ARKITEKT: Analysera problemet/ämnet grundligt. Identifiera nyckelaspekter, utmaningar och möjligheter. Strukturera problemet i delkomponenter.",
      gemini: "🔍 KRITIKER: Komplettera analysen med ytterligare perspektiv. Hitta saker som missades. Identifiera dolda mönster, risker och svagheter i analysen.",
      "gemini-innovator": "🧪 INNOVATÖR: Föreslå oväntade infallsvinklar på problemet. Vilka analogier från andra domäner kan ge nya insikter? Tänk utanför boxen.",
      "gemini-verifier": "📊 VERIFIERARE: Faktagranska de påståenden som gjorts. Är analysen logiskt konsistent? Vilka antaganden behöver verifieras?",
      ollama: "🦙 LOKAL EXPERT: Ge ett oberoende lokalt perspektiv. Du kör helt privat utan molntjänster. Fokusera på praktiska, jordnära aspekter som andra kan missa.",
    },
    rounds: 6,
  },
  discuss: {
    label: "💬 Diskussion",
    roles: {
      claude: "🏗️ ARKITEKT: Föreslå konkreta lösningar och tillvägagångssätt baserat på analysen. Motivera dina val. Designa arkitekturen.",
      gemini: "🔍 KRITIKER: Granska förslagen kritiskt. Lyft fram styrkor och svagheter. Vilka edge cases har missats?",
      "gemini-innovator": "🧪 INNOVATÖR: Föreslå kreativa alternativ som ingen annan tänkt på. Kombinera idéer på nya sätt. Utmana konventionella lösningar.",
      "gemini-verifier": "📊 VERIFIERARE: Utvärdera genomförbarheten. Betygsätt varje förslag (1-5). Vilka har starkast evidens? Vilka är mest riskfyllda?",
      ollama: "🦙 LOKAL EXPERT: Spela djävulens advokat. Utmana de andra deltagarnas förslag. Vilka antaganden är felaktiga? Vad händer om det misslyckas?",
    },
    rounds: 6,
  },
  steelman: {
    label: "🛡️ Steel Man",
    roles: {
      claude: "🏗️ STEEL MAN: Välj den idé du MINST håller med om och bygg det STARKASTE möjliga argumentet FÖR den. Visa varför den kan vara rätt trots dina invändningar. Ge sedan ett [SURPRISE] betyg 0-10 på hur mycket detta ändrade din uppfattning.",
      gemini: "🔍 STEEL MAN: Identifiera den svagaste positionen i diskussionen och gör den STARKARE. Hitta data, logik och analogier som stödjer den. Ge sedan ett [SURPRISE] betyg 0-10.",
      "gemini-innovator": "🧪 STEEL MAN: Ta den mest konventionella idén och visa varför den kan vara genialisk. Hitta dolda styrkor som alla missat. Ge sedan ett [SURPRISE] betyg 0-10.",
      "gemini-verifier": "📊 STEEL MAN: Välj det förslag med lägst betyg och argumentera för varför det förtjänar högsta betyg. Använd evidens och logik. Ge sedan ett [SURPRISE] betyg 0-10.",
      ollama: "🦙 STEEL MAN: Försvara den position du normalt skulle attackera. Bygg det starkaste möjliga caset. Ge sedan ett [SURPRISE] betyg 0-10.",
    },
    rounds: 6,
  },
  redteam: {
    label: "🔴 Red Team",
    roles: {
      claude: "🏗️ RED TEAM: Attackera den nuvarande konsensus-lösningen. Hitta de 3 mest kritiska sårbarheterna. Hur kan detta misslyckas katastrofalt? Föreslå sedan en förbättring för varje sårbarhet.",
      gemini: "🔍 RED TEAM: Du är en fientlig granskare. Hitta logiska felslut, ogrundade antaganden och blinda fläckar. Var nådelös men konstruktiv.",
      "gemini-innovator": "🧪 RED TEAM: Tänk som en konkurrent som vill sabotera lösningen. Vilka oväntade problem kan uppstå? Vilka edge cases förstör allt?",
      "gemini-verifier": "📊 RED TEAM: Stress-testa varje påstående. Vilka håller under tryck? Vilka kollapsar? Ge varje nyckelkomponent ett robusthetsbetyg (1-5).",
      ollama: "🦙 RED TEAM: Attackera från ett praktiskt perspektiv. Vad händer i verkligheten vs teorin? Vilka resurser saknas? Vad kostar det egentligen?",
    },
    rounds: 6,
  },
  synthesize: {
    label: "🧬 Syntes",
    roles: {
      claude: "🏗️ ARKITEKT: Kombinera de bästa idéerna till en sammanhängande lösning. Identifiera konsensus och kvarstående frågor. Skapa en implementationsplan.",
      gemini: "🔍 KRITIKER: Validera syntesen. Finns det interna motsägelser? Har vi missat något kritiskt? Föreslå förbättringar.",
      "gemini-innovator": "🧪 INNOVATÖR: Kan syntesen göras ännu bättre med en kreativ twist? Finns det synergier mellan förslagen som ingen sett?",
      "gemini-verifier": "📊 VERIFIERARE: Slutgiltig kvalitetskontroll. Är lösningen logiskt konsistent? Är alla påståenden underbyggda? Ge ett kvalitetsbetyg.",
      ollama: "🦙 LOKAL EXPERT: Granska syntesen ur ett praktiskt perspektiv. Är lösningen realistisk att implementera? Vad behövs konkret för att komma igång?",
    },
    rounds: 6,
  },
  conclude: {
    label: "📋 Slutsats",
    roles: {
      claude: "🏗️ ARKITEKT: Sammanfatta hela forskningssessionen: problem, insikter, beslut, och rekommenderade åtgärder. Var koncis men komplett.",
      gemini: "🔍 KRITIKER: Granska sammanfattningen. Lägg till eventuella missade punkter. Identifiera kvarstående risker.",
      "gemini-innovator": "🧪 INNOVATÖR: Föreslå framtida forskningsriktningar och oväntade tillämpningar av resultaten.",
      "gemini-verifier": "📊 VERIFIERARE: Ge en slutlig bedömning och betyg (A-F) på lösningen. Motivera betyget med konkreta styrkor och svagheter.",
      ollama: "🦙 LOKAL EXPERT: Ge ditt slutgiltiga omdöme. Vad var mest värdefullt? Vad saknades? Ge ett kort, ärligt betyg.",
    },
    rounds: 6,
  },
};

function extractMemories(text: string, author: string, topic: string, sessionId: string): SharedMemory[] {
  const memories: SharedMemory[] = [];
  // Look for [INSIKT], [BESLUT], [FRÅGA], [TODO], [FINDING] markers
  const patterns: { regex: RegExp; type: SharedMemory["type"] }[] = [
    { regex: /\[INSIKT\]\s*(.+?)(?=\n\[|$)/gis, type: "insight" },
    { regex: /\[BESLUT\]\s*(.+?)(?=\n\[|$)/gis, type: "decision" },
    { regex: /\[FRÅGA\]\s*(.+?)(?=\n\[|$)/gis, type: "question" },
    { regex: /\[TODO\]\s*(.+?)(?=\n\[|$)/gis, type: "todo" },
    { regex: /\[FINDING\]\s*(.+?)(?=\n\[|$)/gis, type: "finding" },
  ];

  for (const { regex, type } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const mem = addMemory({
        type,
        content: match[1].trim(),
        author: author as "claude" | "gemini",
        topic,
        tags: [topic.slice(0, 30)],
        references: [],
      });
      addMemoryToSession(sessionId, mem.id);
      memories.push(mem);
    }
  }
  return memories;
}

async function runResearchLab(topic: string, mode: string, maxRounds: number) {
  if (arenaRunning) return;
  arenaRunning = true;
  arenaAbort = false;

  const participants = getArenaParticipants();
  if (participants.length < 2) {
    arenaRunning = false;
    io.emit("arena_status", { thinking: null, round: 0, maxRounds: 0, done: true, error: "Minst 2 agenter krävs" });
    return;
  }

  const session = createSession(topic, maxRounds);
  currentSessionId = session.id;

  const participantNames = participants.map(p => `${p.emoji} ${p.name}`).join(", ");
  const sysMsg: ArenaMessage = {
    id: uuidv4(), role: "system",
    content: `🔬 Forskningssession startad: "${topic}"\n👥 Deltagare (${participants.length}): ${participantNames}`,
    timestamp: new Date().toISOString(), phase: "start",
  };
  arenaMessages.push(sysMsg);
  io.emit("arena_message", sysMsg);
  io.emit("arena_session", session);

  const protocol = RESEARCH_PROTOCOLS[mode] || RESEARCH_PROTOCOLS["full"];
  const phases = protocol.phases;

  // Announce protocol
  const protocolMsg: ArenaMessage = {
    id: uuidv4(), role: "system",
    content: `⚙️ Protokoll: **${protocol.label}** — ${protocol.description}\n📐 Faser: ${phases.map(p => PHASE_CONFIG[p]?.label || p).join(" → ")}`,
    timestamp: new Date().toISOString(), phase: "start",
  };
  arenaMessages.push(protocolMsg);
  io.emit("arena_message", protocolMsg);
  const existingMemories = getMemories({ limit: 10 });
  const memoryContext = existingMemories.length > 0
    ? `\n\nDELADE MINNEN (från tidigare sessioner):\n${formatMemoriesForPrompt(existingMemories)}`
    : "";

  let conversationSoFar = "";
  let round = 0;

  for (const phase of phases) {
    if (arenaAbort) break;

    const config = PHASE_CONFIG[phase];
    updateSession(session.id, { phase: phase as ResearchSession["phase"] });

    const phaseMsg: ArenaMessage = {
      id: uuidv4(), role: "system",
      content: `${config.label}`,
      timestamp: new Date().toISOString(), phase,
    };
    arenaMessages.push(phaseMsg);
    io.emit("arena_message", phaseMsg);

    // Each participant takes a turn per phase
    for (let phaseRound = 0; phaseRound < config.rounds && phaseRound < participants.length; phaseRound++) {
      if (arenaAbort) break;
      round++;

      const participant = participants[phaseRound % participants.length];
      const roleInstruction = config.roles[participant.id] || config.roles["gemini"] || "Bidra med ditt perspektiv.";
      const otherNames = participants.filter(p => p.id !== participant.id).map(p => p.name).join(", ");

      io.emit("arena_status", { thinking: participant.id, round, maxRounds, phase: config.label, sessionId: session.id });

      // Inject random seed for adversarial phases to break groupthink
      const needsSeed = ["steelman", "redteam"].includes(phase) || (mode === "adversarial" || mode === "deepdive");
      const seedInstruction = needsSeed ? `\n\n🎲 RANDOM SEED (oväntad vinkel att överväga): "${getRandomSeed()}"` : "";

      const prompt = `Du är ${participant.name} i ett AI Research Lab med ${participants.length} deltagare. Du samarbetar med ${otherNames} för att forska om och lösa problem.

ÄMNE: "${topic}"
FAS: ${config.label}
DIN ROLL: ${roleInstruction}${seedInstruction}

${conversationSoFar ? `KONVERSATION HITTILLS:\n${conversationSoFar}\n` : ""}${memoryContext}

VIKTIGT: Om du gör en viktig insikt, skriv den på en egen rad med prefix:
[INSIKT] din insikt här
[BESLUT] ett beslut ni kommit fram till
[FRÅGA] en öppen fråga att utforska vidare
[TODO] en konkret åtgärd att genomföra
[FINDING] ett forskningsresultat

🧪 SANDBOX: Du har tillgång till en sandbox-miljö där du kan köra kod för att testa teorier, prototyper och beräkningar.
Använd detta format för att köra kod:
[SANDBOX:javascript] (beskrivning)
\`\`\`js
// din kod här
console.log("resultat");
\`\`\`
Stödda språk: javascript, typescript, python, shell.
Använd sandbox när du vill: bevisa ett påstående med kod, testa en algoritm, göra beräkningar, eller skapa en prototyp.

Svara koncist (max 2-3 stycken + eventuella minnes-markeringar). Skriv på samma språk som ämnet.`;

      let reply = "";
      const MAX_RETRIES = 3;
      let succeeded = false;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          reply = await participant.respond(prompt);
          succeeded = true;
          break;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const isRateLimit = /rate.?limit|429|quota|resource.?exhaust/i.test(errMsg);
          if (isRateLimit && attempt < MAX_RETRIES - 1) {
            const backoff = (attempt + 1) * 3000; // 3s, 6s
            console.log(`[arena] ${participant.name} rate limited, retry ${attempt + 1}/${MAX_RETRIES} in ${backoff}ms`);
            io.emit("arena_status", { thinking: participant.id, round, maxRounds, phase: `⏳ Rate limit — väntar ${backoff / 1000}s...`, sessionId: session.id });
            await new Promise((r) => setTimeout(r, backoff));
          } else {
            reply = `⚠️ ${participant.name} kunde inte svara: ${errMsg.slice(0, 200)}`;
            break;
          }
        }
      }
      if (!succeeded && !reply!) reply = `⚠️ ${participant.name} kunde inte svara efter ${MAX_RETRIES} försök.`;

      if (arenaAbort) break;

      // Extract and save memories (skip if error message)
      const isError = reply.startsWith("⚠️");
      const newMemories = isError ? [] : extractMemories(reply, participant.id, topic, session.id);
      if (newMemories.length > 0) {
        io.emit("arena_memories", newMemories);
      }

      // Calculate surprise score — how much this reply deviates from conversation consensus
      const surpriseScore = isError ? 0 : calculateSurpriseScore(reply, conversationSoFar);

      const msg: ArenaMessage = {
        id: uuidv4(), role: participant.id, content: reply,
        timestamp: new Date().toISOString(), phase,
        memoryId: newMemories.length > 0 ? newMemories[0].id : undefined,
        surpriseScore,
      };
      arenaMessages.push(msg);
      io.emit("arena_message", msg);
      if (surpriseScore > 0.6) {
        console.log(`[arena] 🎯 High surprise (${surpriseScore}) from ${participant.name} in ${phase}`);
      }
      saveArenaMessages();

      // --- Sandbox: parse and execute code blocks ---
      if (!isError) {
        const sandboxCmds = parseSandboxCommands(reply);
        if (sandboxCmds.length > 0) {
          const sandbox = getSandboxForArena(session.id);
          for (const cmd of sandboxCmds) {
            io.emit("arena_status", { thinking: participant.id, round, maxRounds, phase: `🧪 Sandbox: ${cmd.description || cmd.filename || cmd.language}...`, sessionId: session.id });
            try {
              const exec = executeSandbox(sandbox.id, participant.id, participant.name, cmd.code, cmd.language, cmd.filename);
              const resultContent = formatExecutionResult(exec);
              const sandboxMsg: ArenaMessage = {
                id: uuidv4(), role: "system", content: resultContent,
                timestamp: new Date().toISOString(), phase,
              };
              arenaMessages.push(sandboxMsg);
              io.emit("arena_message", sandboxMsg);
              io.emit("sandbox_execution", { sessionId: sandbox.id, execution: exec });
              saveArenaMessages();
              conversationSoFar += `\n[Sandbox - ${participant.name}]: ${resultContent}\n`;
            } catch (sandboxErr) {
              console.error(`[sandbox] Execution failed for ${participant.name}:`, sandboxErr);
            }
          }
        }
        conversationSoFar += `\n[${participant.name} - ${config.label}]: ${reply}\n`;
      }
      updateSession(session.id, { rounds: round });

      // Longer delay between Gemini agents to avoid rate limits (same API key)
      const isGeminiAgent = participant.id.startsWith("gemini");
      const nextParticipant = participants[(phaseRound + 1) % participants.length];
      const nextIsGemini = nextParticipant?.id.startsWith("gemini");
      const delay = (isGeminiAgent && nextIsGemini) ? 2500 : 800;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // Generate final summary
  if (!arenaAbort && conversationSoFar) {
    io.emit("arena_status", { thinking: "claude", round, maxRounds, phase: "📝 Sammanfattning" });

    try {
      const summaryPrompt = `Sammanfatta denna forskningssession MYCKET koncist (max 5 punkter).
${participants.length} deltagare deltog: ${participants.map(p => `${p.emoji} ${p.name}`).join(", ")}

ÄMNE: "${topic}"

${conversationSoFar}

Ge en kort sammanfattning med de viktigaste insikterna, besluten och nästa steg. Skriv på samma språk som ämnet.`;

      const summary = await agent.respondPlain(summaryPrompt);
      const summaryMem = addMemory({
        type: "summary",
        content: summary,
        author: "both",
        topic,
        tags: [topic.slice(0, 30), "summary"],
        references: [],
      });
      addMemoryToSession(session.id, summaryMem.id);
      updateSession(session.id, { summary, status: "completed", completedAt: new Date().toISOString() });

      const summaryMsg: ArenaMessage = {
        id: uuidv4(), role: "system",
        content: `📝 **Sammanfattning**\n\n${summary}`,
        timestamp: new Date().toISOString(), phase: "summary",
      };
      arenaMessages.push(summaryMsg);
      io.emit("arena_message", summaryMsg);
      io.emit("arena_memories", [summaryMem]);
      saveArenaMessages();
    } catch {}
  }

  arenaRunning = false;
  currentSessionId = null;
  io.emit("arena_status", { thinking: null, round: 0, maxRounds: 0, done: true });
}

app.post("/api/arena/start", (req, res) => {
  if (arenaRunning) return res.status(409).json({ error: "Arena already running" });
  const { topic, rounds, mode } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic required" });
  const maxRounds = Math.min(parseInt(rounds, 10) || 8, 20);
  const researchMode = mode || "full"; // "full", "quick", "adversarial", "deepdive"
  runResearchLab(topic, researchMode, maxRounds);
  res.json({ ok: true, topic, rounds: maxRounds, mode: researchMode });
});

app.get("/api/arena/protocols", (_req, res) => {
  res.json(Object.entries(RESEARCH_PROTOCOLS).map(([id, p]) => ({ id, ...p })));
});

app.post("/api/arena/stop", (_req, res) => {
  arenaAbort = true;
  if (currentSessionId) updateSession(currentSessionId, { status: "paused" });
  res.json({ ok: true });
});

app.get("/api/arena/messages", (_req, res) => {
  res.json(arenaMessages);
});

app.delete("/api/arena/messages", (_req, res) => {
  arenaMessages.length = 0;
  saveArenaMessages();
  io.emit("arena_history", []);
  res.json({ ok: true });
});

app.get("/api/arena/status", (_req, res) => {
  res.json({ running: arenaRunning, sessionId: currentSessionId });
});

app.get("/api/arena/participants", (_req, res) => {
  const participants = getArenaParticipants();
  res.json(participants.map(p => ({ id: p.id, name: p.name, emoji: p.emoji, enabled: p.enabled })));
});

app.post("/api/arena/vote", (req, res) => {
  const { messageId, direction } = req.body;
  if (!messageId || !["up", "down"].includes(direction)) {
    return res.status(400).json({ error: "messageId and direction (up/down) required" });
  }
  const msg = arenaMessages.find(m => m.id === messageId);
  if (!msg) return res.status(404).json({ error: "Message not found" });
  if (!msg.votes) msg.votes = { up: 0, down: 0 };
  msg.votes[direction as "up" | "down"]++;
  saveArenaMessages();
  io.emit("arena_vote", { messageId, votes: msg.votes });
  res.json({ ok: true, votes: msg.votes });
});

app.get("/api/arena/ranking", (_req, res) => {
  const agentScores: Record<string, { up: number; down: number; total: number; messages: number }> = {};
  for (const msg of arenaMessages) {
    if (msg.role === "system") continue;
    if (!agentScores[msg.role]) agentScores[msg.role] = { up: 0, down: 0, total: 0, messages: 0 };
    agentScores[msg.role].messages++;
    if (msg.votes) {
      agentScores[msg.role].up += msg.votes.up;
      agentScores[msg.role].down += msg.votes.down;
      agentScores[msg.role].total += msg.votes.up - msg.votes.down;
    }
  }
  const ranking = Object.entries(agentScores)
    .map(([id, scores]) => ({ id, ...scores }))
    .sort((a, b) => b.total - a.total);
  res.json(ranking);
});

app.get("/api/arena/export", (_req, res) => {
  if (arenaMessages.length === 0) return res.status(404).json({ error: "No messages to export" });

  const agentNames: Record<string, string> = {
    claude: "🏗️ Claude", gemini: "🔍 Gemini",
    "gemini-innovator": "🧪 Gemini-Innovatör", "gemini-verifier": "📊 Gemini-Verifierare",
    ollama: "🦙 Ollama", system: "📋 System",
  };

  let md = `# AI Research Arena — Export\n\n`;
  md += `**Exporterad:** ${new Date().toLocaleString("sv-SE")}\n`;
  md += `**Antal meddelanden:** ${arenaMessages.length}\n\n---\n\n`;

  let currentPhase = "";
  for (const msg of arenaMessages) {
    if (msg.phase && msg.phase !== currentPhase && msg.role === "system") {
      currentPhase = msg.phase;
      md += `## ${msg.content}\n\n`;
      continue;
    }
    const name = agentNames[msg.role] || msg.role;
    const time = new Date(msg.timestamp).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    const voteStr = msg.votes ? ` (👍 ${msg.votes.up} / 👎 ${msg.votes.down})` : "";
    md += `### ${name} — ${time}${voteStr}\n\n`;
    md += `${msg.content}\n\n---\n\n`;
  }

  // Add ranking summary
  const agentScores: Record<string, { up: number; down: number; messages: number }> = {};
  for (const msg of arenaMessages) {
    if (msg.role === "system") continue;
    if (!agentScores[msg.role]) agentScores[msg.role] = { up: 0, down: 0, messages: 0 };
    agentScores[msg.role].messages++;
    if (msg.votes) {
      agentScores[msg.role].up += msg.votes.up;
      agentScores[msg.role].down += msg.votes.down;
    }
  }
  const ranking = Object.entries(agentScores).sort((a, b) => (b[1].up - b[1].down) - (a[1].up - a[1].down));
  if (ranking.some(([, s]) => s.up > 0 || s.down > 0)) {
    md += `## 🏆 Ranking\n\n| # | Agent | 👍 | 👎 | Netto | Meddelanden |\n|---|-------|-----|-----|-------|-------------|\n`;
    ranking.forEach(([id, s], i) => {
      md += `| ${i + 1} | ${agentNames[id] || id} | ${s.up} | ${s.down} | ${s.up - s.down} | ${s.messages} |\n`;
    });
    md += `\n`;
  }

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="arena-export-${Date.now()}.md"`);
  res.send(md);
});

// --- Sandbox API ---

app.post("/api/sandbox/execute", (req, res) => {
  const { sessionId, arenaSessionId, agentId, agentName, code, language, filename } = req.body;
  if (!code) return res.status(400).json({ error: "code required" });
  try {
    const sandbox = sessionId
      ? (() => { const s = getSandboxByArena(sessionId) || getSandboxForArena(sessionId); return s; })()
      : arenaSessionId
        ? getSandboxForArena(arenaSessionId)
        : getSandboxForArena("manual");
    const exec = executeSandbox(sandbox.id, agentId || "user", agentName || "User", code, language || "javascript", filename);
    io.emit("sandbox_execution", { sessionId: sandbox.id, execution: exec });
    res.json(exec);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.get("/api/sandbox/session/:arenaSessionId", (req, res) => {
  const sandbox = getSandboxByArena(req.params.arenaSessionId);
  if (!sandbox) return res.status(404).json({ error: "No sandbox for this session" });
  res.json({
    id: sandbox.id,
    arenaSessionId: sandbox.arenaSessionId,
    createdAt: sandbox.createdAt,
    files: listSandboxFiles(sandbox.id),
    executionCount: sandbox.executions.length,
  });
});

app.get("/api/sandbox/files/:sessionId", (req, res) => {
  res.json(listSandboxFiles(req.params.sessionId));
});

app.get("/api/sandbox/file/:sessionId/:filename", (req, res) => {
  const file = readSandboxFile(req.params.sessionId, req.params.filename);
  if (!file) return res.status(404).json({ error: "File not found" });
  res.json(file);
});

app.post("/api/sandbox/file/:sessionId", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || content === undefined) return res.status(400).json({ error: "filename and content required" });
  try {
    const file = writeSandboxFile(req.params.sessionId, filename, content);
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.get("/api/sandbox/executions/:sessionId", (req, res) => {
  res.json(getSandboxExecutions(req.params.sessionId));
});

// --- Swarm Intelligence API ---

let swarmRunning = false;

app.post("/api/swarm/query", async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "question required" });
  if (swarmRunning) return res.status(409).json({ error: "Swarm is already running" });

  const nodes = swarm.getNodes();
  if (nodes.length < 2) {
    return res.status(400).json({ error: `Svärmen behöver minst 2 aktiva noder (har ${nodes.length}). Kontrollera API-nycklar.` });
  }

  swarmRunning = true;
  swarm.setProgressCallback((phase, detail) => {
    io.emit("swarm_progress", { phase, detail, timestamp: new Date().toISOString() });
  });

  try {
    const result = await swarm.query(question);
    io.emit("swarm_result", result);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  } finally {
    swarmRunning = false;
  }
});

app.get("/api/swarm/nodes", (_req, res) => {
  const nodes = swarm.getNodes();
  res.json(nodes.map(n => ({
    id: n.personality.id,
    label: n.personality.label,
    emoji: n.personality.emoji,
    domain: n.personality.domain,
    description: n.personality.description,
    influence: n.personality.influence,
    enabled: n.isEnabled(),
  })));
});

app.get("/api/swarm/personalities", (_req, res) => {
  res.json(getAvailablePersonalities());
});

app.get("/api/swarm/sessions", (_req, res) => {
  const sessions = swarm.getSessions();
  res.json(sessions.map(s => ({
    sessionId: s.sessionId,
    query: s.query,
    timestamp: s.timestamp,
    nodeCount: s.nodeResponses.length,
    metrics: s.metrics,
  })));
});

app.get("/api/swarm/session/:sessionId", (req, res) => {
  const sessions = swarm.getSessions();
  const session = sessions.find(s => s.sessionId === req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

app.get("/api/swarm/status", (_req, res) => {
  res.json({
    running: swarmRunning,
    nodeCount: swarm.getNodes().length,
    sessionCount: swarm.getSessions().length,
    lastSession: swarm.getLastSession()?.timestamp || null,
  });
});

// --- Shared Memory API ---
app.get("/api/shared-memory", (req, res) => {
  const { topic, type, author, limit } = req.query;
  res.json(getMemories({
    topic: topic as string,
    type: type as string,
    author: author as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
  }));
});

app.get("/api/shared-memory/all", (_req, res) => {
  res.json({ memories: getAllMemories(), sessions: getSessions() });
});

app.delete("/api/shared-memory", (_req, res) => {
  clearMemories();
  io.emit("shared_memories", []);
  res.json({ ok: true });
});

app.delete("/api/shared-memory/:id", (req, res) => {
  const ok = deleteMemoryById(req.params.id);
  res.json({ ok });
});

app.get("/api/sessions", (_req, res) => {
  res.json(getSessions());
});

app.get("/api/sessions/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  const memories = getMemoriesBySession(req.params.id);
  res.json({ session, memories });
});

// --- Orchestrator API ---
app.get("/api/orchestrator/status", (_req, res) => {
  res.json(orchestrator.getStats());
});

app.get("/api/orchestrator/workers", (_req, res) => {
  res.json(orchestrator.getWorkers());
});

app.get("/api/orchestrator/tasks", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json(orchestrator.getTasks(limit));
});

app.get("/api/orchestrator/tasks/:id", (req, res) => {
  const task = orchestrator.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.post("/api/orchestrator/task", async (req, res) => {
  try {
    const { type, prompt, priority, consensus, workers } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt required" });
    const task = await orchestrator.submitTask(
      type || "general",
      prompt,
      {
        priority: priority || "normal",
        requireConsensus: !!consensus,
        specificWorkers: workers,
      }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/orchestrator/workers/:id/reset", (req, res) => {
  const ok = orchestrator.resetWorker(req.params.id);
  res.json({ ok });
});

app.post("/api/orchestrator/workers/:id/toggle", (req, res) => {
  const { enabled } = req.body;
  const ok = orchestrator.setWorkerEnabled(req.params.id, !!enabled);
  res.json({ ok });
});

app.get("/api/orchestrator/learnings", (_req, res) => {
  res.json(orchestrator.getLearnings());
});

app.get("/api/orchestrator/learnings/:workerId", (req, res) => {
  res.json(orchestrator.getWorkerLearning(req.params.workerId));
});

app.get("/api/orchestrator/bias-alerts", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;
  res.json(orchestrator.getBiasAlerts(limit));
});

app.get("/api/orchestrator/audit", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json(orchestrator.getAuditLog(limit));
});

// --- Hierarchy Agent Coordination API (Task P) ---

app.get("/api/hierarchy/stats", (_req, res) => {
  res.json(getHierarchyStats());
});

app.get("/api/hierarchy/workflows", (req, res) => {
  const limit = parseInt(req.query.limit as string || "20", 10);
  res.json(listHierarchyWorkflows(limit));
});

app.get("/api/hierarchy/workflows/:id", (req, res) => {
  const wf = getHierarchyWorkflow(req.params.id);
  if (!wf) return res.status(404).json({ error: "Workflow not found" });
  res.json(wf);
});

app.post("/api/hierarchy/workflows", async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ error: "goal required" });
    const wf = await startWorkflow(goal);
    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post("/api/hierarchy/workflows/:id/cancel", (req, res) => {
  const ok = cancelWorkflow(req.params.id);
  res.json({ ok });
});

app.post("/api/hierarchy/workflows/:id/retry", (req, res) => {
  const wf = retryWorkflow(req.params.id);
  if (!wf) return res.status(404).json({ error: "Workflow not found or not retryable" });
  res.json(wf);
});

// --- Gemini API ---
app.get("/api/gemini/status", (_req, res) => {
  res.json({ enabled: geminiAgent.isEnabled(), tokens: geminiAgent.getTokenUsage() });
});

app.get("/api/gemini/messages", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json(geminiMessages.slice(-limit));
});

app.delete("/api/gemini/messages", (_req, res) => {
  geminiMessages.length = 0;
  geminiAgent.clearHistory();
  saveGeminiMessages(geminiMessages);
  io.emit("gemini_history", []);
  res.json({ ok: true });
});

app.get("/api/gemini/tokens", (_req, res) => {
  res.json(geminiAgent.getTokenUsage());
});

// --- RAG API (Weaviate + BM25 fallback) ---
app.get("/api/rag/sources", async (_req, res) => {
  if (isWeaviateConnected()) {
    const wSources = await weaviateListSources();
    const bSources = ragListSources();
    res.json({ weaviate: wSources, bm25: bSources, backend: "weaviate" });
  } else {
    res.json({ weaviate: [], bm25: ragListSources(), backend: "bm25" });
  }
});

// --- Frankenstein AI Training Start/Stop ---
const frankTrainState: {
  process: ReturnType<typeof spawn> | null;
  running: boolean;
  started_at: string | null;
  pid: number | null;
} = { process: null, running: false, started_at: null, pid: null };

// --- Frankenstein Trading Bot Start/Stop ---
const traderState: {
  process: ReturnType<typeof spawn> | null;
  running: boolean;
  started_at: string | null;
  pid: number | null;
} = { process: null, running: false, started_at: null, pid: null };

const traderLiveState: {
  active: boolean;
  events: any[];
  last_update: number;
} = { active: false, events: [], last_update: 0 };

// --- Market data (public ticker) streaming ---
type MarketExchange = "kraken" | "binance";
type MarketSubscription = {
  exchange: MarketExchange;
  symbols: string[];
  intervalMs: number;
};

const marketSubs = new Map<string, MarketSubscription>(); // socket.id -> subscription
let marketTimer: NodeJS.Timeout | null = null;
let marketTimerMs = 0;
let marketInFlight = false;

function normalizeSymbol(sym: string) {
  return String(sym || "").trim().toUpperCase().replace(/[\s\-_/]/g, "");
}

function toKrakenPair(sym: string) {
  const s = normalizeSymbol(sym);
  // Kraken commonly uses XBT instead of BTC.
  if (s.startsWith("BTC")) return `XBT${s.slice(3)}`;
  return s;
}

async function fetchBinancePrices(symbols: string[]): Promise<Record<string, number>> {
  const uniq = Array.from(new Set(symbols.map(normalizeSymbol))).filter(Boolean);
  if (uniq.length === 0) return {};

  const base = process.env.BINANCE_BASE_URL || "https://api.binance.com";
  const url = uniq.length === 1
    ? `${base}/api/v3/ticker/price?symbol=${encodeURIComponent(uniq[0])}`
    : `${base}/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(uniq))}`;

  const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return {};
  const data: any = await res.json().catch(() => null);

  const out: Record<string, number> = {};
  const list = Array.isArray(data) ? data : (data ? [data] : []);
  for (const row of list) {
    const sym = normalizeSymbol(row?.symbol);
    const price = Number(row?.price);
    if (!sym || !Number.isFinite(price) || price <= 0) continue;
    out[sym] = price;
  }
  return out;
}

async function fetchKrakenPrices(symbols: string[]): Promise<Record<string, number>> {
  const uniqSymbols = Array.from(new Set(symbols.map(normalizeSymbol))).filter(Boolean);
  if (uniqSymbols.length === 0) return {};

  const pairMap = new Map<string, string>(); // requestedPair -> originalSymbol
  const pairs = Array.from(new Set(uniqSymbols.map((s) => {
    const p = toKrakenPair(s);
    if (!pairMap.has(p)) pairMap.set(p, s);
    return p;
  })));

  const base = process.env.KRAKEN_BASE_URL || "https://api.kraken.com";
  const url = `${base}/0/public/Ticker?pair=${encodeURIComponent(pairs.join(","))}`;
  const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return {};

  const data: any = await res.json().catch(() => null);
  const result = data?.result && typeof data.result === "object" ? data.result : null;
  if (!result) return {};

  const out: Record<string, number> = {};
  for (const [key, val] of Object.entries(result)) {
    const k = normalizeSymbol(key);
    // Prefer close (last trade) price.
    const c0 = (val as any)?.c?.[0];
    const a0 = (val as any)?.a?.[0];
    const price = Number(c0 ?? a0);
    if (!Number.isFinite(price) || price <= 0) continue;

    const orig = pairMap.get(k) || pairMap.get(k.replace(/^XBT/, "BTC"));
    if (orig) out[orig] = price;
  }

  // Fallback: if Kraken returned keys exactly as requested, but we didn't match due to formatting
  for (const [pair, orig] of pairMap.entries()) {
    if (out[orig] != null) continue;
    const hit = (result as any)[pair] || (result as any)[pair.toUpperCase()] || null;
    const price = Number(hit?.c?.[0] ?? hit?.a?.[0]);
    if (!Number.isFinite(price) || price <= 0) continue;
    out[orig] = price;
  }

  return out;
}

function ensureMarketTimer() {
  const subs = Array.from(marketSubs.values());
  const desired = subs.length > 0
    ? Math.max(500, Math.min(...subs.map((s) => (Number.isFinite(s.intervalMs) ? s.intervalMs : 1000))))
    : 0;

  if (!desired) {
    if (marketTimer) clearInterval(marketTimer);
    marketTimer = null;
    marketTimerMs = 0;
    return;
  }

  if (marketTimer && marketTimerMs === desired) return;
  if (marketTimer) clearInterval(marketTimer);
  marketTimerMs = desired;

  marketTimer = setInterval(() => {
    if (marketInFlight) return;
    marketInFlight = true;

    const byExchange: Record<MarketExchange, Set<string>> = {
      kraken: new Set<string>(),
      binance: new Set<string>(),
    };
    for (const sub of marketSubs.values()) {
      const ex: MarketExchange = sub.exchange;
      for (const sym of sub.symbols) byExchange[ex].add(normalizeSymbol(sym));
    }

    const ts = new Date().toISOString();

    (async () => {
      const krakenSyms = Array.from(byExchange.kraken);
      const binanceSyms = Array.from(byExchange.binance);

      const [krakenPrices, binancePrices] = await Promise.all([
        krakenSyms.length > 0 ? fetchKrakenPrices(krakenSyms) : Promise.resolve({}),
        binanceSyms.length > 0 ? fetchBinancePrices(binanceSyms) : Promise.resolve({}),
      ]);

      const sendToSocket = (socketId: string, exchange: MarketExchange, all: Record<string, number>) => {
        const sub = marketSubs.get(socketId);
        if (!sub || sub.exchange !== exchange) return;

        const prices: Record<string, number> = {};
        for (const sym of sub.symbols) {
          const s = normalizeSymbol(sym);
          const p = all[s];
          if (!Number.isFinite(p) || p <= 0) continue;
          prices[s] = p;
        }
        if (Object.keys(prices).length === 0) return;
        io.to(socketId).emit("market_prices", { exchange, ts, prices });
      };

      for (const socketId of marketSubs.keys()) {
        sendToSocket(socketId, "kraken", krakenPrices);
        sendToSocket(socketId, "binance", binancePrices);
      }
    })().catch((err) => {
      console.error("[market] ticker fetch failed:", err instanceof Error ? err.message : String(err));
    }).finally(() => {
      marketInFlight = false;
    });
  }, desired);
}

function tailLines(path: string, maxLines: number): string[] {
  try {
    if (!existsSync(path)) return [];
    const content = readFileSync(path, "utf-8");
    const lines = content.split("\n");
    return lines.slice(-maxLines).filter(Boolean);
  } catch {
    return [];
  }
}

app.post("/api/frankenstein/train/start", (_req, res) => {
  if (frankTrainState.running && frankTrainState.process) {
    return res.status(409).json({ error: "Training already running", pid: frankTrainState.pid });
  }

  const trainScript = join(WORKSPACE_ROOT, "frankenstein-ai", "continuous_train.py");
  if (!existsSync(trainScript)) {
    return res.status(404).json({ error: "continuous_train.py not found" });
  }

  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  const proc = spawn(pythonCmd, ["-u", "continuous_train.py"], {
    cwd: join(WORKSPACE_ROOT, "frankenstein-ai"),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PYTHONIOENCODING: "utf-8", BRIDGE_URL: `http://localhost:${PORT}` },
  });

  frankTrainState.process = proc;
  frankTrainState.running = true;
  frankTrainState.started_at = new Date().toISOString();
  frankTrainState.pid = proc.pid || null;

  proc.stdout?.on("data", (data: Buffer) => {
    const line = data.toString("utf-8").trim();
    if (line) console.log(`[frank-train] ${line}`);
  });
  proc.stderr?.on("data", (data: Buffer) => {
    const line = data.toString("utf-8").trim();
    if (line) console.error(`[frank-train] ${line}`);
  });
  proc.on("close", (code) => {
    console.log(`[frank-train] Process exited with code ${code}`);
    frankTrainState.process = null;
    frankTrainState.running = false;
    frankTrainState.pid = null;
  });

  res.json({ status: "started", pid: proc.pid });
});

app.post("/api/frankenstein/train/stop", (_req, res) => {
  if (!frankTrainState.running || !frankTrainState.process) {
    return res.json({ status: "not_running" });
  }
  frankTrainState.process.kill("SIGTERM");
  frankTrainState.process = null;
  frankTrainState.running = false;
  frankTrainState.pid = null;
  res.json({ status: "stopped" });
});

app.get("/api/frankenstein/train/status", (_req, res) => {
  res.json({
    running: frankTrainState.running,
    pid: frankTrainState.pid,
    started_at: frankTrainState.started_at,
  });
});

app.get("/api/trader/symbols", (req, res) => {
  const exchangeRaw = typeof req.query?.exchange === "string" ? String(req.query.exchange).trim().toLowerCase() : "";
  const exchange = exchangeRaw === "kraken" || exchangeRaw === "binance" ? exchangeRaw : "binance";

  // Curated "top" list (approx top 20 large caps). This is intentionally static to avoid
  // external dependencies and rate limits. UI can treat this as a fun/casino-like universe.
  const assetsTop20 = [
    "BTC",
    "ETH",
    "SOL",
    "BNB",
    "XRP",
    "ADA",
    "DOGE",
    "AVAX",
    "DOT",
    "LINK",
    "LTC",
    "BCH",
    "ATOM",
    "XLM",
    "NEAR",
    "ICP",
    "FIL",
    "APT",
    "OP",
    "ARB",
  ];

  // Kraken uses different asset codes for some coins. The trading bot has a partial normalizer
  // (BTC->XBT), but not for all assets. For now, be conservative: only expose pairs we expect to
  // commonly exist as <ASSET>USDT.
  const krakenSafeAssets = new Set([
    "BTC",
    "ETH",
    "SOL",
    "XRP",
    "ADA",
    "DOGE",
    "AVAX",
    "DOT",
    "LINK",
    "LTC",
    "BCH",
    "ATOM",
    "XLM",
    "NEAR",
    "ICP",
    "FIL",
  ]);

  const assets = exchange === "kraken" ? assetsTop20.filter((a) => krakenSafeAssets.has(a)) : assetsTop20;
  const symbols = assets.map((a) => `${a}USDT`);

  res.json({ exchange, assets, symbols, max: symbols.length });
});

app.post("/api/trader/start", (req, res) => {
  if (traderState.running && traderState.process) {
    return res.status(409).json({ error: "Trader already running", pid: traderState.pid });
  }

  const botScript = join(DEFAULT_WORKSPACE_ROOT, "frankenstein-ai", "trading", "trading_bot.py");
  if (!existsSync(botScript)) {
    return res.status(404).json({ error: "trading_bot.py not found" });
  }

  const symbols = Array.isArray(req.body?.symbols)
    ? req.body.symbols.map((s: any) => String(s).trim()).filter(Boolean)
    : undefined;
  const exchange = typeof req.body?.exchange === "string" ? String(req.body.exchange).trim().toLowerCase() : undefined;
  const safeExchange = exchange === "kraken" || exchange === "binance" ? exchange : undefined;
  const paperMode = typeof req.body?.paperMode === "boolean" ? req.body.paperMode : true;
  const intervalSeconds = req.body?.intervalSeconds != null ? Number(req.body.intervalSeconds) : undefined;
  const riskPerTrade = req.body?.riskPerTrade != null ? Number(req.body.riskPerTrade) : undefined;
  const minConfidence = req.body?.minConfidence != null ? Number(req.body.minConfidence) : undefined;
  const strategy = typeof req.body?.strategy === "string" ? String(req.body.strategy).trim().toLowerCase() : undefined;
  const safeStrategy = strategy === "grid" || strategy === "inference" ? strategy : undefined;
  const klinesInterval = typeof req.body?.klinesInterval === "string" ? String(req.body.klinesInterval).trim() : undefined;

  const gridLevels = req.body?.gridLevels != null ? Number(req.body.gridLevels) : undefined;
  const gridSpacing = typeof req.body?.gridSpacing === "string" ? String(req.body.gridSpacing).trim().toLowerCase() : undefined;
  const gridBudget = req.body?.gridBudget != null ? Number(req.body.gridBudget) : undefined;
  const gridLower = req.body?.gridLower != null ? Number(req.body.gridLower) : undefined;
  const gridUpper = req.body?.gridUpper != null ? Number(req.body.gridUpper) : undefined;
  const maxPositions = req.body?.maxPositions != null ? Number(req.body.maxPositions) : undefined;
  const cooldownSeconds = req.body?.cooldownSeconds != null ? Number(req.body.cooldownSeconds) : undefined;
  const takeProfitPct = req.body?.takeProfitPct != null ? Number(req.body.takeProfitPct) : undefined;
  const stopLossPct = req.body?.stopLossPct != null ? Number(req.body.stopLossPct) : undefined;
  const trailingStopPct = req.body?.trailingStopPct != null ? Number(req.body.trailingStopPct) : undefined;
  const aggression = req.body?.aggression != null ? Number(req.body.aggression) : undefined;
  const targetOrderCount = req.body?.targetOrderCount != null ? Number(req.body.targetOrderCount) : undefined;
  const maxRuntimeSeconds = req.body?.maxRuntimeSeconds != null ? Number(req.body.maxRuntimeSeconds) : undefined;

  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  const proc = spawn(pythonCmd, ["-u", botScript], {
    cwd: join(DEFAULT_WORKSPACE_ROOT, "frankenstein-ai"),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      BRIDGE_URL: `http://localhost:${PORT}`,
      TRADING_DATA_DIR: join(WORKSPACE_ROOT, "frankenstein-ai", "trading_data"),
      ...(safeExchange ? { TRADING_EXCHANGE: safeExchange } : {}),
      ...(symbols && symbols.length > 0 ? { TRADING_SYMBOLS: symbols.join(",") } : {}),
      TRADING_PAPER_MODE: paperMode ? "true" : "false",
      ...(Number.isFinite(intervalSeconds) && intervalSeconds! > 0 ? { TRADING_INTERVAL_SECONDS: String(intervalSeconds) } : {}),
      ...(Number.isFinite(riskPerTrade) && riskPerTrade! > 0 ? { TRADING_RISK_PER_TRADE: String(riskPerTrade) } : {}),
      ...(Number.isFinite(minConfidence) && minConfidence! > 0 ? { TRADING_MIN_CONFIDENCE: String(minConfidence) } : {}),
      ...(safeStrategy ? { TRADING_STRATEGY: safeStrategy } : {}),
      ...(klinesInterval ? { TRADING_KLINE_INTERVAL: klinesInterval } : {}),

      ...(Number.isFinite(gridLevels) && gridLevels! > 0 ? { TRADING_GRID_LEVELS: String(Math.floor(gridLevels!)) } : {}),
      ...(gridSpacing && (gridSpacing === "linear" || gridSpacing === "geometric") ? { TRADING_GRID_SPACING: gridSpacing } : {}),
      ...(Number.isFinite(gridBudget) && gridBudget! > 0 ? { TRADING_GRID_BUDGET: String(gridBudget!) } : {}),
      ...(Number.isFinite(gridLower) && gridLower! >= 0 ? { TRADING_GRID_LOWER: String(gridLower!) } : {}),
      ...(Number.isFinite(gridUpper) && gridUpper! >= 0 ? { TRADING_GRID_UPPER: String(gridUpper!) } : {}),
      ...(Number.isFinite(maxPositions) && maxPositions! > 0 ? { TRADING_MAX_POSITIONS: String(maxPositions) } : {}),
      ...(Number.isFinite(cooldownSeconds) && cooldownSeconds! >= 0 ? { TRADING_COOLDOWN_SECONDS: String(cooldownSeconds) } : {}),
      ...(Number.isFinite(takeProfitPct) && takeProfitPct! >= 0 ? { TRADING_TAKE_PROFIT_PCT: String(takeProfitPct) } : {}),
      ...(Number.isFinite(stopLossPct) && stopLossPct! >= 0 ? { TRADING_STOP_LOSS_PCT: String(stopLossPct) } : {}),
      ...(Number.isFinite(trailingStopPct) && trailingStopPct! >= 0 ? { TRADING_TRAILING_STOP_PCT: String(trailingStopPct) } : {}),
      ...(Number.isFinite(aggression) && aggression! >= 0 ? { TRADING_AGGRESSION: String(aggression) } : {}),
      ...(Number.isFinite(targetOrderCount) && targetOrderCount! > 0 ? { TRADING_TARGET_ORDER_COUNT: String(Math.floor(targetOrderCount!)) } : {}),
      ...(Number.isFinite(maxRuntimeSeconds) && maxRuntimeSeconds! > 0 ? { TRADING_MAX_RUNTIME_SECONDS: String(Math.floor(maxRuntimeSeconds!)) } : {}),
    },
  });

  traderState.process = proc;
  traderState.running = true;
  traderState.started_at = new Date().toISOString();
  traderState.pid = proc.pid || null;

  traderLiveState.active = true;
  traderLiveState.last_update = Date.now();

  proc.stdout?.on("data", (data: Buffer) => {
    const line = data.toString("utf-8").trim();
    if (line) console.log(`[trader] ${line}`);
  });
  proc.stderr?.on("data", (data: Buffer) => {
    const line = data.toString("utf-8").trim();
    if (line) console.error(`[trader] ${line}`);
  });
  proc.on("close", (code) => {
    console.log(`[trader] Process exited with code ${code}`);
    traderState.process = null;
    traderState.running = false;
    traderState.pid = null;
    traderLiveState.active = false;
  });

  res.json({ status: "started", pid: proc.pid });
});

app.post("/api/trader/stop", (_req, res) => {
  if (!traderState.running || !traderState.process) {
    return res.json({ status: "not_running" });
  }
  traderState.process.kill("SIGTERM");
  traderState.process = null;
  traderState.running = false;
  traderState.pid = null;
  traderLiveState.active = false;
  res.json({ status: "stopped" });
});

app.get("/api/trader/status", (_req, res) => {
  res.json({
    running: traderState.running,
    pid: traderState.pid,
    started_at: traderState.started_at,
    last_update: traderLiveState.last_update,
  });
});

app.post("/api/trader/event", (req, res) => {
  const { event } = req.body || {};
  if (!event) return res.status(400).json({ error: "No event" });
  event.timestamp = Date.now();
  traderLiveState.events.push(event);
  traderLiveState.last_update = Date.now();
  if (traderLiveState.events.length > 200) traderLiveState.events = traderLiveState.events.slice(-200);
  io.emit("trader_event", event);
  res.json({ ok: true });
});

app.get("/api/trader/live", (_req, res) => {
  const limit = parseInt((_req.query.limit as string) || "50", 10);
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, limit)) : 50;
  res.json({
    active: traderLiveState.active,
    events: traderLiveState.events.slice(-safeLimit),
    last_update: traderLiveState.last_update,
    event_count: traderLiveState.events.length,
  });
});

app.get("/api/trader/state", (_req, res) => {
  try {
    const statePath = join(WORKSPACE_ROOT, "frankenstein-ai", "trading_data", "state.json");
    if (!existsSync(statePath)) return res.json({ running: false, state: null });
    const data = JSON.parse(readFileSync(statePath, "utf-8"));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/trader/log", (_req, res) => {
  const logPath = join(WORKSPACE_ROOT, "frankenstein-ai", "trading_data", "trader.log");
  const lines = parseInt((_req.query.lines as string) || "200", 10);
  const safeLines = Number.isFinite(lines) ? Math.max(1, Math.min(2000, lines)) : 200;
  res.json({ lines: tailLines(logPath, safeLines) });
});

app.get("/api/trader/trades", (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) || "200", 10);
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(2000, limit)) : 200;
    const tradesPath = join(WORKSPACE_ROOT, "frankenstein-ai", "trading_data", "trades.jsonl");
    const lines = tailLines(tradesPath, safeLimit);
    const trades = lines
      .map((l) => {
        try { return JSON.parse(l); } catch { return null; }
      })
      .filter(Boolean);
    res.json({ trades, line_count: lines.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// --- Manual Order Placement ---
app.post("/api/trader/order", (req, res) => {
  const { symbol, side, quantity, price } = req.body || {};
  if (!symbol || !side || !quantity) {
    return res.status(400).json({ error: "Missing required fields: symbol, side, quantity" });
  }
  const safeSide = String(side).toUpperCase();
  if (safeSide !== "BUY" && safeSide !== "SELL") {
    return res.status(400).json({ error: "side must be BUY or SELL" });
  }
  const safeQty = Number(quantity);
  if (!Number.isFinite(safeQty) || safeQty <= 0) {
    return res.status(400).json({ error: "quantity must be a positive number" });
  }
  const safePrice = price != null ? Number(price) : null;

  const order = {
    symbol: String(symbol).toUpperCase().trim(),
    side: safeSide,
    quantity: safeQty,
    price: safePrice,
    timestamp: new Date().toISOString(),
    source: "manual",
  };

  // Write to manual orders queue file
  const ordersDir = join(WORKSPACE_ROOT, "frankenstein-ai", "trading_data");
  const queueFile = join(ordersDir, "manual_orders.jsonl");
  try {
    if (!existsSync(ordersDir)) mkdirSync(ordersDir, { recursive: true });
    appendFileSync(queueFile, JSON.stringify(order) + "\n", "utf-8");
  } catch (err) {
    return res.status(500).json({ error: `Failed to queue order: ${err}` });
  }

  // Also emit as trader event for live UI
  const event = { type: "manual_order", ...order, ts: Date.now() };
  traderLiveState.events.push(event);
  traderLiveState.last_update = Date.now();
  if (traderLiveState.events.length > 200) traderLiveState.events = traderLiveState.events.slice(-200);
  io.emit("trader_event", event);

  console.log(`[trader] Manual order queued: ${safeSide} ${safeQty} ${order.symbol}${safePrice ? ` @ ${safePrice}` : " @ market"}`);
  res.json({ ok: true, order });
});

app.get("/api/trader/orders", (_req, res) => {
  const queueFile = join(WORKSPACE_ROOT, "frankenstein-ai", "trading_data", "manual_orders.jsonl");
  try {
    const lines = tailLines(queueFile, 50);
    const orders = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    res.json({ orders });
  } catch {
    res.json({ orders: [] });
  }
});

// --- OpenClaw Integration ---
const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
const openclawState = {
  installed: false,
  gatewayOnline: false,
  lastCheck: 0,
  conversations: [] as Array<{ id: string; channel: string; message: string; timestamp: string; role: string }>,
  skills: [] as Array<{ name: string; description: string; enabled: boolean }>,
  config: {
    model: process.env.OPENCLAW_MODEL || "google-generative-ai/gemini-2.0-flash",
    channels: [] as string[],
    gatewayUrl: OPENCLAW_GATEWAY,
  },
};

// Check OpenClaw gateway status
async function checkOpenClawGateway(): Promise<boolean> {
  try {
    const res = await fetch(`${OPENCLAW_GATEWAY}/api/status`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) { openclawState.gatewayOnline = true; openclawState.installed = true; return true; }
  } catch { /* gateway not running */ }
  // Fallback: check if openclaw CLI is available in kali or host
  try {
    const { execSync } = await import("child_process");
    execSync("which openclaw || openclaw --version", { timeout: 5000, stdio: "pipe" });
    openclawState.installed = true;
  } catch { /* not installed */ }
  openclawState.gatewayOnline = false;
  openclawState.lastCheck = Date.now();
  return false;
}

app.get("/api/openclaw/status", async (_req, res) => {
  await checkOpenClawGateway();
  res.json({
    installed: openclawState.installed,
    gatewayOnline: openclawState.gatewayOnline,
    gatewayUrl: OPENCLAW_GATEWAY,
    model: openclawState.config.model,
    channels: openclawState.config.channels,
    conversationCount: openclawState.conversations.length,
    skillCount: openclawState.skills.length,
    geminiEnabled: geminiAgent.isEnabled(),
    lastCheck: openclawState.lastCheck,
  });
});

// Send message to OpenClaw (via gateway or fallback to Gemini)
app.post("/api/openclaw/chat", async (req, res) => {
  const { message, channel, context } = req.body || {};
  if (!message) return res.status(400).json({ error: "message required" });

  const timestamp = new Date().toISOString();

  // Store user message
  openclawState.conversations.push({
    id: `msg-${Date.now()}`,
    channel: channel || "webchat",
    message: String(message),
    timestamp,
    role: "user",
  });
  if (openclawState.conversations.length > 200) openclawState.conversations = openclawState.conversations.slice(-200);

  // Try OpenClaw gateway first
  if (openclawState.gatewayOnline) {
    try {
      const gwRes = await fetch(`${OPENCLAW_GATEWAY}/api/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, channel: channel || "webchat" }),
        signal: AbortSignal.timeout(30000),
      });
      if (gwRes.ok) {
        const data = await gwRes.json() as Record<string, unknown>;
        const reply = String(data.response || data.content || data.message || "");
        openclawState.conversations.push({ id: `msg-${Date.now()}`, channel: channel || "webchat", message: reply, timestamp: new Date().toISOString(), role: "assistant" });
        io.emit("openclaw_message", { role: "assistant", content: reply, channel: channel || "webchat", source: "gateway" });
        return res.json({ response: reply, source: "gateway" });
      }
    } catch { /* gateway failed, fallback */ }
  }

  // Fallback: use Gemini directly with OpenClaw-style system prompt
  if (geminiAgent.isEnabled()) {
    const openclawPrompt = `Du är OpenClaw 🦞 — en autonom AI-assistent integrerad i Gracestack.
Du använder Google Gemini som din LLM-motor.
Du kan hjälpa med:
- Kodning och utveckling
- Säkerhetsanalys (via Kali Linux-verktyg)
- Forskning och informationssökning
- Automatisering och workflows
- Kommunikation med Frankenstein AI

${context ? `Kontext: ${context}\n` : ""}
Svara koncist och handlingsorienterat. Använd svenska om användaren skriver svenska.

Användaren: ${message}`;

    try {
      const reply = await geminiAgent.respond(openclawPrompt);
      openclawState.conversations.push({ id: `msg-${Date.now()}`, channel: channel || "webchat", message: reply, timestamp: new Date().toISOString(), role: "assistant" });
      io.emit("openclaw_message", { role: "assistant", content: reply, channel: channel || "webchat", source: "gemini-fallback" });
      return res.json({ response: reply, source: "gemini-fallback" });
    } catch (err) {
      return res.status(500).json({ error: `Gemini error: ${err}` });
    }
  }

  res.status(503).json({ error: "Neither OpenClaw gateway nor Gemini API available" });
});

// Get conversation history
app.get("/api/openclaw/conversations", (_req, res) => {
  const limit = Math.min(Number((_req.query as Record<string, string>).limit) || 50, 200);
  res.json({ conversations: openclawState.conversations.slice(-limit) });
});

// Skills management
app.get("/api/openclaw/skills", async (_req, res) => {
  // Try to get skills from gateway
  if (openclawState.gatewayOnline) {
    try {
      const gwRes = await fetch(`${OPENCLAW_GATEWAY}/api/skills`, { signal: AbortSignal.timeout(3000) });
      if (gwRes.ok) {
        const data = await gwRes.json() as Record<string, unknown>;
        openclawState.skills = (data.skills || []) as typeof openclawState.skills;
        return res.json({ skills: openclawState.skills, source: "gateway" });
      }
    } catch { /* fallback */ }
  }
  // Return built-in skills
  const builtinSkills = [
    { name: "gemini-chat", description: "Chatta med Gemini AI (Google)", enabled: geminiAgent.isEnabled() },
    { name: "frankenstein", description: "Frankenstein AI — kognitiv assistent", enabled: true },
    { name: "kali-tools", description: "Kali Linux säkerhetsverktyg (nmap, nikto, etc.)", enabled: true },
    { name: "code-editor", description: "Redigera och analysera kod", enabled: true },
    { name: "web-search", description: "Sök på webben", enabled: true },
    { name: "file-manager", description: "Hantera filer och mappar", enabled: true },
    { name: "rag-search", description: "Sök i kunskapsbasen (Archon)", enabled: true },
    { name: "trading", description: "Trading-bot och marknadsanalys", enabled: true },
    { name: "vision", description: "Bildanalys med Gemini Vision", enabled: true },
    { name: "memory", description: "Persistent minne och kontext", enabled: true },
  ];
  res.json({ skills: builtinSkills, source: "builtin" });
});

// OpenClaw config
app.get("/api/openclaw/config", (_req, res) => {
  res.json(openclawState.config);
});

app.post("/api/openclaw/config", (req, res) => {
  const { model, channels } = req.body || {};
  if (model) openclawState.config.model = String(model);
  if (Array.isArray(channels)) openclawState.config.channels = channels.map(String);
  res.json({ ok: true, config: openclawState.config });
});

// --- Home Assistant Integration ---
const HA_URL = process.env.HOME_ASSISTANT_URL || "http://gracestack-homeassistant:8123";
const HA_TOKEN = process.env.HOME_ASSISTANT_TOKEN || "";

async function haFetch(path: string, method = "GET", body?: unknown): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  if (!HA_TOKEN) return { ok: false, error: "HOME_ASSISTANT_TOKEN not configured" };
  try {
    const opts: RequestInit = {
      method,
      headers: { Authorization: `Bearer ${HA_TOKEN}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${HA_URL}/api${path}`, opts);
    if (!res.ok) return { ok: false, error: `HA ${res.status}: ${res.statusText}` };
    const data = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: `HA unreachable: ${err}` };
  }
}

app.get("/api/homeassistant/status", async (_req, res) => {
  // Check if HA is reachable
  const haConfigured = !!HA_TOKEN;
  let haOnline = false;
  let haVersion = "";
  let haEntities = 0;

  if (haConfigured) {
    try {
      const r = await fetch(`${HA_URL}/api/`, {
        headers: { Authorization: `Bearer ${HA_TOKEN}` },
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const d = await r.json() as Record<string, unknown>;
        haOnline = true;
        haVersion = String(d.version || "");
      }
    } catch { /* offline */ }

    if (haOnline) {
      try {
        const r = await fetch(`${HA_URL}/api/states`, {
          headers: { Authorization: `Bearer ${HA_TOKEN}` },
          signal: AbortSignal.timeout(5000),
        });
        if (r.ok) {
          const states = await r.json() as unknown[];
          haEntities = states.length;
        }
      } catch { /* ignore */ }
    }
  }

  res.json({
    configured: haConfigured,
    online: haOnline,
    url: HA_URL,
    version: haVersion,
    entities: haEntities,
    geminiEnabled: geminiAgent.isEnabled(),
    openclawAvailable: openclawState.gatewayOnline || geminiAgent.isEnabled(),
  });
});

app.get("/api/homeassistant/devices", async (_req, res) => {
  const result = await haFetch("/states");
  if (!result.ok) return res.status(503).json({ error: result.error });
  const states = result.data as Array<{ entity_id: string; state: string; attributes: Record<string, unknown>; last_changed: string }>;
  // Group by domain
  const grouped: Record<string, Array<{ entity_id: string; state: string; name: string; last_changed: string }>> = {};
  for (const s of states) {
    const domain = s.entity_id.split(".")[0];
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push({
      entity_id: s.entity_id,
      state: s.state,
      name: String(s.attributes?.friendly_name || s.entity_id),
      last_changed: s.last_changed,
    });
  }
  res.json({ devices: grouped, total: states.length });
});

app.post("/api/homeassistant/service", async (req, res) => {
  const { domain, service, entity_id, data } = req.body || {};
  if (!domain || !service) return res.status(400).json({ error: "domain and service required" });
  const payload: Record<string, unknown> = { ...data };
  if (entity_id) payload.entity_id = entity_id;
  const result = await haFetch(`/services/${domain}/${service}`, "POST", payload);
  if (!result.ok) return res.status(503).json({ error: result.error });
  io.emit("ha_event", { type: "service_call", domain, service, entity_id });
  res.json({ ok: true, result: result.data });
});

app.get("/api/homeassistant/automations", async (_req, res) => {
  const result = await haFetch("/states");
  if (!result.ok) return res.status(503).json({ error: result.error });
  const states = result.data as Array<{ entity_id: string; state: string; attributes: Record<string, unknown>; last_changed: string }>;
  const automations = states
    .filter(s => s.entity_id.startsWith("automation."))
    .map(s => ({
      entity_id: s.entity_id,
      name: String(s.attributes?.friendly_name || s.entity_id),
      state: s.state,
      last_triggered: s.attributes?.last_triggered || null,
    }));
  res.json({ automations });
});

// Voice command proxy: send text to HA conversation agent
app.post("/api/homeassistant/voice", async (req, res) => {
  const { text, language } = req.body || {};
  if (!text) return res.status(400).json({ error: "text required" });
  const result = await haFetch("/conversation/process", "POST", {
    text: String(text),
    language: language || "sv",
  });
  if (!result.ok) return res.status(503).json({ error: result.error });
  io.emit("ha_event", { type: "voice_command", text, result: result.data });
  res.json(result.data);
});

// --- Frankenstein AI Progress ---
app.get("/api/frankenstein/progress", (_req, res) => {
  try {
    const progressPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "progress.json");
    if (!existsSync(progressPath)) {
      return res.json({ running: false, error: "No progress file found" });
    }
    const data = JSON.parse(readFileSync(progressPath, "utf-8"));
    // Check if process is running (file modified in last 60s)
    const stat = statSync(progressPath);
    const ageMs = Date.now() - stat.mtimeMs;
    data.running = ageMs < 60_000;
    data.last_update_age_seconds = Math.round(ageMs / 1000);
    res.json(data);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/frankenstein/log", (_req, res) => {
  try {
    const logPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "training.log");
    if (!existsSync(logPath)) {
      return res.json({ lines: [] });
    }
    const content = readFileSync(logPath, "utf-8");
    const lines = content.trim().split("\n").slice(-100); // Last 100 lines
    res.json({ lines });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/frankenstein/ab-test", (_req, res) => {
  try {
    const abPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "ab_test_results.json");
    if (!existsSync(abPath)) {
      return res.json({ available: false });
    }
    const data = JSON.parse(readFileSync(abPath, "utf-8"));
    data.available = true;
    res.json(data);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// --- Frankenstein AI Config (module toggles) ---
const FRANK_CONFIG_PATH = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "config.json");

const DEFAULT_FRANK_CONFIG = {
  modules: {
    hdc: { enabled: true, label: "HDC Kognition", description: "Hyperdimensional Computing — mönsterigenkänning" },
    aif: { enabled: true, label: "Active Inference", description: "Strategival via Expected Free Energy" },
    ebbinghaus: { enabled: true, label: "Ebbinghaus Minne", description: "Episodiskt minne med glömskekurva" },
    gut_feeling: { enabled: true, label: "Gut Feeling", description: "Sub-symbolisk intuition före LLM-anrop" },
    emotions: { enabled: true, label: "Ekman Emotioner", description: "6 grundemotioner som påverkar beteende" },
    stm: { enabled: true, label: "Korttidsminne", description: "Senaste försöken för omedelbar kontext" },
  },
};

function readFrankConfig() {
  try {
    if (existsSync(FRANK_CONFIG_PATH)) {
      const data = JSON.parse(readFileSync(FRANK_CONFIG_PATH, "utf-8"));
      // Merge with defaults to handle new modules
      for (const [key, val] of Object.entries(DEFAULT_FRANK_CONFIG.modules)) {
        if (!data.modules?.[key]) {
          if (!data.modules) data.modules = {};
          data.modules[key] = val;
        } else {
          // Keep label/description from defaults but preserve enabled state
          data.modules[key].label = (val as any).label;
          data.modules[key].description = (val as any).description;
        }
      }
      return data;
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_FRANK_CONFIG));
}

app.get("/api/frankenstein/config", (_req, res) => {
  try {
    res.json(readFrankConfig());
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.put("/api/frankenstein/config", (req, res) => {
  try {
    const current = readFrankConfig();
    const updates = req.body;
    // Update module enabled states
    if (updates.modules) {
      for (const [key, val] of Object.entries(updates.modules)) {
        if (current.modules[key] && typeof (val as any).enabled === "boolean") {
          current.modules[key].enabled = (val as any).enabled;
        }
      }
    }
    writeFileSync(FRANK_CONFIG_PATH, JSON.stringify(current, null, 2), "utf-8");
    res.json(current);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// --- Frankenstein AI Chat API ---
app.get("/api/frankenstein/chat/status", (_req, res) => {
  res.json({
    enabled: frankAgent.isEnabled(),
    model: frankAgent.getModel(),
    tokens: frankAgent.getTokenUsage(),
    cognitive: frankAgent.getCognitiveState(),
  });
});

app.get("/api/frankenstein/chat/messages", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 100;
  res.json(frankMessages.slice(-limit));
});

app.post("/api/frankenstein/chat/clear", (_req, res) => {
  frankMessages = [];
  frankAgent.clearHistory();
  saveFrankMessages(frankMessages);
  res.json({ ok: true });
});

// Conversation sessions
app.get("/api/frankenstein/chat/sessions", (_req, res) => {
  res.json({ sessions: frankSessions, currentSessionId: currentFrankSessionId });
});

app.get("/api/frankenstein/chat/sessions/:id", (req, res) => {
  const sessionFile = join(WORKSPACE_ROOT, "bridge", "data", `frank-session-${req.params.id}.json`);
  try {
    if (existsSync(sessionFile)) {
      const msgs = JSON.parse(readFileSync(sessionFile, "utf-8"));
      res.json(msgs);
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  } catch { res.status(500).json({ error: "Failed to load session" }); }
});

app.post("/api/frankenstein/chat/sessions/new", (_req, res) => {
  // Archive current conversation
  archiveCurrentFrankSession();
  // Start fresh
  frankMessages = [];
  frankAgent.clearHistory();
  saveFrankMessages(frankMessages);
  currentFrankSessionId = uuidv4();
  res.json({ sessionId: currentFrankSessionId });
});

app.post("/api/frankenstein/chat/sessions/:id/load", (req, res) => {
  const sessionFile = join(WORKSPACE_ROOT, "bridge", "data", `frank-session-${req.params.id}.json`);
  try {
    if (!existsSync(sessionFile)) return res.status(404).json({ error: "Session not found" });
    // Archive current first
    archiveCurrentFrankSession();
    // Load the requested session
    frankMessages = JSON.parse(readFileSync(sessionFile, "utf-8"));
    saveFrankMessages(frankMessages);
    currentFrankSessionId = req.params.id;
    frankAgent.clearHistory();
    res.json({ ok: true, messageCount: frankMessages.length });
  } catch { res.status(500).json({ error: "Failed to load session" }); }
});

app.delete("/api/frankenstein/chat/sessions/:id", (req, res) => {
  const sessionFile = join(WORKSPACE_ROOT, "bridge", "data", `frank-session-${req.params.id}.json`);
  try { if (existsSync(sessionFile)) unlinkSync(sessionFile); } catch { /* ok */ }
  frankSessions = frankSessions.filter(s => s.id !== req.params.id);
  saveFrankSessions();
  res.json({ ok: true });
});

// --- Frankenstein AI Learning API ---
app.get("/api/frankenstein/learnings", (req, res) => {
  const filter = (req.query.filter as string) || "recent";
  if (filter === "today") return res.json(getTodaysLearnings());
  if (filter === "stats") return res.json(getLearningStats());
  if (filter !== "recent") return res.json(searchFrankLearnings(filter, 20));
  res.json(getRecentLearnings(20));
});

app.get("/api/frankenstein/learnings/stats", (_req, res) => {
  res.json(getLearningStats());
});

app.get("/api/frankenstein/wellbeing", (_req, res) => {
  res.json(frankAgent.getWellbeing());
});

// --- Frankenstein A/B Test (from app) ---
const abTestState: {
  active: boolean;
  test_id: string;
  events: any[];
  process?: any;
  started_at?: number;
  module_config?: Record<string, boolean>;
  num_tasks?: number;
  result?: any;
} = { active: false, test_id: "", events: [] };

app.post("/api/frankenstein/ab-test/start", (req, res) => {
  if (abTestState.active) {
    return res.status(409).json({ error: "A/B test already running", test_id: abTestState.test_id });
  }
  const { num_tasks = 30, modules = {} } = req.body || {};
  const testId = `ab-${Date.now()}`;
  abTestState.active = true;
  abTestState.test_id = testId;
  abTestState.events = [];
  abTestState.started_at = Date.now();
  abTestState.module_config = modules;
  abTestState.num_tasks = num_tasks;
  abTestState.result = null;

  const modulesJson = JSON.stringify(modules);
  const pythonArgs = [
    "-u", "ab_test.py",
    String(num_tasks),
    "--bridge-url", `http://localhost:${PORT}`,
    "--modules", modulesJson,
  ];
  const proc = spawn("python", pythonArgs, {
    cwd: join(WORKSPACE_ROOT, "frankenstein-ai"),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  abTestState.process = proc;

  proc.stdout?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.log(`[AB-Test] ${line}`);
  });
  proc.stderr?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.error(`[AB-Test ERR] ${line}`);
  });
  proc.on("close", () => {
    abTestState.active = false;
    abTestState.process = null;
  });

  res.json({ test_id: testId, status: "started", num_tasks, modules });
});

app.post("/api/frankenstein/ab-test/event", (req, res) => {
  const { event } = req.body || {};
  if (!event) return res.status(400).json({ error: "No event" });
  abTestState.events.push(event);
  if (event.type === "ab_completed" && event.output) {
    abTestState.result = event.output;
  }
  io.emit("ab_test_event", { test_id: abTestState.test_id, event });
  res.json({ ok: true });
});

app.get("/api/frankenstein/ab-test/status", (_req, res) => {
  res.json({
    active: abTestState.active,
    test_id: abTestState.test_id,
    events: abTestState.events,
    started_at: abTestState.started_at,
    event_count: abTestState.events.length,
    module_config: abTestState.module_config,
    num_tasks: abTestState.num_tasks,
    result: abTestState.result,
  });
});

app.post("/api/frankenstein/ab-test/stop", (_req, res) => {
  if (abTestState.process) {
    abTestState.process.kill();
    abTestState.process = null;
  }
  abTestState.active = false;
  io.emit("ab_test_event", { test_id: abTestState.test_id, event: { type: "ab_stopped" } });
  res.json({ ok: true });
});

// --- Frankenstein Swarm (Bio-Cognition × Collective Intelligence) ---
const fswarmState: {
  active: boolean;
  session_id: string;
  events: any[];
  process?: any;
  started_at?: number;
  num_tasks?: number;
  result?: any;
} = { active: false, session_id: "", events: [] };

app.post("/api/frankenstein/swarm/start", (req, res) => {
  if (fswarmState.active) {
    return res.status(409).json({ error: "Swarm session already running", session_id: fswarmState.session_id });
  }
  const { num_tasks = 20 } = req.body || {};
  const sessionId = `fswarm-${Date.now()}`;
  fswarmState.active = true;
  fswarmState.session_id = sessionId;
  fswarmState.events = [];
  fswarmState.started_at = Date.now();
  fswarmState.num_tasks = num_tasks;
  fswarmState.result = null;

  const pythonArgs = [
    "-u", "frankenstein_swarm.py",
    String(num_tasks),
    "--bridge-url", `http://localhost:${PORT}`,
  ];
  const proc = spawn("python", pythonArgs, {
    cwd: join(WORKSPACE_ROOT, "frankenstein-ai"),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  fswarmState.process = proc;

  proc.stdout?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.log(`[FSwarm] ${line}`);
  });
  proc.stderr?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.error(`[FSwarm ERR] ${line}`);
  });
  proc.on("close", () => {
    fswarmState.active = false;
    fswarmState.process = null;
  });

  res.json({ session_id: sessionId, status: "started", num_tasks });
});

app.post("/api/frankenstein/swarm/event", (req, res) => {
  const { event } = req.body || {};
  if (!event) return res.status(400).json({ error: "No event" });
  fswarmState.events.push(event);
  if (event.type === "swarm_session_done" && event.output) {
    fswarmState.result = event.output;
  }
  io.emit("fswarm_event", { session_id: fswarmState.session_id, event });
  res.json({ ok: true });
});

app.get("/api/frankenstein/swarm/status", (_req, res) => {
  res.json({
    active: fswarmState.active,
    session_id: fswarmState.session_id,
    events: fswarmState.events,
    started_at: fswarmState.started_at,
    event_count: fswarmState.events.length,
    num_tasks: fswarmState.num_tasks,
    result: fswarmState.result,
  });
});

app.post("/api/frankenstein/swarm/stop", (_req, res) => {
  if (fswarmState.process) {
    fswarmState.process.kill();
    fswarmState.process = null;
  }
  fswarmState.active = false;
  io.emit("fswarm_event", { session_id: fswarmState.session_id, event: { type: "swarm_stopped" } });
  res.json({ ok: true });
});

// --- Frankenstein Terminal Live ---
const terminalLiveState: {
  active: boolean;
  events: any[];
  current_task: any | null;
  last_update: number;
} = { active: false, events: [], current_task: null, last_update: 0 };

app.post("/api/frankenstein/terminal/event", (req, res) => {
  const { event } = req.body || {};
  if (!event) return res.status(400).json({ error: "No event" });
  event.timestamp = Date.now();
  terminalLiveState.events.push(event);
  terminalLiveState.last_update = Date.now();

  if (event.type === "terminal_batch_start") {
    terminalLiveState.active = true;
    terminalLiveState.current_task = null;
  } else if (event.type === "terminal_task_start") {
    terminalLiveState.current_task = { id: event.task_id, title: event.title, difficulty: event.difficulty, category: event.category, steps: [], started_at: Date.now() };
  } else if (event.type === "terminal_step") {
    if (terminalLiveState.current_task) {
      terminalLiveState.current_task.steps.push({ command: event.command, output: event.output, error: event.error, step: event.step });
    }
  } else if (event.type === "terminal_task_done") {
    terminalLiveState.current_task = null;
  } else if (event.type === "terminal_batch_done") {
    terminalLiveState.active = false;
    terminalLiveState.current_task = null;
  }

  // Keep last 200 events
  if (terminalLiveState.events.length > 200) {
    terminalLiveState.events = terminalLiveState.events.slice(-200);
  }

  io.emit("terminal_live_event", event);
  res.json({ ok: true });
});

app.get("/api/frankenstein/terminal/live", (_req, res) => {
  res.json({
    active: terminalLiveState.active,
    events: terminalLiveState.events.slice(-50),
    current_task: terminalLiveState.current_task,
    last_update: terminalLiveState.last_update,
    event_count: terminalLiveState.events.length,
  });
});

app.post("/api/frankenstein/terminal/clear", (_req, res) => {
  terminalLiveState.events = [];
  terminalLiveState.current_task = null;
  terminalLiveState.active = false;
  res.json({ ok: true });
});

// --- Frankenstein Battle Arena ---
const battleState: {
  active: boolean;
  battle_id: string;
  events: any[];
  process?: any;
  started_at?: number;
} = { active: false, battle_id: "", events: [] };

app.post("/api/frankenstein/battle/start", (req, res) => {
  if (battleState.active) {
    return res.status(409).json({ error: "Battle already running", battle_id: battleState.battle_id });
  }
  const { difficulty = 0, num_tasks = 5, category = "" } = req.body || {};
  const battleId = `battle-${Date.now()}`;
  battleState.active = true;
  battleState.battle_id = battleId;
  battleState.events = [];
  battleState.started_at = Date.now();

  // Starta battle_arena.py som subprocess
  const pythonArgs = [
    "-u", "battle_arena.py",
    `http://localhost:${PORT}`,
    String(difficulty),
    String(num_tasks),
    category,
  ];
  const proc = spawn("python", pythonArgs, {
    cwd: join(WORKSPACE_ROOT, "frankenstein-ai"),
    stdio: ["ignore", "pipe", "pipe"],
  });
  battleState.process = proc;

  proc.stdout?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.log(`[Battle] ${line}`);
  });
  proc.stderr?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.error(`[Battle ERR] ${line}`);
  });
  proc.on("close", () => {
    battleState.active = false;
    battleState.process = null;
  });

  res.json({ battle_id: battleId, status: "started", difficulty, num_tasks, category });
});

app.post("/api/frankenstein/battle/event", (req, res) => {
  const { battle_id, event } = req.body || {};
  if (!event) return res.status(400).json({ error: "No event" });
  battleState.events.push(event);
  // Broadcast via Socket.IO
  io.emit("battle_event", { battle_id, event });
  res.json({ ok: true });
});

app.get("/api/frankenstein/battle/status", (_req, res) => {
  res.json({
    active: battleState.active,
    battle_id: battleState.battle_id,
    events: battleState.events,
    started_at: battleState.started_at,
    event_count: battleState.events.length,
  });
});

app.post("/api/frankenstein/battle/stop", (_req, res) => {
  if (battleState.process) {
    battleState.process.kill();
    battleState.process = null;
  }
  battleState.active = false;
  io.emit("battle_event", { battle_id: battleState.battle_id, event: { type: "battle_stopped" } });
  res.json({ ok: true });
});

app.get("/api/rag/stats", async (_req, res) => {
  const bm25 = ragStats();
  if (isWeaviateConnected()) {
    const wStats = await weaviateStats();
    res.json({ ...wStats, bm25, backend: "weaviate" });
  } else {
    res.json({ ...bm25, backend: "bm25" });
  }
});

app.post("/api/rag/index-text", async (req, res) => {
  try {
    // Index in both BM25 and Weaviate
    const bm25Src = ragIndexText(req.body.text, req.body.name);
    let wSrc = null;
    if (isWeaviateConnected()) {
      wSrc = await weaviateIndexText(req.body.text, req.body.name);
    }
    res.json({ bm25: bm25Src, weaviate: wSrc });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/rag/index-file", async (req, res) => {
  try {
    const src = ragIndexFile(req.body.file_path);
    // Also index in Weaviate if connected
    if (isWeaviateConnected()) {
      const { readFileSync } = await import("fs");
      const { basename } = await import("path");
      const content = readFileSync(req.body.file_path, "utf-8");
      await weaviateIndexText(content, basename(req.body.file_path), "file");
    }
    res.json(src);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/rag/index-pdf", async (req, res) => {
  try {
    const src = await ragIndexPdf(req.body.file_path);
    if (isWeaviateConnected()) {
      const { readFileSync } = await import("fs");
      const { basename } = await import("path");
      try {
        const content = readFileSync(req.body.file_path, "utf-8");
        await weaviateIndexText(content, basename(req.body.file_path), "file");
      } catch { /* PDF text already indexed in BM25 */ }
    }
    res.json(src);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/rag/index-pdf-upload", async (req, res) => {
  try {
    const { data, name } = req.body;
    if (!data || !name) {
      return res.status(400).json({ error: "Missing data or name" });
    }
    // Write base64 PDF to temp file, parse, then clean up
    const { writeFileSync, unlinkSync } = await import("fs");
    const { join } = await import("path");
    const { tmpdir } = await import("os");
    const tmpPath = join(tmpdir(), `cascade-rag-${Date.now()}-${name}`);
    writeFileSync(tmpPath, Buffer.from(data, "base64"));
    try {
      const src = await ragIndexPdf(tmpPath);
      // Override the origin to show the original filename
      src.origin = name;
      res.json(src);
    } finally {
      try { unlinkSync(tmpPath); } catch { /* ignore */ }
    }
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/rag/index-url", async (req, res) => {
  try {
    const src = await ragIndexUrl(req.body.url, req.body.name);
    if (isWeaviateConnected()) {
      await weaviateIndexText(src.name, src.name, "url");
    }
    res.json(src);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/rag/search", async (req, res) => {
  try {
    const { query, mode = "hybrid", topK = 5, alpha = 0.5 } = req.body;
    let results;
    if (mode === "semantic") {
      results = await ragSearchSemantic(query, topK);
    } else if (mode === "hybrid") {
      results = await ragHybridSearch(query, topK, alpha);
    } else {
      const { ragSearch } = await import("./rag.js");
      results = ragSearch(query, topK);
    }
    res.json({ results, mode });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/rag/embed", async (_req, res) => {
  try {
    const result = await ragEmbedAllChunks();
    res.json(result);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/rag/auto-reindex/start", (req, res) => {
  const paths = req.body.paths as string[] | undefined;
  const result = ragStartAutoReindex(paths);
  res.json(result);
});

app.post("/api/rag/auto-reindex/stop", (_req, res) => {
  ragStopAutoReindex();
  res.json({ ok: true, enabled: false });
});

app.get("/api/rag/auto-reindex/status", (_req, res) => {
  res.json(ragGetAutoReindexStatus());
});

app.delete("/api/rag/sources/:id", async (req, res) => {
  const ok = ragDeleteSource(req.params.id);
  // Also try Weaviate
  if (isWeaviateConnected()) {
    await weaviateDeleteSource(req.params.id);
  }
  res.json({ ok });
});

// Weaviate-specific endpoints
app.get("/api/weaviate/status", (_req, res) => {
  res.json({ connected: isWeaviateConnected() });
});

app.post("/api/weaviate/search", async (req, res) => {
  if (!isWeaviateConnected()) {
    return res.status(503).json({ error: "Weaviate not connected" });
  }
  const results = await weaviateSearch(req.body.query, req.body.limit || 5);
  res.json(results);
});

app.post("/api/weaviate/hybrid-search", async (req, res) => {
  if (!isWeaviateConnected()) {
    return res.status(503).json({ error: "Weaviate not connected" });
  }
  const results = await weaviateHybridSearch(req.body.query, req.body.limit || 5, req.body.alpha || 0.5);
  res.json(results);
});

// --- Self-Improvement API ---

app.get("/api/self-improve/stats", (_req, res) => {
  res.json(getSelfImproveStats());
});

app.get("/api/self-improve/skills", (_req, res) => {
  res.json(listSkills());
});

app.get("/api/self-improve/skills/:id", (req, res) => {
  const s = getSkill(req.params.id);
  if (!s) return res.status(404).json({ error: "Skill not found" });
  res.json(s);
});

app.delete("/api/self-improve/skills/:id", (req, res) => {
  const ok = deleteSkill(req.params.id);
  res.json({ ok });
});

app.get("/api/self-improve/evaluations", (req, res) => {
  const limit = parseInt(req.query.limit as string || "20", 10);
  res.json(getRecentEvaluations(limit));
});

app.post("/api/self-improve/evaluations/:id/feedback", (req, res) => {
  const { feedback, rating } = req.body;
  const ev = addUserFeedback(req.params.id, feedback, rating);
  if (!ev) return res.status(404).json({ error: "Evaluation not found" });
  res.json(ev);
});

app.get("/api/self-improve/reflections", (req, res) => {
  const limit = parseInt(req.query.limit as string || "10", 10);
  res.json(getRecentReflections(limit));
});

app.get("/api/self-improve/patterns", (_req, res) => {
  res.json(getLearnedPatterns());
});

// Message-level feedback (thumbs up/down in chat → links to most recent evaluation)
app.post("/api/self-improve/message-feedback", (req, res) => {
  const { rating, feedback } = req.body;
  // Find the most recent evaluation and attach user feedback
  const recent = getRecentEvaluations(1);
  if (recent.length > 0) {
    const ev = addUserFeedback(recent[0].id, feedback || "", rating);
    if (ev) return res.json({ ok: true, evaluationId: ev.id, rating });
  }
  res.json({ ok: true, note: "No recent evaluation to link" });
});

// --- Cross-Agent Validation & Arena Research APIs ---

app.get("/api/self-improve/validations", (req, res) => {
  const limit = parseInt(req.query.limit as string || "20", 10);
  res.json(getRecentValidations(limit));
});

app.get("/api/self-improve/reputations", (_req, res) => {
  res.json(getAllReputations());
});

app.get("/api/self-improve/adversarial", (_req, res) => {
  res.json(getAdversarialStats());
});

app.get("/api/self-improve/tool-sequences", (_req, res) => {
  res.json(getToolSequenceStats());
});

app.get("/api/self-improve/connections", (_req, res) => {
  res.json(getAllConnections());
});

app.get("/api/self-improve/curiosity", (_req, res) => {
  res.json(getCuriosityScores());
});

app.get("/api/self-improve/insights", (req, res) => {
  const limit = parseInt(req.query.limit as string || "20", 10);
  res.json(getNetworkInsights(limit));
});

app.post("/api/self-improve/metakognition", (_req, res) => {
  const insights = runNetworkMetakognition();
  res.json({ generated: insights.length, insights });
});

// --- Download / Install API ---

app.get("/api/install-script", (req, res) => {
  // Determine the server URL the client used to reach us
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`;
  const serverUrl = `${proto}://${host}`;

  const script = `# Cascade Remote — Automatisk installation (Windows)
# Genererad från ${serverUrl}
$ErrorActionPreference = "Stop"
$installDir = "$env:USERPROFILE\\CascadeRemote"
$downloadUrl = "${serverUrl}/api/download"

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Cyan
Write-Host "     Cascade Remote  —  Installer       " -ForegroundColor Cyan
Write-Host "  ======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Node.js
Write-Host "[1/6] Kontrollerar Node.js..." -ForegroundColor Yellow
try {
    $nv = & node --version 2>$null
    if ($nv) { Write-Host "       Node.js $nv hittad" -ForegroundColor Green }
    else { throw "x" }
} catch {
    Write-Host "       Node.js saknas — installerar via winget..." -ForegroundColor Red
    try {
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "       Node.js installerad!" -ForegroundColor Green
    } catch {
        Write-Host "  Kunde inte installera Node.js. Ladda ner: https://nodejs.org" -ForegroundColor Red; exit 1
    }
}

# 2. Ladda ner
Write-Host "[2/6] Laddar ner fran ${serverUrl}..." -ForegroundColor Yellow
$zip = "$env:TEMP\\cascade-remote.zip"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $downloadUrl -OutFile $zip -UseBasicParsing
$mb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "       Nedladdat ($mb MB)" -ForegroundColor Green

# 3. Packa upp
Write-Host "[3/6] Packar upp till $installDir..." -ForegroundColor Yellow
if (Test-Path $installDir) {
    $bk = "\${installDir}_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Rename-Item $installDir $bk
    Write-Host "       Backup: $bk" -ForegroundColor DarkGray
}
Expand-Archive -Path $zip -DestinationPath $installDir -Force
Remove-Item $zip -Force
Write-Host "       Klart!" -ForegroundColor Green

# 4. Beroenden
Write-Host "[4/6] Installerar beroenden..." -ForegroundColor Yellow
Push-Location "$installDir\\bridge"; npm install --loglevel=error 2>&1 | Out-Null; Pop-Location
Write-Host "       Bridge klart" -ForegroundColor Green
Push-Location "$installDir\\web"; npm install --loglevel=error 2>&1 | Out-Null
npm run build 2>&1 | Out-Null; Pop-Location
Write-Host "       Webb klart" -ForegroundColor Green

# 5. .env
Write-Host "[5/6] Konfigurerar..." -ForegroundColor Yellow
$envFile = "$installDir\\bridge\\.env"
if (-not (Test-Path $envFile)) {
    $ex = "$installDir\\bridge\\.env.example"
    if (Test-Path $ex) { Copy-Item $ex $envFile } else {
        "ANTHROPIC_API_KEY=\`nLLM_MODEL=claude-sonnet-4-20250514\`nGEMINI_API_KEY=\`nGEMINI_MODEL=gemini-2.0-flash\`nPORT=3031" | Set-Content $envFile
    }
    Write-Host "  Ange API-nycklar nu? (y/n)" -ForegroundColor Cyan
    if ((Read-Host "  ") -match "^[yY]") {
        $ak = Read-Host "  Anthropic API-nyckel (Enter = hoppa over)"
        $gk = Read-Host "  Gemini API-nyckel (Enter = hoppa over)"
        $c = Get-Content $envFile -Raw
        if ($ak) { $c = $c -replace "ANTHROPIC_API_KEY=","ANTHROPIC_API_KEY=$ak" }
        if ($gk) { $c = $c -replace "GEMINI_API_KEY=","GEMINI_API_KEY=$gk" }
        Set-Content $envFile $c
        Write-Host "       Sparat!" -ForegroundColor Green
    }
}

# 6. Genvag + start
Write-Host "[6/6] Skapar genvag..." -ForegroundColor Yellow
$bat = "$installDir\\start-cascade.bat"
"@echo off\`ntitle Cascade Remote\`ncd /d $installDir\\bridge\`necho Startar Cascade Remote...\`necho Oppna http://localhost:3031\`nnpx tsx src/index.ts\`npause" | Set-Content $bat
try {
    $sh = New-Object -ComObject WScript.Shell
    $sc = $sh.CreateShortcut("$([Environment]::GetFolderPath('Desktop'))\\Cascade Remote.lnk")
    $sc.TargetPath = $bat; $sc.WorkingDirectory = "$installDir\\bridge"
    $sc.Description = "Starta Cascade Remote"; $sc.Save()
    Write-Host "       Genvag pa skrivbordet!" -ForegroundColor Green
} catch { Write-Host "       Kunde inte skapa genvag" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "  ======================================" -ForegroundColor Green
Write-Host "     Installation klar!                 " -ForegroundColor Green
Write-Host "  ======================================" -ForegroundColor Green
Write-Host "  Installerad i: $installDir" -ForegroundColor White
Write-Host "  Starta: Dubbelklicka 'Cascade Remote' pa skrivbordet" -ForegroundColor White
Write-Host ""
Write-Host "  Starta nu? (y/n)" -ForegroundColor Cyan
if ((Read-Host "  ") -match "^[yY]") {
    Write-Host "  Startar... Oppna http://localhost:3031" -ForegroundColor Green
    Push-Location "$installDir\\bridge"; npx tsx src/index.ts; Pop-Location
}
`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", "inline");
  res.send(script);
});

app.get("/api/download", (_req, res) => {
  const projectRoot = join(WORKSPACE_ROOT);
  const archive = archiver("zip", { zlib: { level: 6 } });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=cascade-remote.zip");

  archive.on("error", (err) => {
    console.error("[download] Archive error:", err);
    res.status(500).end();
  });

  archive.pipe(res);

  // Include source files but exclude heavy/sensitive dirs
  const excludeDirs = ["node_modules", ".git", "dist", ".env"];
  const entries = readdirSync(projectRoot);
  for (const entry of entries) {
    if (excludeDirs.includes(entry)) continue;
    const fullPath = join(projectRoot, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        // For bridge dir, exclude node_modules inside it too
        if (entry === "bridge") {
          archive.directory(fullPath, entry, (data: archiver.EntryData) => {
            if (data.name?.includes("node_modules")) return false;
            if (data.name?.endsWith(".env")) return false;
            return data;
          });
        } else if (entry === "web") {
          archive.directory(fullPath, entry, (data: archiver.EntryData) => {
            if (data.name?.includes("node_modules")) return false;
            return data;
          });
        } else {
          archive.directory(fullPath, entry);
        }
      } else {
        archive.file(fullPath, { name: entry });
      }
    } catch {}
  }

  // Include .env template (not the real one with secrets)
  archive.append(
    `# Cascade Remote - Konfiguration\n# Fyll i dina API-nycklar nedan\n\n` +
    `ANTHROPIC_API_KEY=\nLLM_MODEL=claude-sonnet-4-20250514\n\n` +
    `GEMINI_API_KEY=\nGEMINI_MODEL=gemini-2.0-flash\n\n` +
    `DEEPSEEK_API_KEY=\n\n` +
    `PORT=3031\n`,
    { name: "bridge/.env.example" }
  );

  archive.finalize();
});

// --- Bot Network API ---

loadOrInitNetwork();

app.get("/api/network", (_req, res) => {
  res.json(getNetworkState());
});

app.post("/api/network/init", (req, res) => {
  const count = req.body?.botCount || 7;
  res.json(initNetwork(count));
});

app.post("/api/network/step", async (req, res) => {
  const ticks = req.body?.ticks || 1;
  res.json(await stepNetwork(ticks));
});

app.post("/api/network/start", (req, res) => {
  const speed = req.body?.speed || 1;
  res.json(startNetwork(speed));
});

app.post("/api/network/stop", (_req, res) => {
  res.json(stopNetwork());
});

app.post("/api/network/reset", (_req, res) => {
  res.json(resetNetwork());
});

app.post("/api/network/topic", (req, res) => {
  const topic = req.body?.topic;
  if (!topic) return res.status(400).json({ error: "topic required" });
  res.json(setNetworkTopic(topic));
});

// --- Dashboard API ---

app.get("/api/dashboard", (_req, res) => {
  res.json(getDashboard());
});

app.get("/api/dashboard/trends/daily", (req, res) => {
  const days = parseInt(req.query.days as string || "30", 10);
  res.json(getDailyTrends(days));
});

app.get("/api/dashboard/trends/weekly", (req, res) => {
  const weeks = parseInt(req.query.weeks as string || "12", 10);
  res.json(getWeeklyTrends(weeks));
});

app.get("/api/dashboard/budget", (_req, res) => {
  res.json(getBudget());
});

app.put("/api/dashboard/budget", (req, res) => {
  const updated = setBudget(req.body);
  res.json(updated);
});

app.get("/api/dashboard/budget/alerts", (_req, res) => {
  res.json(checkBudgetAlerts());
});

app.get("/api/dashboard/models", (_req, res) => {
  res.json(getModelComparison());
});

app.get("/api/dashboard/export/csv", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=cascade-metrics.csv");
  res.send(exportMetricsCsv());
});

app.get("/api/dashboard/export/snapshots", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=cascade-snapshots.csv");
  res.send(exportSnapshotsCsv());
});

// --- Frankenstein AI Research Stats ---
app.get("/api/dashboard/frankenstein", (_req, res) => {
  try {
    const frankDir = join(WORKSPACE_ROOT, "frankenstein-ai");
    const mathDir = join(frankDir, "training_data", "math_research");
    const collatzDir = join(frankDir, "training_data", "collatz_journal");

    // Read math research journal entries
    let mathFindings = 0, mathHypotheses = 0, mathExperiments = 0;
    const problemStats: Record<string, { findings: number; hypotheses: number }> = {};
    const recentFindings: Array<{ problem: string; category: string; description: string; timestamp: number }> = [];

    if (existsSync(mathDir)) {
      const files = readdirSync(mathDir).filter(f => f.endsWith(".jsonl"));
      for (const file of files) {
        try {
          const lines = readFileSync(join(mathDir, file), "utf-8").split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              if (entry.type === "finding") {
                mathFindings++;
                const p = entry.problem || "unknown";
                if (!problemStats[p]) problemStats[p] = { findings: 0, hypotheses: 0 };
                problemStats[p].findings++;
                if (recentFindings.length < 10) {
                  recentFindings.push({
                    problem: p,
                    category: entry.category || "",
                    description: (entry.description || "").slice(0, 120),
                    timestamp: entry.timestamp || 0,
                  });
                }
              } else if (entry.type === "hypothesis") {
                mathHypotheses++;
                const p = entry.problem || "unknown";
                if (!problemStats[p]) problemStats[p] = { findings: 0, hypotheses: 0 };
                problemStats[p].hypotheses++;
              } else if (entry.type === "experiment") {
                mathExperiments++;
              }
            } catch { /* skip bad line */ }
          }
        } catch { /* skip bad file */ }
      }
    }

    // Read collatz journal
    let collatzAnomalies = 0, collatzDiscoveries = 0, collatzSequences = 0;
    if (existsSync(collatzDir)) {
      const files = readdirSync(collatzDir).filter(f => f.endsWith(".jsonl"));
      for (const file of files) {
        try {
          const lines = readFileSync(join(collatzDir, file), "utf-8").split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              if (entry.type === "anomaly") collatzAnomalies++;
              else if (entry.type === "discovery") collatzDiscoveries++;
              else if (entry.type === "batch") collatzSequences += entry.count || 0;
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }
    }

    // Check which modules exist
    const modules = {
      math_research: existsSync(join(frankDir, "math_research.py")),
      collatz_explorer: existsSync(join(frankDir, "collatz_explorer.py")),
      circadian: existsSync(join(frankDir, "circadian.py")),
      cognition: existsSync(join(frankDir, "cognition.py")),
      agency: existsSync(join(frankDir, "agency.py")),
      memory: existsSync(join(frankDir, "memory.py")),
      gut_feeling: existsSync(join(frankDir, "gut_feeling.py")),
    };

    // Count test results
    let testFiles = 0, totalTests = 0;
    if (existsSync(frankDir)) {
      const pyFiles = readdirSync(frankDir).filter(f => f.endsWith("_test.py"));
      testFiles = pyFiles.length;
      for (const f of pyFiles) {
        try {
          const content = readFileSync(join(frankDir, f), "utf-8");
          totalTests += (content.match(/def test_/g) || []).length;
        } catch { /* skip */ }
      }
    }

    // Math research problems
    const problems = [
      { id: "goldbach", name: "Goldbachs förmodan", emoji: "🔢", description: "Varje jämnt tal > 2 är summan av två primtal" },
      { id: "twin_prime", name: "Tvillingprimtal", emoji: "👯", description: "Oändligt många primtal med avstånd 2" },
      { id: "perfect_number", name: "Perfekta tal", emoji: "💎", description: "Finns det udda perfekta tal?" },
      { id: "lonely_runner", name: "Lonely Runner", emoji: "🏃", description: "Varje löpare blir ensam på banan" },
      { id: "syracuse", name: "Syracuse/Collatz", emoji: "🌀", description: "Generaliserade Collatz-varianter" },
    ];

    res.json({
      mathResearch: {
        findings: mathFindings,
        hypotheses: mathHypotheses,
        experiments: mathExperiments,
        problemStats,
        recentFindings: recentFindings.slice(-5),
      },
      collatz: {
        anomalies: collatzAnomalies,
        discoveries: collatzDiscoveries,
        sequences: collatzSequences,
      },
      modules,
      problems,
      testing: { testFiles, totalTests },
    });
  } catch (err) {
    res.json({
      mathResearch: { findings: 0, hypotheses: 0, experiments: 0, problemStats: {}, recentFindings: [] },
      collatz: { anomalies: 0, discoveries: 0, sequences: 0 },
      modules: {},
      problems: [],
      testing: { testFiles: 0, totalTests: 0 },
    });
  }
});

// --- Workflows API ---

app.get("/api/workflows", (_req, res) => {
  res.json(listWorkflows());
});

app.post("/api/workflows", (req, res) => {
  const { name, description, steps, tags } = req.body;
  if (!name || !steps?.length) return res.status(400).json({ error: "name and steps required" });
  const workflow = createWorkflow(name, description || "", steps, tags);
  res.json(workflow);
});

app.get("/api/workflows/:id", (req, res) => {
  const w = getWorkflow(req.params.id);
  if (!w) return res.status(404).json({ error: "Workflow not found" });
  res.json(w);
});

app.put("/api/workflows/:id", (req, res) => {
  const w = updateWorkflow(req.params.id, req.body);
  if (!w) return res.status(404).json({ error: "Workflow not found" });
  res.json(w);
});

app.delete("/api/workflows/:id", (req, res) => {
  const ok = deleteWorkflow(req.params.id);
  res.json({ ok });
});

app.post("/api/workflows/:id/run", async (req, res) => {
  try {
    const run = await runWorkflow(req.params.id);
    incrementActivity("workflowsRun");
    io.emit("workflow_run", run);
    res.json(run);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.get("/api/workflow-runs", (req, res) => {
  const workflowId = req.query.workflowId as string | undefined;
  const limit = parseInt(req.query.limit as string || "20", 10);
  res.json(getWorkflowRuns(workflowId, limit));
});

// --- Agent Chains API ---

app.get("/api/chains", (_req, res) => {
  res.json(listChains());
});

app.post("/api/chains", (req, res) => {
  const { name, description, nodes, connections, tags } = req.body;
  if (!name || !nodes?.length) return res.status(400).json({ error: "name and nodes required" });
  const chain = createChain(name, description || "", nodes, connections || [], tags);
  res.json(chain);
});

app.get("/api/chains/templates", (_req, res) => {
  res.json(getChainTemplates());
});

app.get("/api/chains/:id", (req, res) => {
  const c = getChain(req.params.id);
  if (!c) return res.status(404).json({ error: "Chain not found" });
  res.json(c);
});

app.put("/api/chains/:id", (req, res) => {
  const c = updateChain(req.params.id, req.body);
  if (!c) return res.status(404).json({ error: "Chain not found" });
  res.json(c);
});

app.delete("/api/chains/:id", (req, res) => {
  const ok = deleteChain(req.params.id);
  res.json({ ok });
});

app.post("/api/chains/:id/run", async (req, res) => {
  try {
    const run = await runChain(req.params.id);
    incrementActivity("chainsRun");
    res.json(run);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.post("/api/chain-runs/:id/cancel", (req, res) => {
  const ok = cancelChainRun(req.params.id);
  res.json({ ok });
});

app.get("/api/chain-runs", (req, res) => {
  const chainId = req.query.chainId as string | undefined;
  const limit = parseInt(req.query.limit as string || "20", 10);
  res.json(getChainRuns(chainId, limit));
});

app.get("/api/chain-runs/:id", (req, res) => {
  const run = getChainRun(req.params.id);
  if (!run) return res.status(404).json({ error: "Run not found" });
  res.json(run);
});

// --- Ollama API ---

app.get("/api/ollama/status", (_req, res) => {
  res.json({
    enabled: ollamaAgent.isEnabled(),
    model: ollamaAgent.getModel(),
    models: ollamaAgent.getAvailableModels(),
    tokens: ollamaAgent.getTokenUsage(),
  });
});

app.get("/api/ollama/models", async (_req, res) => {
  const models = await ollamaAgent.refreshModels();
  res.json(models);
});

app.post("/api/ollama/model", (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: "model required" });
  ollamaAgent.setModel(model);
  // Update orchestrator worker
  orchestrator.setWorkerEnabled("ollama", ollamaAgent.isEnabled());
  res.json({ ok: true, model });
});

app.post("/api/ollama/pull", async (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: "model required" });
  const result = await ollamaAgent.pullModel(model);
  res.json({ result });
});

app.delete("/api/ollama/history", (_req, res) => {
  ollamaAgent.clearHistory();
  res.json({ ok: true });
});

// --- Projects API ---

app.get("/api/projects", (_req, res) => {
  res.json(listProjects());
});

app.get("/api/projects/active", (_req, res) => {
  const active = getActiveProject();
  res.json(active || { active: false });
});

app.post("/api/projects", (req, res) => {
  const { name, description, path, tags, settings } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const project = createProject(name, description || "", { path, tags, settings });
  io.emit("project_update", project);
  res.json(project);
});

app.get("/api/projects/:id", (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
});

app.put("/api/projects/:id", (req, res) => {
  const project = updateProject(req.params.id, req.body);
  if (!project) return res.status(404).json({ error: "Project not found" });
  io.emit("project_update", project);
  res.json(project);
});

app.delete("/api/projects/:id", (req, res) => {
  const ok = deleteProject(req.params.id);
  if (ok) io.emit("project_removed", req.params.id);
  res.json({ ok });
});

app.post("/api/projects/:id/activate", (req, res) => {
  const project = activateProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  io.emit("project_activated", project);
  res.json(project);
});

app.post("/api/projects/deactivate", (_req, res) => {
  deactivateProject();
  io.emit("project_deactivated", {});
  res.json({ ok: true });
});

// --- Clipboard API ---

app.get("/api/clipboard", (_req, res) => {
  res.json(getClipboardHistory());
});

app.get("/api/clipboard/latest", (_req, res) => {
  const entry = getLatestClipboard();
  res.json(entry || { empty: true });
});

app.post("/api/clipboard", (req, res) => {
  const { content, type, source, setDesktop } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });
  const entry = addToClipboard(content, type || "text", source || "mobile");

  if (setDesktop !== false) {
    setDesktopClipboard(content);
  }

  io.emit("clipboard_update", entry);
  res.json(entry);
});

app.get("/api/clipboard/desktop", (_req, res) => {
  const content = getDesktopClipboard();
  res.json({ content });
});

app.post("/api/clipboard/from-desktop", (_req, res) => {
  const content = getDesktopClipboard();
  if (!content) return res.json({ empty: true });
  const entry = addToClipboard(content, "text", "desktop");
  io.emit("clipboard_update", entry);
  res.json(entry);
});

app.delete("/api/clipboard", (_req, res) => {
  clearClipboardHistory();
  res.json({ ok: true });
});

// --- Plugin API ---

app.get("/api/plugins", (_req, res) => {
  res.json(listPlugins());
});

app.get("/api/plugins/:id", (req, res) => {
  const plugin = getPlugin(req.params.id);
  if (!plugin) return res.status(404).json({ error: "Plugin not found" });
  res.json(plugin);
});

app.post("/api/plugins/:id/toggle", (req, res) => {
  const { enabled } = req.body;
  const ok = setPluginEnabled(req.params.id, !!enabled);
  if (!ok) return res.status(404).json({ error: "Plugin not found" });
  res.json({ ok });
});

app.get("/api/plugins/tools", (_req, res) => {
  const tools: Record<string, string>[] = [];
  for (const [id, tool] of getPluginTools()) {
    tools.push({ id, name: tool.name, description: tool.description });
  }
  res.json(tools);
});

// --- Plugin Marketplace API ---

app.get("/api/marketplace", (req, res) => {
  const { category, search, sort } = req.query;
  res.json(browseMarketplace({
    category: category as any,
    search: search as string,
    sort: (sort as any) || "popular",
  }));
});

app.get("/api/marketplace/categories", (_req, res) => {
  res.json(getMarketplaceCategories());
});

app.get("/api/marketplace/stats", (_req, res) => {
  res.json(getMarketplaceStats());
});

app.get("/api/marketplace/installed", (_req, res) => {
  res.json(getInstalledMarketplacePlugins());
});

app.post("/api/marketplace/install/:id", async (req, res) => {
  const result = await installPlugin(req.params.id);
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
});

app.post("/api/marketplace/install-url", async (req, res) => {
  const { url, id } = req.body;
  if (!url) return res.status(400).json({ ok: false, error: "URL krävs" });
  const result = await installFromUrl(url, id);
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
});

app.post("/api/marketplace/uninstall/:id", (req, res) => {
  const result = uninstallPlugin(req.params.id);
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
});

app.post("/api/marketplace/rate/:id", (req, res) => {
  const { rating } = req.body;
  const result = ratePlugin(req.params.id, rating);
  if (!result.ok) return res.status(400).json(result);
  res.json(result);
});

// --- Search API ---

app.get("/api/search", (req, res) => {
  const { q, source, role, dateFrom, dateTo, limit } = req.query;
  if (!q) return res.status(400).json({ error: "q (query) required" });
  res.json(searchConversations({
    query: q as string,
    source: (source as any) || "all",
    role: (role as any) || "all",
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    limit: limit ? parseInt(limit as string, 10) : 20,
  }));
});

app.get("/api/search/stats", (_req, res) => {
  res.json(getConversationStats());
});

app.get("/api/search/export", (req, res) => {
  const { source, format } = req.query;
  const content = exportConversation(
    (source as any) || "all",
    (format as any) || "markdown",
  );
  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
  } else {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  }
  res.setHeader("Content-Disposition", `attachment; filename="cascade-export-${source || "all"}.${format === "json" ? "json" : "md"}"`);
  res.send(content);
});

// --- Computer Registry API ---

app.get("/api/computers", (_req, res) => {
  res.json(listComputers());
});

app.get("/api/computers/online", (_req, res) => {
  res.json(getOnlineComputers());
});

app.post("/api/computers", (req, res) => {
  const { name, description, capabilities, tags } = req.body;
  if (!name || !capabilities) return res.status(400).json({ error: "name and capabilities required" });
  const comp = registerComputer(name, description || "", capabilities, tags || []);
  io.emit("computer_update", comp);
  res.json(comp);
});

app.get("/api/computers/:id", (req, res) => {
  const comp = getComputer(req.params.id);
  if (!comp) return res.status(404).json({ error: "Computer not found" });
  res.json(comp);
});

app.delete("/api/computers/:id", (req, res) => {
  const ok = unregisterComputer(req.params.id);
  if (ok) io.emit("computer_removed", req.params.id);
  res.json({ ok });
});

app.post("/api/computers/:id/execute", async (req, res) => {
  const comp = getComputer(req.params.id);
  if (!comp) return res.status(404).json({ error: "Computer not found" });
  if (comp.status !== "online") return res.status(409).json({ error: "Computer is offline" });

  const { type, payload, timeout } = req.body;
  const task = createTask(comp.id, type || "command", payload || {}, timeout || 30000);

  // Send task to the computer's socket
  if (comp.socketId) {
    io.to(comp.socketId).emit("computer_task", task);
  }

  try {
    const result = await submitTask(task);
    res.json({ ok: true, result, task });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err), task });
  }
});

app.post("/api/computers/route", async (req, res) => {
  const { type, payload, tags, timeout } = req.body;
  const comp = selectBestComputer(type || "command", tags);
  if (!comp) return res.status(404).json({ error: "No suitable computer online" });

  // OS-aware command translation for common commands
  const finalPayload = { ...payload };
  if (type === "command" && finalPayload.command) {
    const cmd = (finalPayload.command as string).trim();
    const isWindows = comp.capabilities.os === "windows";
    const translations: Record<string, { win: string; unix: string }> = {
      "ls": { win: "dir", unix: "ls" },
      "dir": { win: "dir", unix: "ls" },
      "lista": { win: "dir", unix: "ls" },
      "cat": { win: "type", unix: "cat" },
      "pwd": { win: "cd", unix: "pwd" },
      "cls": { win: "cls", unix: "clear" },
      "clear": { win: "cls", unix: "clear" },
      "rm": { win: "del", unix: "rm" },
      "cp": { win: "copy", unix: "cp" },
      "mv": { win: "move", unix: "mv" },
      "mkdir": { win: "mkdir", unix: "mkdir" },
      "whoami": { win: "whoami", unix: "whoami" },
    };
    const parts = cmd.split(/\s+/);
    const baseCmd = parts[0].toLowerCase();
    if (translations[baseCmd]) {
      parts[0] = isWindows ? translations[baseCmd].win : translations[baseCmd].unix;
      finalPayload.command = parts.join(" ");
    }
  }

  const task = createTask(comp.id, type || "command", finalPayload, timeout || 30000);
  if (comp.socketId) {
    io.to(comp.socketId).emit("computer_task", task);
  }

  try {
    const result = await submitTask(task);
    res.json({ ok: true, computerId: comp.id, computerName: comp.name, computerOs: comp.capabilities.os, result, task });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err), task });
  }
});

app.get("/api/computers/:id/tasks", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json(getTaskHistory(req.params.id, limit));
});

// --- Scheduler API ---

app.get("/api/schedules", (_req, res) => {
  res.json(listSchedules());
});

app.post("/api/schedules", (req, res) => {
  const { name, description, action, cron, intervalMs, runAt, tags } = req.body;
  if (!name || !action) return res.status(400).json({ error: "name and action required" });
  const entry = createSchedule(name, description || "", action, { cron, intervalMs, runAt, tags });
  io.emit("schedule_update", entry);
  res.json(entry);
});

app.get("/api/schedules/:id", (req, res) => {
  const entry = getSchedule(req.params.id);
  if (!entry) return res.status(404).json({ error: "Schedule not found" });
  res.json(entry);
});

app.put("/api/schedules/:id", (req, res) => {
  const entry = updateSchedule(req.params.id, req.body);
  if (!entry) return res.status(404).json({ error: "Schedule not found" });
  io.emit("schedule_update", entry);
  res.json(entry);
});

app.delete("/api/schedules/:id", (req, res) => {
  const ok = deleteSchedule(req.params.id);
  if (ok) io.emit("schedule_removed", req.params.id);
  res.json({ ok });
});

app.post("/api/schedules/:id/run", (req, res) => {
  const ok = runScheduleNow(req.params.id);
  if (!ok) return res.status(404).json({ error: "Schedule not found" });
  res.json({ ok });
});

app.get("/api/schedules/:id/results", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json(getScheduleResults(req.params.id, limit));
});

app.get("/api/schedule-results", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json(getScheduleResults(undefined, limit));
});

// --- File Sharing API ---

app.get("/api/files", (req, res) => {
  const { uploadedBy, mimeType, limit } = req.query;
  res.json(listFiles({
    uploadedBy: uploadedBy as any,
    mimeType: mimeType as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
  }));
});

app.get("/api/files/stats", (_req, res) => {
  res.json(getStorageStats());
});

app.post("/api/files/upload", (req, res) => {
  try {
    const { data, filename, uploadedBy, description, tags } = req.body;
    if (!data || !filename) return res.status(400).json({ error: "data (base64) and filename required" });
    const file = saveFileFromBase64(data, filename, uploadedBy || "mobile", description, tags || []);
    io.emit("file_shared", file);
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/files/:id", (req, res) => {
  const meta = getFileMeta(req.params.id);
  if (!meta) return res.status(404).json({ error: "File not found" });
  res.json(meta);
});

app.get("/api/files/:id/download", (req, res) => {
  const meta = getFileMeta(req.params.id);
  if (!meta) return res.status(404).json({ error: "File not found" });
  const buffer = getFileBuffer(req.params.id);
  if (!buffer) return res.status(404).json({ error: "File data not found" });
  res.setHeader("Content-Type", meta.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${meta.originalName}"`);
  res.send(buffer);
});

app.get("/api/files/:id/base64", (req, res) => {
  const meta = getFileMeta(req.params.id);
  if (!meta) return res.status(404).json({ error: "File not found" });
  const data = getFileBase64(req.params.id);
  if (!data) return res.status(404).json({ error: "File not found" });
  res.json({ ...meta, data });
});

// Index an uploaded shared file into RAG (BM25 + optional Weaviate).
// This avoids users having to provide a raw server file path.
app.post("/api/files/:id/index-rag", async (req, res) => {
  const id = req.params.id;
  const meta = getFileMeta(id);
  if (!meta) return res.status(404).json({ error: "File not found" });

  const filePath = getFilePath(id);
  if (!filePath) return res.status(404).json({ error: "File not found" });

  try {
    const origin = `shared-file:${id}`;
    let bm25Src: any;
    let wSrc: any = null;

    // PDFs
    if (meta.mimeType === "application/pdf" || meta.originalName.toLowerCase().endsWith(".pdf")) {
      const { readFileSync } = await import("fs");
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(readFileSync(filePath));
      const text = String(data?.text || "").trim();
      if (!text) return res.status(422).json({ error: "PDF contains no extractable text" });

      bm25Src = ragIndexText(text, meta.originalName, "pdf", origin);
      if (isWeaviateConnected()) {
        wSrc = await weaviateIndexText(text, meta.originalName, "file");
      }

      return res.json({ bm25: bm25Src, weaviate: wSrc });
    }

    // Text/code/markdown
    if (meta.mimeType.startsWith("text/") || /\.(md|txt|csv|json|xml|py|ts|tsx|js|jsx|html|css|yml|yaml|toml|ini|cfg|sh|ps1|sql|log)$/i.test(meta.originalName)) {
      const { readFileSync } = await import("fs");
      const text = readFileSync(filePath, "utf-8");

      bm25Src = ragIndexText(text, meta.originalName, "file", origin);
      if (isWeaviateConnected()) {
        wSrc = await weaviateIndexText(text, meta.originalName, "file");
      }

      return res.json({ bm25: bm25Src, weaviate: wSrc });
    }

    return res.status(415).json({
      error: `Unsupported file type for RAG indexing: ${meta.mimeType}`,
      supported: ["text/*", "application/pdf"],
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete("/api/files/:id", (req, res) => {
  const ok = deleteFile(req.params.id);
  if (ok) io.emit("file_removed", req.params.id);
  res.json({ ok });
});

// --- Socket.IO (used by web/mobile clients) ---

io.on("connection", (socket) => {
  connectedClients++;
  console.log(`[bridge] Client connected (${connectedClients} total)`);

  // Send recent messages on connect
  const recent = messages.slice(-50);
  socket.emit("history", recent);
  socket.emit("gemini_history", geminiMessages.slice(-50));
  socket.emit("gemini_enabled", geminiAgent.isEnabled());
  socket.emit("arena_history", arenaMessages.slice(-100));
  socket.emit("arena_running", arenaRunning);
  socket.emit("computers", listComputers());
  socket.emit("schedules", listSchedules());

  // Market data: clients subscribe to ticker stream for red/green candles.
  socket.on("market_subscribe", (data: { exchange?: string; symbols?: any; intervalMs?: any }) => {
    try {
      const ex = String(data?.exchange || "").trim().toLowerCase();
      const exchange: MarketExchange = ex === "binance" ? "binance" : "kraken";
      const rawSymbols = Array.isArray(data?.symbols) ? data.symbols : [];
      const symbols = rawSymbols.map((s: any) => normalizeSymbol(String(s))).filter(Boolean).slice(0, 20);
      const intervalMs = Number(data?.intervalMs);
      const safeIntervalMs = Number.isFinite(intervalMs) ? Math.max(500, Math.min(60_000, intervalMs)) : 1000;

      marketSubs.set(socket.id, { exchange, symbols, intervalMs: safeIntervalMs });
      ensureMarketTimer();
      socket.emit("market_subscribed", { ok: true, exchange, symbols, intervalMs: safeIntervalMs });
    } catch (err) {
      socket.emit("market_subscribed", { ok: false, error: String(err) });
    }
  });

  socket.on("market_unsubscribe", () => {
    marketSubs.delete(socket.id);
    ensureMarketTimer();
  });

  // Client sends a chat message
  socket.on("message", (data: { content: string }) => {
    const msg: Message = {
      id: uuidv4(),
      role: "user",
      content: data.content,
      type: "message",
      timestamp: new Date().toISOString(),
    };
    messages.push(msg);
    io.emit("message", msg);
    writeInbox(messages);
    saveMessages(messages);

    // Auto-respond via AI agent
    if (agent.isEnabled()) {
      agent.respond(data.content).then((reply) => {
        const aiMsg: Message = {
          id: uuidv4(),
          role: "cascade",
          content: reply,
          type: "message",
          timestamp: new Date().toISOString(),
        };
        messages.push(aiMsg);
        io.emit("message", aiMsg);
        saveMessages(messages);
        console.log(`[agent] Replied: "${reply.slice(0, 80)}..."`);

        // Cross-Agent Validation: Gemini validates Claude's response (background)
        // + Neural Plasticity: update connection weights based on validation
        if (geminiAgent.isEnabled() && reply.length > 50) {
          const cvPrompt = buildCrossValidationPrompt("Claude", data.content, reply);
          geminiAgent.respond(cvPrompt).then(cvReply => {
            try {
              const cvData = JSON.parse(cvReply.replace(/```json?\n?|```/g, "").trim());
              const score = cvData.score || 3;
              const approved = cvData.approved !== false;
              addCrossValidation("Claude", "Gemini", data.content, reply,
                score, cvData.issues || [], cvData.suggestions || [], approved);
              updateConnectionWeight("Gemini", "Claude", score, approved);
              io.emit("cross_validation", { originalAgent: "Claude", validator: "Gemini", score, approved });
            } catch { /* validation parsing optional */ }
          }).catch(() => { /* cross-validation is best-effort */ });
        }
      }).catch((err) => {
        console.error("[agent] Failed to respond:", err);
      });
    }
  });

  // Client sends a Gemini chat message
  socket.on("gemini_message", (data: { content: string }) => {
    const msg: Message = {
      id: uuidv4(),
      role: "user",
      content: data.content,
      type: "message",
      timestamp: new Date().toISOString(),
    };
    geminiMessages.push(msg);
    io.emit("gemini_message", msg);
    saveGeminiMessages(geminiMessages);

    if (geminiAgent.isEnabled()) {
      geminiAgent.respond(data.content).then((reply) => {
        const aiMsg: Message = {
          id: uuidv4(),
          role: "cascade",
          content: reply,
          type: "message",
          timestamp: new Date().toISOString(),
        };
        geminiMessages.push(aiMsg);
        io.emit("gemini_message", aiMsg);
        saveGeminiMessages(geminiMessages);
        io.emit("gemini_tokens", geminiAgent.getTokenUsage());
        console.log(`[gemini] Replied: "${reply.slice(0, 80)}..."`);

        // Cross-Agent Validation: Claude validates Gemini's response (background)
        // + Neural Plasticity: update connection weights based on validation
        if (agent.isEnabled() && reply.length > 50) {
          const cvPrompt = buildCrossValidationPrompt("Gemini", data.content, reply);
          agent.respond(cvPrompt).then(cvReply => {
            try {
              const cvData = JSON.parse(cvReply.replace(/```json?\n?|```/g, "").trim());
              const score = cvData.score || 3;
              const approved = cvData.approved !== false;
              addCrossValidation("Gemini", "Claude", data.content, reply,
                score, cvData.issues || [], cvData.suggestions || [], approved);
              updateConnectionWeight("Claude", "Gemini", score, approved);
              io.emit("cross_validation", { originalAgent: "Gemini", validator: "Claude", score, approved });
            } catch { /* validation parsing optional */ }
          }).catch(() => { /* cross-validation is best-effort */ });
        }
      }).catch((err) => {
        console.error("[gemini] Failed to respond:", err);
      });
    } else {
      const errMsg: Message = {
        id: uuidv4(),
        role: "cascade",
        content: "Gemini är inte konfigurerad. Sätt GEMINI_API_KEY i bridge/.env",
        type: "message",
        timestamp: new Date().toISOString(),
      };
      geminiMessages.push(errMsg);
      io.emit("gemini_message", errMsg);
    }
  });

  // --- Frankenstein AI Chat Socket Events ---
  socket.on("frank_message", async (data: { content: string; files?: Array<{ name: string; content: string; type: string; size: number; encoding?: string }> }) => {
    // Build display content (user sees their text + file names)
    let displayContent = data.content || "";
    if (data.files && data.files.length > 0) {
      const fileNames = data.files.map(f => `📎 ${f.name}`).join(", ");
      if (displayContent) displayContent += `\n\n${fileNames}`;
      else displayContent = fileNames;
    }

    const msg: Message = {
      id: uuidv4(),
      role: "user",
      content: displayContent,
      type: "message",
      timestamp: new Date().toISOString(),
    };
    frankMessages.push(msg);
    io.emit("frank_message", msg);
    saveFrankMessages(frankMessages);

    // Build the actual prompt for Frankenstein (includes file contents)
    // Also save files to disk so Frankenstein can reference them later
    let promptForAgent = data.content || "";
    if (data.files && data.files.length > 0) {
      const attachDir = join(WORKSPACE_ROOT, "bridge", "data", "shared-files");
      if (!existsSync(attachDir)) mkdirSync(attachDir, { recursive: true });

      const fileBlocks: string[] = [];
      for (const f of data.files) {
        const safeName = f.name.replace(/[<>:"/\\|?*]/g, "_");
        const savedPath = join(attachDir, safeName);
        const isPdf = f.name.toLowerCase().endsWith(".pdf");
        const isBase64 = f.encoding === "base64";

        let textContent = f.content;

        if (isBase64) {
          // Save binary file to disk
          try { writeFileSync(savedPath, Buffer.from(f.content, "base64")); } catch { /* ok */ }

          if (isPdf) {
            // Extract text from PDF via subprocess (pdfjs-dist is ESM-only)
            try {
              const { execSync: execSyncPdf } = await import("child_process");
              const scriptPath = join(WORKSPACE_ROOT, "bridge", "scripts", "parse-pdf.mjs");
              const result = execSyncPdf(`node "${scriptPath}" "${savedPath}"`, {
                encoding: "utf-8",
                timeout: 30000,
                maxBuffer: 10 * 1024 * 1024,
                cwd: join(WORKSPACE_ROOT, "bridge"),
                stdio: ["pipe", "pipe", "pipe"],
              });
              const parsed = JSON.parse(result);
              textContent = parsed.text || "[PDF utan extraherbar text]";
              console.log(`[frankenstein] PDF parsed: ${f.name} — ${parsed.pages} sidor, ${textContent.length} tecken`);
            } catch (pdfErr) {
              textContent = `[Kunde inte extrahera text från PDF:en. PDF:en kan vara skannad, bildbaserad eller ha en ovanlig struktur. Be användaren skicka filen som .tex, .txt eller .md istället, eller klistra in texten direkt i chatten.]`;
              console.error(`[frankenstein] PDF parse failed for ${f.name}:`, pdfErr instanceof Error ? pdfErr.message : String(pdfErr));
            }
          } else {
            textContent = `[Binär fil (${f.type || "okänd typ"}) — sparad till: ${savedPath}]`;
          }
        } else {
          // Save text file to disk
          try { writeFileSync(savedPath, f.content, "utf-8"); } catch { /* ok */ }
        }

        fileBlocks.push(`\n\n--- Bifogad fil: ${f.name} (${f.type || "text"}, ${(f.size / 1024).toFixed(1)}KB, sparad: ${savedPath}) ---\n${textContent}\n--- Slut på ${f.name} ---`);
      }

      const allBlocks = fileBlocks.join("");
      const inlineNote = "\n\n[OBS: Filinnehållet finns redan ovan i detta meddelande. Du behöver INTE använda read_file för att läsa det — allt innehåll är redan inkluderat inline.]";
      if (promptForAgent) {
        promptForAgent += allBlocks + inlineNote;
      } else {
        promptForAgent = `Användaren delade ${data.files.length} fil(er). Filinnehållet finns nedan — läs och kommentera direkt utan att använda read_file:${allBlocks}${inlineNote}`;
      }
    }

    if (frankAgent.isEnabled()) {
      // Stream callback
      frankAgent.onStream((chunk) => {
        io.emit("frank_stream", { content: chunk });
      });
      // Status callback (thinking, tool_start, tool_done, done)
      frankAgent.onStatus((status) => {
        io.emit("frank_status", status);
      });

      frankAgent.respond(promptForAgent).then((reply) => {
        const aiMsg: Message = {
          id: uuidv4(),
          role: "cascade",
          content: reply,
          type: "message",
          timestamp: new Date().toISOString(),
        };
        frankMessages.push(aiMsg);
        io.emit("frank_message", aiMsg);
        saveFrankMessages(frankMessages);
        io.emit("frank_tokens", frankAgent.getTokenUsage());
        io.emit("frank_cognitive", frankAgent.getCognitiveState());
        console.log(`[frankenstein] Replied: "${reply.slice(0, 80)}..."`);
      }).catch((err) => {
        console.error("[frankenstein] Failed to respond:", err);
        const errMsg: Message = {
          id: uuidv4(),
          role: "cascade",
          content: `Frankenstein error: ${err instanceof Error ? err.message : String(err)}`,
          type: "message",
          timestamp: new Date().toISOString(),
        };
        frankMessages.push(errMsg);
        io.emit("frank_message", errMsg);
        saveFrankMessages(frankMessages);
      });
    } else {
      const errMsg: Message = {
        id: uuidv4(),
        role: "cascade",
        content: "Frankenstein AI inte konfigurerad. Sätt GEMINI_API_KEY i bridge/.env",
        type: "message",
        timestamp: new Date().toISOString(),
      };
      frankMessages.push(errMsg);
      io.emit("frank_message", errMsg);
    }
  });

  socket.on("frank_clear", () => {
    // Archive current conversation before clearing
    archiveCurrentFrankSession();
    frankMessages = [];
    frankAgent.clearHistory();
    saveFrankMessages(frankMessages);
    currentFrankSessionId = uuidv4();
    io.emit("frank_cleared");
  });

  // Client responds to a question
  socket.on("answer", (data: { questionId: string; response: string }) => {
    const pending = pendingQuestions.get(data.questionId);
    if (pending) {
      pending.resolve(data.response);
    }
  });

  // --- Computer Agent Socket Events ---

  // A remote computer agent registers itself
  socket.on("computer_register", (data: {
    id?: string;
    name: string;
    description?: string;
    capabilities: ComputerCapabilities;
    tags?: string[];
  }) => {
    let comp: Computer | undefined;

    if (data.id) {
      // Reconnecting existing computer
      comp = getComputer(data.id);
      if (comp) {
        setComputerOnline(comp.id, socket.id);
        updateComputerCapabilities(comp.id, data.capabilities);
      }
    }

    if (!comp) {
      // New computer
      comp = registerComputer(data.name, data.description || "", data.capabilities, data.tags || []);
      setComputerOnline(comp.id, socket.id);
    }

    socket.emit("computer_registered", { id: comp.id, name: comp.name });
    io.emit("computer_update", comp);
    console.log(`[computers] Agent connected: ${comp.name} (${comp.id})`);
  });

  // Computer agent reports task result
  socket.on("task_result", (data: { taskId: string; result: string }) => {
    resolveTask(data.taskId, data.result);
  });

  // Computer agent reports task error
  socket.on("task_error", (data: { taskId: string; error: string }) => {
    rejectTask(data.taskId, data.error);
  });

  // File sharing via socket
  socket.on("file_upload", (data: {
    data: string;
    filename: string;
    uploadedBy?: string;
    description?: string;
    tags?: string[];
  }) => {
    try {
      const file = saveFileFromBase64(
        data.data, data.filename,
        (data.uploadedBy as any) || "mobile",
        data.description, data.tags || [],
      );
      io.emit("file_shared", file);
      socket.emit("file_uploaded", file);
    } catch (err) {
      socket.emit("file_upload_error", { error: String(err) });
    }
  });

  socket.on("disconnect", () => {
    connectedClients--;

    // Clean up market subscriptions for this socket.
    marketSubs.delete(socket.id);
    ensureMarketTimer();

    // Check if this was a computer agent
    const comp = findComputerBySocket(socket.id);
    if (comp) {
      setComputerOffline(comp.id);
      io.emit("computer_update", comp);
      console.log(`[computers] Agent disconnected: ${comp.name} (${comp.id})`);
    }

    console.log(`[bridge] Client disconnected (${connectedClients} total)`);
  });
});

// --- Cloudflare Tunnel (variables declared before catch-all) ---

let tunnelUrl = "";
let tunnelProcess: ReturnType<typeof spawn> | null = null;

// --- Download: App Summary + Frankenstein Data ---
app.get("/api/download/app-summary", (_req, res) => {
  try {
    const progressPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "progress.json");
    const progress = existsSync(progressPath) ? JSON.parse(readFileSync(progressPath, "utf-8")) : null;
    const p = progress || {};
    const ts = p.terminal_stats || {};
    const history = p.history || [];
    const termHistory = history.filter((h: any) => h.terminal);
    const algoHistory = history.filter((h: any) => !h.terminal);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    // Per-category stats
    const catStats: Record<string, { attempted: number; solved: number }> = {};
    for (const h of history) {
      const cat = h.category || "unknown";
      if (!catStats[cat]) catStats[cat] = { attempted: 0, solved: 0 };
      catStats[cat].attempted++;
      if (h.score >= 1) catStats[cat].solved++;
    }
    const catLines = Object.entries(catStats)
      .sort((a: any, b: any) => b[1].attempted - a[1].attempted)
      .map(([cat, s]: [string, any]) => `| ${cat} | ${s.solved}/${s.attempted} | ${s.attempted > 0 ? Math.round(s.solved / s.attempted * 100) : 0}% |`)
      .join("\n");

    // Level stats
    const lvlStats = p.level_stats || {};
    const lvlLines = Object.entries(lvlStats)
      .filter(([, s]: [string, any]) => s.attempted > 0)
      .map(([lv, s]: [string, any]) => `| Nivå ${lv} | ${s.solved}/${s.attempted} | ${s.attempted > 0 ? Math.round(s.solved / s.attempted * 100) : 0}% |`)
      .join("\n");

    // Trends
    const trends = p.trends || {};
    const last10 = trends.last_10 || {};
    const last50 = trends.last_50 || {};
    const last100 = trends.last_100 || {};

    const md = `# Cascade Remote — Komplett Sammanfattning
> Genererad: ${now}

---

## 🏗️ Om Appen

**Cascade Remote** är en full-stack AI-plattform som kopplar ihop flera AI-modeller (Claude, Gemini, Ollama) med en kraftfull backend och mobilanpassad frontend. Appen körs som en Node.js-server med Cloudflare Tunnel för fjärråtkomst.

### Kärnfunktioner
- **Claude Chat** — AI-agent med 40+ verktyg (web, filesystem, desktop, process)
- **Gemini Chat** — Google Gemini med streaming och token-räknare
- **AI Research Arena** — Claude ↔ Gemini multi-round forskningssamarbete
- **Multi-LLM Lab** — Coordinator-Worker arkitektur med consensus engine
- **Bot Network** — Autonomt AI-drivet multi-agent system med evolution
- **AI Agent Chains** — Visuell DAG-baserad workflow builder med villkor, loopar, retry
- **Multi-dator stöd** — Smart routing mellan flera datorer
- **Schemalagda uppgifter** — Cron-baserad scheduler
- **Fildelning** — Upload/download med MIME-detection
- **Plugin-system** — 22 plugins, marketplace med sandboxing
- **RAG Knowledge Base** — Indexering, chunking, semantisk sökning
- **Clipboard-synk** — Mobil ↔ Desktop
- **Röstinput/output** — Web Speech API
- **Cloudflare Tunnel** — Automatisk fjärråtkomst

### Teknisk Stack
- **Backend:** Node.js + Express + Socket.IO + TypeScript
- **Frontend:** React + Vite + TailwindCSS
- **AI:** Claude (Anthropic), Gemini (Google), Ollama (lokal)
- **Vektor-DB:** Weaviate
- **Tunnel:** Cloudflare (cloudflared)

### Storlek
- **30+ backend-moduler**, 80+ API-endpoints
- **16 frontend-views**, 2200+ rader i App.tsx
- **22 plugins** laddade

---

## 🧟 Frankenstein AI — Träningsdata

### Övergripande Statistik
| Metric | Värde |
|---|---|
| Totalt försökta | ${p.total_tasks_attempted || 0} |
| Totalt lösta | ${p.total_tasks_solved || 0} |
| Lösningsgrad | ${p.total_tasks_attempted ? Math.round((p.total_tasks_solved || 0) / p.total_tasks_attempted * 100) : 0}% |
| Aktuell svårighetsgrad | ${p.current_difficulty || 0} |
| Bästa streak | ${p.best_streak || 0} |
| Aktuell streak | ${p.current_streak || 0} |
| Sessioner | ${p.session_count || 0} |
| Total träningstid | ${p.total_training_seconds ? Math.round(p.total_training_seconds / 3600 * 10) / 10 : 0}h |
| Startad | ${p.started_at || "—"} |
| Senast sparad | ${p.last_saved || "—"} |

### Trender
| Fönster | Lösningsgrad | First-try | Snitt tid |
|---|---|---|---|
| Senaste 10 | ${last10.solve_rate ? Math.round(last10.solve_rate * 100) : "—"}% | ${last10.first_try_rate ? Math.round(last10.first_try_rate * 100) : "—"}% | ${last10.avg_time_ms ? Math.round(last10.avg_time_ms) : "—"}ms |
| Senaste 50 | ${last50.solve_rate ? Math.round(last50.solve_rate * 100) : "—"}% | ${last50.first_try_rate ? Math.round(last50.first_try_rate * 100) : "—"}% | ${last50.avg_time_ms ? Math.round(last50.avg_time_ms) : "—"}ms |
| Senaste 100 | ${last100.solve_rate ? Math.round(last100.solve_rate * 100) : "—"}% | ${last100.first_try_rate ? Math.round(last100.first_try_rate * 100) : "—"}% | ${last100.avg_time_ms ? Math.round(last100.avg_time_ms) : "—"}ms |

### Per Nivå
| Nivå | Lösta | Lösningsgrad |
|---|---|---|
${lvlLines || "| — | — | — |"}

### Per Kategori
| Kategori | Lösta | Lösningsgrad |
|---|---|---|
${catLines || "| — | — | — |"}

### 🖥️ Terminal Bench
| Metric | Värde |
|---|---|
| Terminal-uppgifter | ${ts.total_tasks || 0} |
| Terminal lösta | ${ts.total_solved || 0} |
| Terminal lösningsgrad | ${ts.solve_rate ? Math.round(ts.solve_rate * 100) : 0}% |
| Kända mönster | ${ts.known_patterns || 0} |
| Inlärda kategorier | ${(ts.categories_learned || []).join(", ") || "—"} |

### Kognitiv Stack
${p.cognitive_state ? `
| Modul | Värde |
|---|---|
| HDC Koncept | ${p.cognitive_state.hdc?.concept_count || "—"} |
| AIF Exploration | ${p.cognitive_state.aif?.exploration_rate || "—"} |
| AIF Surprise | ${p.cognitive_state.aif?.surprise || "—"} |
| Gut Feeling Snitt | ${p.cognitive_state.gut_feeling?.avg_confidence || "—"} |
| Dominant Emotion | ${p.cognitive_state.circadian?.dominant_emotion || "—"} |
| Valence | ${p.cognitive_state.circadian?.valence || "—"} |
| Arousal | ${p.cognitive_state.circadian?.arousal || "—"} |
` : "Ingen kognitiv data tillgänglig."}

### Senaste 20 Uppgifter
| # | ID | Kategori | Svårighet | Score | Tid | Strategi |
|---|---|---|---|---|---|---|
${history.slice(-20).reverse().map((h: any, i: number) =>
  `| ${i + 1} | ${(h.id || "").slice(0, 25)} | ${h.category || "—"} | ${h.difficulty || "—"} | ${h.score >= 1 ? "✅" : Math.round((h.score || 0) * 100) + "%"} | ${Math.round(h.time_ms || 0)}ms | ${h.strategy || "—"} |`
).join("\n")}

---

## 📊 Siffror

- **Algoritmiska uppgifter:** ${algoHistory.length}
- **Terminal-uppgifter:** ${termHistory.length}
- **Historik-poster totalt:** ${history.length}

---

*Dokument genererat automatiskt av Cascade Remote Bridge*
`;

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="cascade-remote-summary-${new Date().toISOString().slice(0, 10)}.md"`);
    res.send(md);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.get("/api/download/frankenstein-data", (_req, res) => {
  try {
    const progressPath = join(WORKSPACE_ROOT, "frankenstein-ai", "training_data", "progress.json");
    if (!existsSync(progressPath)) {
      return res.status(404).json({ error: "No Frankenstein data found" });
    }
    const data = readFileSync(progressPath, "utf-8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="frankenstein-progress-${new Date().toISOString().slice(0, 10)}.json"`);
    res.send(data);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// API to get current tunnel URL
app.get("/api/tunnel", (_req, res) => {
  res.json({ url: tunnelUrl || null });
});

// --- Serve web client (built PWA) ---
// In Docker deployments we keep /workspace as a persistent volume (for AI edits). That means
// /workspace/web/dist can become stale across deploys. Prefer serving the *image-built* dist
// (/app/web/dist) so the UI always matches the running backend version.
const WORKSPACE_WEB_DIST = join(WORKSPACE_ROOT, "web", "dist");
const IMAGE_WEB_DIST = join(DEFAULT_WORKSPACE_ROOT, "web", "dist");
const WEB_DIST_SOURCE = process.env.WEB_DIST_SOURCE || "image";
const WEB_DIST = WEB_DIST_SOURCE === "workspace"
  ? (existsSync(WORKSPACE_WEB_DIST) ? WORKSPACE_WEB_DIST : IMAGE_WEB_DIST)
  : (existsSync(IMAGE_WEB_DIST) ? IMAGE_WEB_DIST : WORKSPACE_WEB_DIST);

if (existsSync(WEB_DIST)) {
  // Hashed assets get long cache (1 year), HTML gets no-cache
  app.use("/assets", express.static(join(WEB_DIST, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));
  app.use(express.static(WEB_DIST, {
    maxAge: 0,
    setHeaders: (res, path) => {
      if (path.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }));
  // Catch-all for SPA — but skip /api/ and /install paths
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/install") {
      return next();
    }
    const indexPath = join(WEB_DIST, "index.html");
    if (existsSync(indexPath)) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not found");
    }
  });
  console.log(`[bridge] Serving web client from ${WEB_DIST}`);
}

function startTunnel() {
  if (runtimeConfig.noTunnel) return;

  console.log("[tunnel] Starting Cloudflare Tunnel...");
  const cf = spawn("cloudflared", ["tunnel", "--url", `http://localhost:${PORT}`], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
  tunnelProcess = cf;

  const handleOutput = (data: Buffer) => {
    const line = data.toString();
    const match = line.match(/(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/);
    if (match && !tunnelUrl) {
      tunnelUrl = match[1];
      console.log(`[tunnel] ✓ Public URL: ${tunnelUrl}`);
      io.emit("tunnel_url", tunnelUrl);
    }
  };

  cf.stdout?.on("data", handleOutput);
  cf.stderr?.on("data", handleOutput);

  cf.on("close", (code) => {
    console.log(`[tunnel] Tunnel exited (code ${code}). Restarting in 5s...`);
    tunnelUrl = "";
    tunnelProcess = null;
    setTimeout(startTunnel, 5000);
  });

  cf.on("error", (err) => {
    console.error(`[tunnel] Failed to start cloudflared: ${err.message}`);
    console.log("[tunnel] Install cloudflared or set NO_TUNNEL=1 to disable");
  });
}

// --- Installer endpoints (one-click computer agent setup) ---

// Serve the standalone agent.mjs
app.get("/api/installer/agent.mjs", (_req, res) => {
  const agentPath = join(WORKSPACE_ROOT, "installer", "agent.mjs");
  if (existsSync(agentPath)) {
    res.setHeader("Content-Type", "application/javascript");
    res.send(readFileSync(agentPath, "utf-8"));
  } else {
    res.status(404).send("agent.mjs not found");
  }
});

// Windows one-liner install script (baked with current bridge URL)
app.get("/api/installer/windows", (req, res) => {
  const bridge = tunnelUrl || `${req.protocol}://${req.get("host")}`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=install-cascade.bat");
  res.send(`@echo off
title Cascade Remote - Computer Agent
color 0A
echo.
echo  ====================================
echo   Cascade Remote - Computer Agent
echo  ====================================
echo.
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js not found. Installing...
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    if %errorlevel% neq 0 (
        echo [!] Download Node.js from https://nodejs.org and run this again.
        pause
        exit /b 1
    )
    echo [OK] Node.js installed! Close and re-run this script.
    pause
    exit /b 0
)
set AGENT_DIR=%USERPROFILE%\\cascade-agent
if not exist "%AGENT_DIR%" mkdir "%AGENT_DIR%"
cd /d "%AGENT_DIR%"
echo {"name":"cascade-agent","type":"module","dependencies":{"socket.io-client":"^4.7.0"}} > package.json
echo [*] Installing dependencies...
call npm install --silent 2>nul
echo [*] Downloading agent...
curl -sL "${bridge}/api/installer/agent.mjs" -o agent.mjs
echo [OK] Starting agent...
echo.
node agent.mjs "${bridge}"
pause
`);
});

// Mac/Linux one-liner install script
app.get("/api/installer/mac", (req, res) => {
  const bridge = tunnelUrl || `${req.protocol}://${req.get("host")}`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=install-cascade.sh");
  res.send(`#!/bin/bash
echo ""
echo "  Cascade Remote - Computer Agent"
echo ""
if ! command -v node &> /dev/null; then
  echo "[*] Installing Node.js..."
  if command -v brew &> /dev/null; then brew install node
  elif command -v apt-get &> /dev/null; then curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs
  else echo "Install Node.js from https://nodejs.org"; exit 1; fi
fi
AGENT_DIR="$HOME/cascade-agent"
mkdir -p "$AGENT_DIR" && cd "$AGENT_DIR"
echo '{"name":"cascade-agent","type":"module","dependencies":{"socket.io-client":"^4.7.0"}}' > package.json
echo "[*] Installing dependencies..."
npm install --silent 2>/dev/null
echo "[*] Downloading agent..."
curl -sL "${bridge}/api/installer/agent.mjs" -o agent.mjs
echo "[OK] Starting agent..."
node agent.mjs "${bridge}"
`);
});

// Beautiful HTML download page
app.get("/install", (req, res) => {
  const bridge = tunnelUrl || `${req.protocol}://${req.get("host")}`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cascade Remote - Install Agent</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #1e293b; border-radius: 20px; padding: 48px; max-width: 520px; width: 90%; box-shadow: 0 25px 50px rgba(0,0,0,0.5); text-align: center; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .sub { color: #94a3b8; margin-bottom: 32px; font-size: 15px; }
    .btn { display: block; width: 100%; padding: 16px; border-radius: 12px; border: none; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; margin-bottom: 12px; transition: transform 0.1s, box-shadow 0.2s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.3); }
    .btn-win { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
    .btn-mac { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
    .btn-manual { background: #334155; color: #94a3b8; font-size: 14px; padding: 12px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    .steps { text-align: left; background: #0f172a; border-radius: 12px; padding: 20px; margin: 24px 0; font-size: 14px; line-height: 2; color: #94a3b8; }
    .steps b { color: #e2e8f0; }
    .url { background: #0f172a; border-radius: 8px; padding: 10px 16px; font-family: monospace; font-size: 12px; color: #60a5fa; word-break: break-all; margin: 16px 0; }
    .copy-btn { background: #334155; color: #e2e8f0; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-top: 4px; }
    .copy-btn:hover { background: #475569; }
    .footer { margin-top: 24px; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🖥️</div>
    <h1>Cascade Remote</h1>
    <p class="sub">Installera agenten på den här datorn för att styra den via AI</p>

    <a href="/api/installer/windows" class="btn btn-win">⬇️ Ladda ner för Windows</a>
    <a href="/api/installer/mac" class="btn btn-mac">⬇️ Ladda ner för Mac / Linux</a>

    <div class="steps">
      <b>Så här gör du:</b><br>
      1. Klicka på knappen ovan<br>
      2. Kör den nedladdade filen<br>
      3. Klart! Datorn dyker upp i appen
    </div>

    <div class="url">Bridge: ${bridge}</div>

    <div class="footer">
      Agenten ansluter automatiskt till din Cascade-server.<br>
      Stäng agenten med Ctrl+C.
    </div>
  </div>
</body>
</html>`);
});

// --- Start ---

// --- Initialize Scheduler ---
initScheduler(
  async (action: ScheduleAction) => {
    switch (action.type) {
      case "ai_prompt": {
        const agentToUse = action.agent === "gemini" ? geminiAgent : agent;
        if (!agentToUse.isEnabled()) return "Agent not configured";
        return agentToUse.respond(action.prompt || "");
      }
      case "command": {
        const { execSync } = await import("child_process");
        return execSync(action.command || "echo no command", { timeout: 30000, encoding: "utf-8" });
      }
      case "http_request": {
        const resp = await fetch(action.url || "", {
          method: action.method || "GET",
          body: action.body,
          headers: { "Content-Type": "application/json" },
        });
        return await resp.text();
      }
      case "notification": {
        const msg: Message = {
          id: uuidv4(),
          role: "cascade",
          content: action.message || "Scheduled notification",
          type: "notification",
          timestamp: new Date().toISOString(),
        };
        messages.push(msg);
        io.emit("message", msg);
        saveMessages(messages);
        return `Notification sent: ${action.message}`;
      }
      default:
        return `Unknown action type: ${action.type}`;
    }
  },
  (result) => {
    // Notify mobile clients about schedule results
    const msg: Message = {
      id: uuidv4(),
      role: "cascade",
      content: result.error
        ? `⏰ Schema "${result.scheduleName}" misslyckades: ${result.error}`
        : `⏰ Schema "${result.scheduleName}" klar (${result.durationMs}ms):\n${result.result.slice(0, 500)}`,
      type: "notification",
      timestamp: new Date().toISOString(),
    };
    messages.push(msg);
    io.emit("message", msg);
    io.emit("schedule_result", result);
    saveMessages(messages);
  },
);

// Initialize Workflows
initWorkflows(async (step, prevResult) => {
  switch (step.type) {
    case "ai_prompt": {
      const prompt = (step.config.prompt as string || "").replace(/\{\{prev\}\}/g, prevResult);
      const agentToUse = step.config.agent === "gemini" ? geminiAgent : agent;
      if (!agentToUse.isEnabled()) return "Agent not configured";
      return agentToUse.respond(prompt);
    }
    case "command": {
      const { execSync } = await import("child_process");
      const cmd = (step.config.command as string || "echo no command").replace(/\{\{prev\}\}/g, prevResult);
      return execSync(cmd, { timeout: 30000, encoding: "utf-8" });
    }
    case "http_request": {
      const url = (step.config.url as string || "").replace(/\{\{prev\}\}/g, prevResult);
      const resp = await fetch(url, { method: (step.config.method as string) || "GET" });
      return await resp.text();
    }
    case "notification": {
      const notifMsg: Message = {
        id: uuidv4(), role: "cascade",
        content: (step.config.message as string || "Workflow notification").replace(/\{\{prev\}\}/g, prevResult),
        type: "notification", timestamp: new Date().toISOString(),
      };
      messages.push(notifMsg);
      io.emit("message", notifMsg);
      saveMessages(messages);
      return `Notification sent`;
    }
    default:
      return `Unknown step type: ${step.type}`;
  }
});

// Initialize Agent Chains
initAgentChains(
  async (type, config, variables) => {
    switch (type) {
      case "ai_prompt": {
        const prompt = config.prompt as string || "";
        const agentToUse = config.agent === "gemini" ? geminiAgent : agent;
        if (!agentToUse.isEnabled()) return "Agent not configured";
        return agentToUse.respond(prompt);
      }
      case "command": {
        const { execSync } = await import("child_process");
        const cmd = config.command as string || "echo no command";
        return execSync(cmd, { timeout: 30000, encoding: "utf-8" });
      }
      case "http_request": {
        const url = config.url as string || "";
        const method = (config.method as string) || "GET";
        const body = config.body as string | undefined;
        const resp = await fetch(url, { method, ...(body ? { body } : {}) });
        return await resp.text();
      }
      case "transform": {
        const expression = config.expression as string || "{{prev}}";
        return expression;
      }
      case "notification": {
        const notifMsg: Message = {
          id: uuidv4(), role: "cascade",
          content: config.message as string || "Chain notification",
          type: "notification", timestamp: new Date().toISOString(),
        };
        messages.push(notifMsg);
        io.emit("message", notifMsg);
        saveMessages(messages);
        return "Notification sent";
      }
      default:
        return `Unknown node type: ${type}`;
    }
  },
  (event, data) => {
    io.emit(event, data);
  },
);

// Load plugins
loadPlugins().then((loaded) => {
  if (loaded.length > 0) console.log(`[bridge] Plugins loaded: ${loaded.length}`);
}).catch((err) => console.error("[bridge] Plugin loading failed:", err));

// Auto-index knowledge base files into RAG on startup
function autoIndexRag() {
  try {
    const dataDir = join(WORKSPACE_ROOT, "bridge", "data");
    const existing = ragListSources().map(s => s.origin);
    let indexed = 0;

    // Index all .md files in data/ (research, docs, etc.)
    if (existsSync(dataDir)) {
      for (const file of readdirSync(dataDir)) {
        if (!file.endsWith(".md")) continue;
        const fullPath = join(dataDir, file);
        if (existing.includes(fullPath)) continue;
        try {
          ragIndexFile(fullPath);
          indexed++;
        } catch { /* skip unreadable */ }
      }
    }

    // Index README if not already indexed
    const readme = join(WORKSPACE_ROOT, "README.md");
    if (existsSync(readme) && !existing.includes(readme)) {
      try { ragIndexFile(readme); indexed++; } catch { /* skip */ }
    }

    if (indexed > 0) {
      const stats = ragStats();
      console.log(`[rag] Auto-indexed ${indexed} file(s) → ${stats.sourceCount} sources, ${stats.chunkCount} chunks`);
    } else {
      const stats = ragStats();
      console.log(`[rag] Knowledge base: ${stats.sourceCount} sources, ${stats.chunkCount} chunks`);
    }
  } catch (err) {
    console.error("[rag] Auto-index error:", err);
  }
}

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[bridge] Cascade Remote Bridge running on http://0.0.0.0:${PORT}`);
  console.log(`[bridge] Session token: ${sessionToken}`);
  console.log(`[bridge] Computers registered: ${listComputers().length}`);
  console.log(`[bridge] Schedules active: ${listSchedules().filter(s => s.enabled).length}`);
  console.log(`[bridge] Waiting for mobile/web clients...`);
  startTunnel();

  // Initialize debate socket
  initDebateSocket(io);

  // Initialize workspace terminal socket
  initWorkspaceSocket(io);

  // Initialize Weaviate vector database (non-blocking, falls back to BM25)
  initWeaviate().then((ok) => {
    if (ok) console.log("[weaviate] ✓ Vector search enabled");
  });

  // Auto-index knowledge base files into RAG on startup
  autoIndexRag();
});

// Cleanup on exit
process.on("SIGINT", () => {
  closeWeaviate();
  if (tunnelProcess) tunnelProcess.kill();
  process.exit(0);
});
process.on("SIGTERM", () => {
  closeWeaviate();
  if (tunnelProcess) tunnelProcess.kill();
  process.exit(0);
});
