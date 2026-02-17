import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, TouchEvent as ReactTouchEvent } from "react";
import { io, Socket } from "socket.io-client";
import {
  Send,
  Wifi,
  WifiOff,
  MessageCircle,
  Bell,
  HelpCircle,
  CheckCircle,
  XCircle,
  Brain,
  Sparkles,
  Zap,
  Swords,
  FolderSearch,
  Search,
  Globe,
  Link,
  Copy,
  Terminal,
  Cog,
  Cpu,
  Shield,
  Eye,
  Wrench,
  Settings,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Monitor,
  FileText,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  DollarSign,
  X,
  ArrowRightLeft,
  History,
  Plus,
  PanelLeftOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import VoiceButton from "./components/VoiceButton";
import ConversationSidebar, { type Conversation } from "./components/ConversationSidebar";
import { BRIDGE_URL } from "./config";
import {
  hapticForEvent, useOfflineStatus, usePwaInstall,
  addToOfflineQueue, getOfflineQueue, clearOfflineQueue,
  cacheConversations,
} from "./hooks/useMobile";

const ToolsView = lazy(() => import("./components/ToolsView"));
const SettingsView = lazy(() => import("./components/SettingsView"));
const ComputersView = lazy(() => import("./components/ComputersView"));
const SchedulerView = lazy(() => import("./components/SchedulerView"));
const FilesView = lazy(() => import("./components/FilesView"));
const SearchView = lazy(() => import("./components/SearchView"));
const ProjectsView = lazy(() => import("./components/ProjectsView"));
const ClipboardView = lazy(() => import("./components/ClipboardView"));
const PluginsView = lazy(() => import("./components/PluginsView"));
const DashboardView = lazy(() => import("./components/DashboardView"));
const WorkflowsView = lazy(() => import("./components/WorkflowsView"));
const AgentChainsView = lazy(() => import("./components/AgentChainsView"));
const ResearchLabView = lazy(() => import("./components/ResearchLabView"));
const InstallView = lazy(() => import("./components/InstallView"));
const NetworkView = lazy(() => import("./components/NetworkView"));
const SwarmView = lazy(() => import("./components/SwarmView"));
const FrankensteinView = lazy(() => import("./components/FrankensteinView"));
// BattleArenaView + SelfImproveView merged into ResearchLabView
const HierarchyView = lazy(() => import("./components/HierarchyView"));
const FrankensteinChatView = lazy(() => import("./components/FrankensteinChatView"));
const FlipperZeroView = lazy(() => import("./components/FlipperZeroView"));
const GitView = lazy(() => import("./components/GitView"));
const DebateView = lazy(() => import("./components/DebateView"));
const CodeEditorView = lazy(() => import("./components/CodeEditorView"));

const LazyFallback = () => <div className="flex-1 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>;

const REMARK_PLUGINS = [remarkGfm];

/** Strip incomplete fenced code blocks at the end of streaming text to prevent flicker */
function cleanStreamingText(text: string): string {
  // Count backtick fences
  const fences = text.match(/^```/gm);
  if (fences && fences.length % 2 !== 0) {
    // Odd number of fences = unclosed code block, remove the last one
    const lastFence = text.lastIndexOf('```');
    return text.slice(0, lastFence);
  }
  return text;
}

// Lightweight code renderer for streaming — no SyntaxHighlighter, no flicker
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const streamingCodeComponent: Record<string, any> = {
  code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    if (match) {
      return (
        <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto my-1">
          <code className="text-xs text-slate-300 font-mono" {...props}>{code}</code>
        </pre>
      );
    }
    return <code className="bg-slate-700/60 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markdownCodeComponent: Record<string, any> = {
  code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    if (match) {
      return (
        <div className="relative group">
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="absolute right-2 top-2 p-1 rounded bg-slate-700/80 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            title="Kopiera"
          >
            <Copy className="w-3 h-3" />
          </button>
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: "0.5rem", fontSize: "0.75rem" }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }
    return <code className="bg-slate-700/60 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markdownCodeComponentNoCopy: Record<string, any> = {
  code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    if (match) {
      return (
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: "0.5rem", fontSize: "0.75rem" }}>
          {code}
        </SyntaxHighlighter>
      );
    }
    return <code className="bg-slate-700/60 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
  },
};

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
}

interface AgentStatusEvent {
  type: "thinking" | "tool_start" | "tool_done" | "done";
  tool?: string;
  input?: string;
  category: string;
  timestamp: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  thinking: { icon: Brain, label: "Tänker", color: "text-purple-400", bg: "bg-purple-950/60 border-purple-800" },
  memory: { icon: Sparkles, label: "Sparar minne", color: "text-amber-400", bg: "bg-amber-950/60 border-amber-800" },
  filesystem: { icon: FolderSearch, label: "Läser filer", color: "text-blue-400", bg: "bg-blue-950/60 border-blue-800" },
  search: { icon: Search, label: "Söker", color: "text-pink-400", bg: "bg-pink-950/60 border-pink-800" },
  command: { icon: Terminal, label: "Kör kommando", color: "text-emerald-400", bg: "bg-emerald-950/60 border-emerald-800" },
  process: { icon: Cog, label: "Processer", color: "text-orange-400", bg: "bg-orange-950/60 border-orange-800" },
  system: { icon: Cpu, label: "Systeminfo", color: "text-violet-400", bg: "bg-violet-950/60 border-violet-800" },
  security: { icon: Shield, label: "Säkerhet", color: "text-yellow-400", bg: "bg-yellow-950/60 border-yellow-800" },
  desktop: { icon: Eye, label: "Datorstyrning", color: "text-cyan-400", bg: "bg-cyan-950/60 border-cyan-800" },
  web: { icon: Search, label: "Söker på nätet", color: "text-green-400", bg: "bg-green-950/60 border-green-800" },
  knowledge: { icon: FolderSearch, label: "Kunskapsbas", color: "text-indigo-400", bg: "bg-indigo-950/60 border-indigo-800" },
};

const SLASH_COMMANDS = [
  { cmd: "/screenshot", desc: "Ta en skärmdump", action: "Ta en screenshot och beskriv vad du ser" },
  { cmd: "/search", desc: "Sök på nätet", action: "" },
  { cmd: "/files", desc: "Lista filer", action: "Lista filerna i projektets rot-mapp" },
  { cmd: "/status", desc: "Systemstatus", action: "Visa systeminfo: CPU, RAM, disk, nätverk" },
  { cmd: "/clear", desc: "Rensa chatten", action: "__clear__" },
  { cmd: "/memory", desc: "Visa minnen", action: "Lista alla sparade minnen" },
  { cmd: "/rag", desc: "Kunskapsbas", action: "Visa RAG-statistik och källor" },
] as const;

type Tab = "chat" | "gemini" | "frank" | "arena" | "lab" | "tools" | "settings" | "more";

interface ArenaMessage {
  id: string;
  role: "claude" | "gemini" | "gemini-innovator" | "gemini-verifier" | "ollama" | "deepseek" | "system";
  content: string;
  timestamp: string;
  phase?: string;
  memoryId?: string;
  votes?: { up: number; down: number };
}

interface ArenaStatus {
  thinking: "claude" | "gemini" | "gemini-innovator" | "gemini-verifier" | "ollama" | "deepseek" | null;
  round: number;
  maxRounds: number;
  phase?: string;
  done?: boolean;
}

interface SandboxExecution {
  id: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  language: string;
  code: string;
  filename: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timestamp: string;
  status: "success" | "error" | "timeout";
}

interface SharedMemoryItem {
  id: string;
  type: "insight" | "finding" | "decision" | "question" | "todo" | "summary";
  content: string;
  author: "claude" | "gemini" | "gemini-innovator" | "gemini-verifier" | "both";
  topic: string;
  tags: string[];
  timestamp: string;
}

const MEMORY_ICONS: Record<string, string> = {
  insight: "💡",
  finding: "🔬",
  decision: "✅",
  question: "❓",
  todo: "📌",
  summary: "📝",
};

interface OrchestratorWorker {
  id: string;
  name: string;
  model: string;
  provider: string;
  role: string;
  status: "online" | "offline" | "busy" | "error" | "rate_limited";
  enabled: boolean;
  health: {
    avgLatencyMs: number;
    successRate: number;
    totalRequests: number;
    failedRequests: number;
    totalTokens: number;
    estimatedCostUsd: number;
    lastResponseMs: number;
    lastError: string | null;
    lastActiveAt: string | null;
    uptime: number;
  };
  capabilities: string[];
  activeTasks: number;
}

interface OrchestratorTask {
  id: string;
  type: string;
  prompt: string;
  status: string;
  priority: string;
  assignedWorkers: string[];
  results: { workerId: string; workerName: string; response: string; latencyMs: number; tokens: number; confidence: number }[];
  consensusResult: string | null;
  consensusScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface OrchestratorStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgLatencyMs: number;
  totalTokens: number;
  estimatedCostUsd: number;
  consensusAccuracy: number;
  uptimeSeconds: number;
  biasAlerts: number;
  crossWorkerLearnings: number;
  evaluationScore: number;
}

interface BiasAlert {
  taskId: string;
  timestamp: string;
  divergenceScore: number;
  workers: { id: string; name: string; keyDifference: string }[];
  resolved: boolean;
}

interface AuditEntry {
  timestamp: string;
  workerId: string;
  workerName: string;
  action: string;
  taskId?: string;
  taskType?: string;
  latencyMs?: number;
  tokens?: number;
  details?: string;
}

interface WorkerLearning {
  workerId: string;
  taskType: string;
  avgLatencyMs: number;
  avgConfidence: number;
  successCount: number;
  failCount: number;
  lastUpdated: string;
}

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-slate-600",
  busy: "bg-amber-500",
  error: "bg-red-500",
  rate_limited: "bg-orange-500",
};

const ROLE_LABELS: Record<string, string> = {
  analyst: "🔍 Analytiker",
  researcher: "🔬 Forskare",
  verifier: "✅ Verifierare",
  generalist: "🌐 Generalist",
  innovator: "🧪 Innovatör",
};

const ARENA_AGENTS: Record<string, { label: string; emoji: string; bg: string; border: string; text: string; code: string; icon: React.ElementType; align: string }> = {
  claude:              { label: "Claude",             emoji: "🏗️", bg: "bg-blue-950/60",    border: "border-blue-800/50",    text: "text-blue-100",    code: "prose-code:text-blue-300",    icon: Brain,    align: "justify-start" },
  gemini:              { label: "Gemini",             emoji: "🔍", bg: "bg-violet-950/60",  border: "border-violet-800/50",  text: "text-violet-100",  code: "prose-code:text-violet-300",  icon: Zap,      align: "justify-end" },
  "gemini-innovator":  { label: "Gemini-Innovatör",  emoji: "🧪", bg: "bg-emerald-950/60", border: "border-emerald-800/50", text: "text-emerald-100", code: "prose-code:text-emerald-300", icon: Sparkles, align: "justify-start" },
  "gemini-verifier":   { label: "Gemini-Verifierare", emoji: "📊", bg: "bg-amber-950/60",   border: "border-amber-800/50",   text: "text-amber-100",   code: "prose-code:text-amber-300",   icon: Shield,   align: "justify-end" },
  ollama:              { label: "Ollama",             emoji: "🦙", bg: "bg-rose-950/60",    border: "border-rose-800/50",    text: "text-rose-100",    code: "prose-code:text-rose-300",    icon: Cpu,      align: "justify-start" },
  deepseek:            { label: "DeepSeek",           emoji: "🧠", bg: "bg-cyan-950/60",    border: "border-cyan-800/50",    text: "text-cyan-100",    code: "prose-code:text-cyan-300",    icon: Brain,    align: "justify-end" },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusEvent | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  // L: Mobile hooks
  const { isOnline, wasOffline } = useOfflineStatus();
  const { canInstall, isInstalled, install: installPwa } = usePwaInstall();
  const [tokenUsage, setTokenUsage] = useState({ inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 });
  const [tokenPulse, setTokenPulse] = useState(false);
  const [sendRipple, setSendRipple] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [showTunnel, setShowTunnel] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<{ used: number; budget: number } | null>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [geminiMessages, setGeminiMessages] = useState<Message[]>([]);
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiEnabled, setGeminiEnabled] = useState(false);
  const [geminiThinking, setGeminiThinking] = useState(false);
  const [geminiStream, setGeminiStream] = useState<string | null>(null);
  const [geminiTokens, setGeminiTokens] = useState({ inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 });
  const geminiEndRef = useRef<HTMLDivElement>(null);
  const [arenaMessages, setArenaMessages] = useState<ArenaMessage[]>([]);
  const [arenaInput, setArenaInput] = useState("");
  const [arenaRunning, setArenaRunning] = useState(false);
  const [arenaStatus, setArenaStatus] = useState<ArenaStatus | null>(null);
  const [sharedMemories, setSharedMemories] = useState<SharedMemoryItem[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const arenaEndRef = useRef<HTMLDivElement>(null);
  const [sandboxExecutions, setSandboxExecutions] = useState<SandboxExecution[]>([]);
  const [sandboxCode, setSandboxCode] = useState("");
  const [sandboxLang, setSandboxLang] = useState<string>("javascript");
  const [showSandbox, setShowSandbox] = useState(false);
  const [labWorkers, setLabWorkers] = useState<OrchestratorWorker[]>([]);
  const [labStats, setLabStats] = useState<OrchestratorStats | null>(null);
  const [labTasks, setLabTasks] = useState<OrchestratorTask[]>([]);
  const [labInput, setLabInput] = useState("");
  const [labConsensus, setLabConsensus] = useState(false);
  const [labTaskType, setLabTaskType] = useState<string>("general");
  const [labActiveTask, setLabActiveTask] = useState<OrchestratorTask | null>(null);
  const [labBiasAlerts, setLabBiasAlerts] = useState<BiasAlert[]>([]);
  const [labAuditLog, setLabAuditLog] = useState<AuditEntry[]>([]);
  const [labLearnings, setLabLearnings] = useState<WorkerLearning[]>([]);
  const [labSubTab, setLabSubTab] = useState<"overview" | "audit" | "learning">("overview");
  const [messageFeedback, setMessageFeedback] = useState<Record<string, "up" | "down">>({});
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: "info" | "warning" | "success"; time: number }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // === Conversation History System ===
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try { return JSON.parse(localStorage.getItem("cascade_conversations") || "[]"); } catch { return []; }
  });
  const [activeConvId, setActiveConvId] = useState<Record<string, string | null>>(() => {
    try { return JSON.parse(localStorage.getItem("cascade_active_conv") || "{}"); } catch { return {}; }
  });
  const [showSidebar, setShowSidebar] = useState<"chat" | "gemini" | "arena" | "lab" | null>(null);
  const [convMessages, setConvMessages] = useState<Record<string, Message[]>>(() => {
    try { return JSON.parse(localStorage.getItem("cascade_conv_messages") || "{}"); } catch { return {}; }
  });
  const [convArenaMessages, setConvArenaMessages] = useState<Record<string, ArenaMessage[]>>(() => {
    try { return JSON.parse(localStorage.getItem("cascade_conv_arena") || "{}"); } catch { return {}; }
  });
  const [convLabTasks, setConvLabTasks] = useState<Record<string, OrchestratorTask[]>>(() => {
    try { return JSON.parse(localStorage.getItem("cascade_conv_lab") || "{}"); } catch { return {}; }
  });

  // Persist conversations to localStorage
  useEffect(() => {
    localStorage.setItem("cascade_conversations", JSON.stringify(conversations));
  }, [conversations]);
  useEffect(() => {
    localStorage.setItem("cascade_active_conv", JSON.stringify(activeConvId));
  }, [activeConvId]);
  useEffect(() => {
    localStorage.setItem("cascade_conv_messages", JSON.stringify(convMessages));
  }, [convMessages]);
  useEffect(() => {
    localStorage.setItem("cascade_conv_arena", JSON.stringify(convArenaMessages));
  }, [convArenaMessages]);
  useEffect(() => {
    localStorage.setItem("cascade_conv_lab", JSON.stringify(convLabTasks));
  }, [convLabTasks]);

  const generateTitle = useCallback((msgs: Message[] | ArenaMessage[], tab: string): string => {
    const first = msgs.find(m => m.role === "user" || (m as ArenaMessage).role === "system");
    if (first) {
      const text = first.content.slice(0, 50);
      return text.length < first.content.length ? text + "..." : text;
    }
    if (tab === "arena") return "Forskningsstudie";
    if (tab === "lab") return "Lab-session";
    if (tab === "gemini") return "Gemini-chatt";
    return "Ny chatt";
  }, []);

  const saveCurrentConversation = useCallback((tab: "chat" | "gemini" | "arena" | "lab") => {
    const currentId = activeConvId[tab];
    if (tab === "chat" && messages.length === 0) return;
    if (tab === "gemini" && geminiMessages.length === 0) return;
    if (tab === "arena" && arenaMessages.length === 0) return;
    if (tab === "lab" && labTasks.length === 0) return;

    const now = Date.now();
    if (currentId) {
      // Update existing conversation
      setConversations(prev => prev.map(c => {
        if (c.id !== currentId) return c;
        const msgs = tab === "chat" ? messages : tab === "gemini" ? geminiMessages : [];
        const aMsgs = tab === "arena" ? arenaMessages : [];
        const lTasks = tab === "lab" ? labTasks : [];
        return {
          ...c,
          updatedAt: now,
          messageCount: tab === "arena" ? aMsgs.length : tab === "lab" ? lTasks.length : msgs.length,
          preview: tab === "arena" ? (aMsgs[aMsgs.length - 1]?.content.slice(0, 80) || "") :
                   tab === "lab" ? (lTasks[0]?.prompt.slice(0, 80) || "") :
                   (msgs[msgs.length - 1]?.content.slice(0, 80) || ""),
          title: c.title === "Ny chatt" || c.title === "Gemini-chatt" || c.title === "Forskningsstudie" || c.title === "Lab-session"
            ? generateTitle(tab === "arena" ? aMsgs : msgs, tab) : c.title,
        };
      }));
      if (tab === "chat" || tab === "gemini") {
        setConvMessages(prev => ({ ...prev, [currentId]: tab === "chat" ? messages : geminiMessages }));
      } else if (tab === "arena") {
        setConvArenaMessages(prev => ({ ...prev, [currentId]: arenaMessages }));
      } else if (tab === "lab") {
        setConvLabTasks(prev => ({ ...prev, [currentId]: labTasks }));
      }
    } else {
      // Create new conversation from current messages
      const id = `conv_${now}_${Math.random().toString(36).slice(2, 8)}`;
      const msgs = tab === "chat" ? messages : tab === "gemini" ? geminiMessages : [];
      const aMsgs = tab === "arena" ? arenaMessages : [];
      const lTasks = tab === "lab" ? labTasks : [];
      const conv: Conversation = {
        id,
        title: generateTitle(tab === "arena" ? aMsgs : msgs, tab),
        tab,
        createdAt: now,
        updatedAt: now,
        messageCount: tab === "arena" ? aMsgs.length : tab === "lab" ? lTasks.length : msgs.length,
        preview: tab === "arena" ? (aMsgs[aMsgs.length - 1]?.content.slice(0, 80) || "") :
                 tab === "lab" ? (lTasks[0]?.prompt.slice(0, 80) || "") :
                 (msgs[msgs.length - 1]?.content.slice(0, 80) || ""),
      };
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(prev => ({ ...prev, [tab]: id }));
      if (tab === "chat" || tab === "gemini") {
        setConvMessages(prev => ({ ...prev, [id]: tab === "chat" ? messages : geminiMessages }));
      } else if (tab === "arena") {
        setConvArenaMessages(prev => ({ ...prev, [id]: arenaMessages }));
      } else if (tab === "lab") {
        setConvLabTasks(prev => ({ ...prev, [id]: labTasks }));
      }
    }
  }, [activeConvId, messages, geminiMessages, arenaMessages, labTasks, generateTitle]);

  const startNewConversation = useCallback((tab: "chat" | "gemini" | "arena" | "lab") => {
    // Save current first
    saveCurrentConversation(tab);
    // Clear current messages
    if (tab === "chat") {
      setMessages([]);
      setStreamingText(null);
      fetch(`${BRIDGE_URL}/api/messages`, { method: "DELETE" }).catch(() => {});
    } else if (tab === "gemini") {
      setGeminiMessages([]);
      setGeminiStream(null);
      fetch(`${BRIDGE_URL}/api/gemini/messages`, { method: "DELETE" }).catch(() => {});
    } else if (tab === "arena") {
      setArenaMessages([]);
      setArenaStatus(null);
      fetch(`${BRIDGE_URL}/api/arena/messages`, { method: "DELETE" }).catch(() => {});
    } else if (tab === "lab") {
      setLabTasks([]);
      setLabActiveTask(null);
    }
    setActiveConvId(prev => ({ ...prev, [tab]: null }));
  }, [saveCurrentConversation]);

  const loadConversation = useCallback((convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    const tab = conv.tab;
    // Save current first
    saveCurrentConversation(tab);
    // Load selected conversation
    if (tab === "chat" || tab === "gemini") {
      const msgs = convMessages[convId] || [];
      if (tab === "chat") {
        setMessages(msgs);
        setStreamingText(null);
      } else {
        setGeminiMessages(msgs);
        setGeminiStream(null);
      }
    } else if (tab === "arena") {
      setArenaMessages(convArenaMessages[convId] || []);
      setArenaStatus(null);
      setArenaRunning(false);
    } else if (tab === "lab") {
      setLabTasks(convLabTasks[convId] || []);
      setLabActiveTask(null);
    }
    setActiveConvId(prev => ({ ...prev, [tab]: convId }));
  }, [conversations, convMessages, convArenaMessages, convLabTasks, saveCurrentConversation]);

  const deleteConversation = useCallback((convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    setConversations(prev => prev.filter(c => c.id !== convId));
    setConvMessages(prev => { const next = { ...prev }; delete next[convId]; return next; });
    setConvArenaMessages(prev => { const next = { ...prev }; delete next[convId]; return next; });
    setConvLabTasks(prev => { const next = { ...prev }; delete next[convId]; return next; });
    if (activeConvId[conv.tab] === convId) {
      setActiveConvId(prev => ({ ...prev, [conv.tab]: null }));
    }
  }, [conversations, activeConvId]);

  // Auto-save conversations when messages change (debounced)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (messages.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => saveCurrentConversation("chat"), 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [messages]);

  useEffect(() => {
    if (geminiMessages.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => saveCurrentConversation("gemini"), 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [geminiMessages]);

  useEffect(() => {
    if (arenaMessages.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => saveCurrentConversation("arena"), 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [arenaMessages]);

  const chatConvs = useMemo(() => conversations.filter(c => c.tab === "chat"), [conversations]);
  const geminiConvs = useMemo(() => conversations.filter(c => c.tab === "gemini"), [conversations]);
  const arenaConvs = useMemo(() => conversations.filter(c => c.tab === "arena"), [conversations]);
  const labConvs = useMemo(() => conversations.filter(c => c.tab === "lab"), [conversations]);
  const tabConversations = useCallback((tab: "chat" | "gemini" | "arena" | "lab") => {
    if (tab === "chat") return chatConvs;
    if (tab === "gemini") return geminiConvs;
    if (tab === "arena") return arenaConvs;
    return labConvs;
  }, [chatConvs, geminiConvs, arenaConvs, labConvs]);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessageFeedback = useCallback((msgId: string, direction: "up" | "down") => {
    setMessageFeedback(prev => ({ ...prev, [msgId]: direction }));
    const rating = direction === "up" ? 5 : 1;
    fetch(`${BRIDGE_URL}/api/self-improve/message-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId, rating, feedback: direction === "up" ? "User liked this response" : "User disliked this response" }),
    }).catch(() => {});
  }, []);

  const addNotification = useCallback((text: string, type: "info" | "warning" | "success" = "info") => {
    setNotifications(prev => [{ id: Date.now().toString(), text, type, time: Date.now() }, ...prev].slice(0, 50));
  }, []);

  const sendToOtherAI = useCallback((content: string, from: "claude" | "gemini") => {
    const prefix = from === "claude" ? "Claude sa följande, vad tycker du?\n\n" : "Gemini sa följande, vad tycker du?\n\n";
    if (from === "claude") {
      sendGeminiMessage(prefix + content);
      setActiveTab("gemini");
    } else {
      sendMessage(prefix + content);
      setActiveTab("chat");
    }
    addNotification(`Skickade till ${from === "claude" ? "Gemini" : "Claude"}`, "info");
  }, []);

  const handleTouchStart = useCallback((e: ReactTouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: ReactTouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.7 || dt > 400) return;
    const tabOrder: Tab[] = ["chat", "gemini", "arena", "lab", "tools", "more"];
    const idx = tabOrder.indexOf(activeTab);
    if (dx < 0 && idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
    if (dx > 0 && idx > 0) setActiveTab(tabOrder[idx - 1]);
  }, [activeTab]);

  const estimatedCost = useMemo(() => {
    return (tokenUsage.inputTokens * 3 + tokenUsage.outputTokens * 15) / 1_000_000;
  }, [tokenUsage.inputTokens, tokenUsage.outputTokens]);

  useEffect(() => {
    const socket = io(BRIDGE_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const MAX_MESSAGES = 200;

    // Throttle helper for high-frequency events
    function throttle<T>(fn: (arg: T) => void, ms: number): (arg: T) => void {
      let last = 0;
      let pending: ReturnType<typeof setTimeout> | null = null;
      let latestArg: T;
      return (arg: T) => {
        latestArg = arg;
        const now = Date.now();
        if (now - last >= ms) {
          last = now;
          fn(arg);
        } else if (!pending) {
          pending = setTimeout(() => {
            last = Date.now();
            pending = null;
            fn(latestArg);
          }, ms - (now - last));
        }
      };
    }

    const throttledStream = throttle((chunk: string) => setStreamingText(chunk), 50);
    const throttledGeminiStream = throttle((chunk: string) => setGeminiStream(chunk), 50);
    const throttledWorkerUpdate = throttle((worker: OrchestratorWorker) => {
      setLabWorkers(prev => prev.map(w => w.id === worker.id ? worker : w));
    }, 200);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("history", (history: Message[]) => {
      setMessages(history.slice(-MAX_MESSAGES));
    });

    socket.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg].slice(-MAX_MESSAGES));
      if (msg.role === "cascade") hapticForEvent("message");
    });

    socket.on("question", (q: PendingQuestion) => {
      setPendingQuestion(q);
      hapticForEvent("question");
    });

    socket.on("agent_status", (status: AgentStatusEvent) => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      if (status.type === "done") {
        hapticForEvent("done");
        statusTimeoutRef.current = setTimeout(() => setAgentStatus(null), 800);
      } else if (status.type === "tool_done") {
        setAgentStatus({ type: "thinking", category: "thinking", timestamp: status.timestamp });
      } else {
        if (status.type === "thinking") hapticForEvent("thinking");
        setAgentStatus(status);
      }
    });

    socket.on("token_usage", (usage: typeof tokenUsage) => {
      setTokenUsage(usage);
      setTokenPulse(true);
      setTimeout(() => setTokenPulse(false), 400);
    });

    socket.on("tunnel_url", (url: string) => {
      setTunnelUrl(url);
    });

    socket.on("agent_stream", throttledStream);

    socket.on("budget_warning", (data: { used: number; budget: number }) => {
      setBudgetWarning(data);
      hapticForEvent("error");
      addNotification(`Token-budget 80% (${Math.round(data.used / 1000)}k / ${Math.round(data.budget / 1000)}k)`, "warning");
    });

    // Gemini events
    socket.on("gemini_history", (history: Message[]) => {
      setGeminiMessages(history.slice(-MAX_MESSAGES));
    });
    socket.on("gemini_enabled", (enabled: boolean) => {
      setGeminiEnabled(enabled);
    });
    socket.on("gemini_message", (msg: Message) => {
      setGeminiMessages((prev) => [...prev, msg].slice(-MAX_MESSAGES));
      setGeminiThinking(false);
      setGeminiStream(null);
    });
    socket.on("gemini_stream", throttledGeminiStream);
    socket.on("gemini_status", (status: { type: string }) => {
      if (status.type === "thinking") setGeminiThinking(true);
      if (status.type === "done") { setGeminiThinking(false); setGeminiStream(null); }
    });
    socket.on("gemini_tokens", (tokens: typeof geminiTokens) => {
      setGeminiTokens(tokens);
    });

    // Arena events
    socket.on("arena_history", (msgs: ArenaMessage[]) => setArenaMessages(msgs));
    socket.on("arena_running", (running: boolean) => setArenaRunning(running));
    socket.on("arena_message", (msg: ArenaMessage) => setArenaMessages((prev) => [...prev, msg]));
    socket.on("arena_status", (status: ArenaStatus) => {
      setArenaStatus(status);
      if (status.done) setArenaRunning(false);
    });
    socket.on("arena_vote", (data: { messageId: string; votes: { up: number; down: number } }) => {
      setArenaMessages((prev) => prev.map(m => m.id === data.messageId ? { ...m, votes: data.votes } : m));
    });
    socket.on("sandbox_execution", (data: { sessionId: string; execution: SandboxExecution }) => {
      setSandboxExecutions((prev) => [...prev, data.execution]);
    });
    socket.on("arena_memories", (mems: SharedMemoryItem[]) => {
      setSharedMemories((prev) => [...mems, ...prev]);
    });
    socket.on("shared_memories", (mems: SharedMemoryItem[]) => setSharedMemories(mems));

    // Orchestrator events
    socket.on("orchestrator_task", (task: OrchestratorTask) => {
      setLabTasks(prev => {
        const idx = prev.findIndex(t => t.id === task.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = task; return next; }
        return [task, ...prev];
      });
      setLabActiveTask(prev => prev?.id === task.id ? task : prev);
    });
    socket.on("orchestrator_worker", throttledWorkerUpdate);

    // Fetch current tunnel URL on connect
    fetch(`${BRIDGE_URL}/api/tunnel`)
      .then((r) => r.json())
      .then((d) => { if (d.url) setTunnelUrl(d.url); })
      .catch(() => {});

    return () => {
      socket.disconnect();
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "chat") scrollToBottom();
  }, [messages, scrollToBottom, activeTab]);

  useEffect(() => {
    if (activeTab === "arena") arenaEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [arenaMessages, arenaStatus, activeTab]);

  useEffect(() => {
    if (activeTab === "gemini") geminiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [geminiMessages, geminiThinking, activeTab]);

  const formattedTokens = useMemo(() => {
    const t = tokenUsage.totalTokens;
    if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`;
    if (t >= 1_000) return `${(t / 1_000).toFixed(1)}k`;
    return String(t);
  }, [tokenUsage.totalTokens]);

  // L: Handle PWA shortcuts & share target URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const tab = params.get("tab");
    const sharedText = params.get("text");
    const sharedUrl = params.get("url");
    const sharedTitle = params.get("title");

    if (tab) {
      const validTabs: Tab[] = ["chat", "gemini", "arena", "lab", "tools", "settings", "more"];
      if (validTabs.includes(tab as Tab)) setActiveTab(tab as Tab);
    }

    if (action === "ask") {
      setActiveTab("chat");
      // Focus input after render
      setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 300);
    } else if (action === "screenshot") {
      setActiveTab("chat");
      setTimeout(() => sendMessage("Ta en screenshot och beskriv vad du ser"), 500);
    } else if (action === "search") {
      setActiveTab("chat");
      setTimeout(() => document.querySelector<HTMLTextAreaElement>("textarea")?.focus(), 300);
    } else if (action === "share") {
      // Received shared content from another app (Siri Shortcuts, etc)
      setActiveTab("chat");
      const parts = [sharedTitle, sharedText, sharedUrl].filter(Boolean);
      if (parts.length > 0) {
        const combined = parts.join("\n");
        setTimeout(() => {
          setInput(combined);
          sendMessage(combined);
        }, 500);
      }
    }

    // Clean URL params after handling
    if (action || tab) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // L: Cache conversations for offline reading
  useEffect(() => {
    if (messages.length > 0) {
      cacheConversations(messages);
    }
  }, [messages]);

  // L: Flush offline queue when reconnecting
  useEffect(() => {
    if (connected && isOnline) {
      const queue = getOfflineQueue();
      if (queue.length > 0 && socketRef.current) {
        for (const item of queue) {
          socketRef.current.emit("message", { content: item.content });
        }
        clearOfflineQueue();
        addNotification(`${queue.length} offline-meddelande(n) skickade`, "success");
      }
    }
  }, [connected, isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // L: Listen for service worker flush requests
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "FLUSH_OFFLINE_QUEUE") {
        const queue = getOfflineQueue();
        if (queue.length > 0 && socketRef.current) {
          for (const item of queue) {
            socketRef.current.emit("message", { content: item.content });
          }
          clearOfflineQueue();
        }
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  // SLASH_COMMANDS moved to module scope for stable reference

  const clearConversation = async () => {
    try {
      await fetch(`${BRIDGE_URL}/api/messages`, { method: "DELETE" });
      setMessages([]);
      setStreamingText(null);
    } catch { /* ignore */ }
  };

  const sendMessage = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;

    // Handle slash commands
    if (msg === "/clear") {
      clearConversation();
      setInput("");
      setShowSlash(false);
      return;
    }
    const slashMatch = SLASH_COMMANDS.find((s) => msg.startsWith(s.cmd) && s.action && s.action !== "__clear__");
    const finalMsg = slashMatch
      ? (msg.length > slashMatch.cmd.length ? slashMatch.action + ": " + msg.slice(slashMatch.cmd.length).trim() : slashMatch.action)
      : msg;

    // L: Queue message if offline
    if (!socketRef.current?.connected || !isOnline) {
      addToOfflineQueue(finalMsg);
      addNotification("Meddelande köat — skickas när du är online igen", "info");
      if (!text) setInput("");
      setShowSlash(false);
      return;
    }

    socketRef.current.emit("message", { content: finalMsg });
    setStreamingText(null);
    if (!text) {
      setInput("");
      setSendRipple(true);
      setTimeout(() => setSendRipple(false), 500);
    }
    setShowSlash(false);
    setActiveTab("chat");
  };

  const isThinking = agentStatus && agentStatus.type !== "done";

  const answerQuestion = (response: string) => {
    if (!pendingQuestion || !socketRef.current) return;
    socketRef.current.emit("answer", {
      questionId: pendingQuestion.id,
      response,
    });
    setPendingQuestion(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageIcon = (msg: Message) => {
    switch (msg.type) {
      case "notification":
        return <Bell className="w-4 h-4 text-amber-400" />;
      case "approval_request":
        return <HelpCircle className="w-4 h-4 text-blue-400" />;
      case "approval_response":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const sendGeminiMessage = (text?: string) => {
    const msg = (text || geminiInput).trim();
    if (!msg || !socketRef.current) return;
    if (msg === "/clear") {
      fetch(`${BRIDGE_URL}/api/gemini/messages`, { method: "DELETE" });
      setGeminiMessages([]);
      setGeminiStream(null);
      setGeminiInput("");
      return;
    }
    socketRef.current.emit("gemini_message", { content: msg });
    setGeminiStream(null);
    setGeminiThinking(true);
    if (!text) setGeminiInput("");
    setActiveTab("gemini");
  };

  const formattedGeminiTokens = useMemo(() => {
    const t = geminiTokens.totalTokens;
    if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`;
    if (t >= 1_000) return `${(t / 1_000).toFixed(1)}k`;
    return String(t);
  }, [geminiTokens.totalTokens]);

  const startArena = async (topic?: string, mode: "full" | "quick" = "full") => {
    const t = (topic || arenaInput).trim();
    if (!t) return;
    setArenaInput("");
    setArenaRunning(true);
    setShowMemories(false);
    await fetch(`${BRIDGE_URL}/api/arena/start`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: t, rounds: mode === "quick" ? 4 : 8, mode }),
    });
  };

  const stopArena = () => {
    fetch(`${BRIDGE_URL}/api/arena/stop`, { method: "POST" });
    setArenaRunning(false);
  };

  const clearArena = () => {
    fetch(`${BRIDGE_URL}/api/arena/messages`, { method: "DELETE" });
    setArenaMessages([]);
    setArenaStatus(null);
  };

  const clearSharedMemories = () => {
    fetch(`${BRIDGE_URL}/api/shared-memory`, { method: "DELETE" });
    setSharedMemories([]);
  };

  const voteArenaMessage = (messageId: string, direction: "up" | "down") => {
    fetch(`${BRIDGE_URL}/api/arena/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, direction }),
    });
  };

  const exportArena = () => {
    window.open(`${BRIDGE_URL}/api/arena/export`, "_blank");
  };

  const runSandboxCode = async () => {
    if (!sandboxCode.trim()) return;
    try {
      const resp = await fetch(`${BRIDGE_URL}/api/sandbox/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sandboxCode, language: sandboxLang, agentId: "user", agentName: "User" }),
      });
      const exec = await resp.json();
      setSandboxExecutions((prev) => [...prev, exec]);
    } catch {}
  };

  // Load shared memories on tab switch
  useEffect(() => {
    if (activeTab === "arena") {
      fetch(`${BRIDGE_URL}/api/shared-memory?limit=50`)
        .then(r => r.json())
        .then(setSharedMemories)
        .catch(() => {});
    }
    if (activeTab === "lab") {
      Promise.all([
        fetch(`${BRIDGE_URL}/api/orchestrator/workers`).then(r => r.json()),
        fetch(`${BRIDGE_URL}/api/orchestrator/status`).then(r => r.json()),
        fetch(`${BRIDGE_URL}/api/orchestrator/tasks?limit=20`).then(r => r.json()),
        fetch(`${BRIDGE_URL}/api/orchestrator/bias-alerts`).then(r => r.json()),
        fetch(`${BRIDGE_URL}/api/orchestrator/audit?limit=30`).then(r => r.json()),
        fetch(`${BRIDGE_URL}/api/orchestrator/learnings`).then(r => r.json()),
      ]).then(([workers, stats, tasks, bias, audit, learnings]) => {
        setLabWorkers(workers);
        setLabStats(stats);
        setLabTasks(tasks);
        setLabBiasAlerts(bias);
        setLabAuditLog(audit);
        setLabLearnings(learnings);
      }).catch(() => {});
    }
  }, [activeTab]);

  const submitLabTask = async () => {
    const prompt = labInput.trim();
    if (!prompt) return;
    setLabInput("");
    try {
      const res = await fetch(`${BRIDGE_URL}/api/orchestrator/task`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: labTaskType, prompt, consensus: labConsensus }),
      });
      const task = await res.json();
      setLabActiveTask(task);
    } catch {}
  };

  const toggleWorker = async (id: string, enabled: boolean) => {
    await fetch(`${BRIDGE_URL}/api/orchestrator/workers/${id}/toggle`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    setLabWorkers(prev => prev.map(w => w.id === id ? { ...w, enabled, status: enabled ? "online" : "offline" } : w));
  };

  const resetWorker = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/orchestrator/workers/${id}/reset`, { method: "POST" });
    setLabWorkers(prev => prev.map(w => w.id === id ? { ...w, status: "online", health: { ...w.health, lastError: null, failedRequests: 0 } } : w));
  };

  const [moreTab, setMoreTab] = useState<string>("dashboard");
  const [editorMounted, setEditorMounted] = useState(false);

  // Once editor tab is visited, keep it mounted forever
  useEffect(() => {
    if (activeTab === "more" && moreTab === "editor") setEditorMounted(true);
  }, [activeTab, moreTab]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "chat", label: "Claude", icon: Brain },
    { id: "gemini", label: "Gemini", icon: Zap },
    { id: "frank", label: "Frank", icon: Sparkles },
    { id: "arena", label: "Arena", icon: Swords },
    { id: "lab", label: "Lab", icon: Activity },
    { id: "tools", label: "Verktyg", icon: Wrench },
    { id: "more", label: "Mer", icon: Settings },
  ];

  return (
    <div className="flex flex-col bg-slate-950" style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 glass border-b border-slate-800/50 shrink-0 header-glow" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Gracestack
          </div>
          {tunnelUrl && (
            <button
              onClick={() => setShowTunnel(!showTunnel)}
              className="p-1 rounded-full bg-green-950/60 border border-green-800/50 text-green-400 active:bg-green-900/60"
              title="Tunnel URL"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Cost estimate */}
          {estimatedCost > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/50">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-mono text-green-300">{estimatedCost < 0.01 ? "<0.01" : estimatedCost.toFixed(2)}</span>
            </div>
          )}
          {/* Token counter */}
          {tokenUsage.totalTokens > 0 && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/50 ${tokenPulse ? 'token-update' : ''}`}>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-300">{formattedTokens}</span>
            </div>
          )}
          {/* Notification bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 active:bg-slate-700/60"
            title="Notifikationer"
          >
            <Bell className="w-3.5 h-3.5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>
          {/* Connection status */}
          {connected && isOnline ? (
            <div className="flex items-center gap-1 text-emerald-400 text-xs">
              <Wifi className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <WifiOff className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </header>

      {/* L: Offline banner */}
      {!isOnline && (
        <div className="mx-3 mt-1 px-3 py-2 bg-amber-950/60 border border-amber-800/40 rounded-xl flex items-center gap-2 shrink-0 animate-fade-in-up">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="text-xs text-amber-300 font-medium">Offline-läge</span>
            <span className="text-[10px] text-amber-400/70 ml-2">Du kan läsa cachade konversationer. Meddelanden köas och skickas automatiskt.</span>
          </div>
        </div>
      )}

      {/* L: Reconnected banner */}
      {wasOffline && isOnline && (
        <div className="mx-3 mt-1 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/40 rounded-xl flex items-center gap-2 shrink-0 animate-fade-in-up">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-300">Återansluten!</span>
        </div>
      )}

      {/* L: PWA install prompt */}
      {canInstall && !isInstalled && (
        <div className="mx-3 mt-1 px-3 py-2 bg-indigo-950/60 border border-indigo-800/40 rounded-xl flex items-center gap-2 shrink-0">
          <Monitor className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs text-indigo-300 flex-1">Installera Gracestack som app</span>
          <button onClick={installPwa} className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] rounded-lg active:bg-indigo-700 touch-manipulation">
            Installera
          </button>
        </div>
      )}

      {/* Notification Center */}
      {showNotifications && (
        <div className="mx-3 mt-2 bg-slate-900/95 border border-slate-700/50 rounded-xl overflow-hidden shrink-0 max-h-[40vh] overflow-y-auto animate-fade-in-up">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Notifikationer</span>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <button onClick={() => setNotifications([])} className="text-[10px] text-slate-500 hover:text-red-400">Rensa</button>
              )}
              <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-white" title="Stäng">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">Inga notifikationer</div>
          ) : (
            notifications.slice(0, 20).map(n => (
              <div key={n.id} className={`flex items-start gap-2 px-3 py-2 border-b border-slate-800/50 last:border-0 ${
                n.type === "warning" ? "bg-amber-950/20" : n.type === "success" ? "bg-emerald-950/20" : ""
              }`}>
                <span className="text-sm mt-0.5">{n.type === "warning" ? "⚠️" : n.type === "success" ? "✅" : "ℹ️"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300">{n.text}</p>
                  <p className="text-[10px] text-slate-600">{new Date(n.time).toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tunnel URL banner */}
      {showTunnel && tunnelUrl && (
        <div className="mx-3 mt-2 p-2.5 bg-green-950/60 border border-green-800/50 rounded-xl shrink-0 msg-cascade">
          <div className="flex items-center gap-2">
            <Link className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span className="text-xs text-green-300 font-mono truncate flex-1">{tunnelUrl}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tunnelUrl);
                if (navigator.share) {
                  navigator.share({ title: "Gracestack AI Lab", url: tunnelUrl }).catch(() => {});
                }
              }}
              className="p-1.5 rounded-lg bg-green-900/50 active:bg-green-800/50 text-green-300 touch-manipulation shrink-0"
              title="Kopiera URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-green-600 mt-1">Tryck kopiera för att dela. URL ändras vid omstart.</p>
        </div>
      )}

      {/* Pending question banner */}
      {pendingQuestion && (
        <div className="mx-3 mt-2 p-3 bg-blue-950/80 border border-blue-700 rounded-xl shrink-0">
          <p className="text-blue-200 text-sm font-medium mb-2">
            {pendingQuestion.question}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="Skriv svar..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  answerQuestion((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              onClick={() => answerQuestion("yes")}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 active:bg-emerald-500 text-white text-sm rounded-lg transition-colors touch-manipulation"
            >
              <CheckCircle className="w-4 h-4" />
              Ja
            </button>
            <button
              onClick={() => answerQuestion("no")}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 active:bg-red-500 text-white text-sm rounded-lg transition-colors touch-manipulation"
            >
              <XCircle className="w-4 h-4" />
              Nej
            </button>
          </div>
        </div>
      )}

      {/* Conversation Sidebar Overlay */}
      {showSidebar && (
        <ConversationSidebar
          conversations={tabConversations(showSidebar)}
          activeId={activeConvId[showSidebar] || null}
          tab={showSidebar}
          onSelect={loadConversation}
          onNew={() => startNewConversation(showSidebar)}
          onDelete={deleteConversation}
          onClose={() => setShowSidebar(null)}
        />
      )}

      {/* Tab Content */}
      {activeTab === "chat" && (
        <>
          {/* Chat History Bar */}
          <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-slate-800/30 bg-slate-900/50">
            <button
              onClick={() => setShowSidebar("chat")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
              <span>Historik</span>
              {chatConvs.length > 0 && (
                <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{chatConvs.length}</span>
              )}
            </button>
            <button
              onClick={() => startNewConversation("chat")}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ny chatt</span>
            </button>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4">
                <div className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center empty-icon">
                  <Sparkles className="w-8 h-8 text-blue-400/60" />
                </div>
                <p className="text-lg font-semibold text-slate-200 mb-1">Hej! Vad kan jag hjälpa dig med?</p>
                <p className="text-xs opacity-50 mb-6">Skriv fritt eller välj ett förslag</p>
                <div className="w-full max-w-sm space-y-2">
                  {[
                    { icon: "🔍", text: "Analysera mitt system och föreslå förbättringar" },
                    { icon: "🧠", text: "Bygg en plan för mitt nästa projekt" },
                    { icon: "💡", text: "Utforska lösningar på ett svårt problem" },
                    { icon: "📸", text: "Ta en screenshot och beskriv vad du ser" },
                  ].map((s) => (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 active:bg-slate-700/60 touch-manipulation group suggestion-btn stagger-item"
                    >
                      <span className="mr-2">{s.icon}</span>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${msg.role === "user" ? "msg-user" : "msg-cascade"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : msg.type === "notification"
                        ? "bg-amber-950/60 border border-amber-800 text-amber-100"
                        : msg.type === "approval_request"
                          ? "bg-blue-950/60 border border-blue-800 text-blue-100"
                          : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {getMessageIcon(msg)}
                    <span className="text-xs opacity-60">
                      {msg.role === "cascade" ? "Gracestack" : "Du"} &middot;{" "}
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-code:text-emerald-300 prose-code:bg-transparent prose-a:text-blue-400">
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={markdownCodeComponent}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  {msg.role === "cascade" && msg.type === "message" && (
                    <div className="flex items-center gap-1 mt-1.5 -mb-0.5">
                      <button
                        onClick={() => sendMessageFeedback(msg.id, "up")}
                        className={`p-0.5 rounded transition-colors ${messageFeedback[msg.id] === "up" ? "text-green-400" : "text-slate-500 hover:text-green-400"}`}
                        title="Bra svar"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => sendMessageFeedback(msg.id, "down")}
                        className={`p-0.5 rounded transition-colors ${messageFeedback[msg.id] === "down" ? "text-red-400" : "text-slate-500 hover:text-red-400"}`}
                        title="Dåligt svar"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                      <div className="w-px h-3 bg-slate-700 mx-0.5" />
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="p-0.5 rounded transition-colors text-slate-500 hover:text-slate-300"
                        title="Kopiera"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      {geminiEnabled && (
                        <button
                          onClick={() => sendToOtherAI(msg.content, "claude")}
                          className="p-0.5 rounded transition-colors text-slate-500 hover:text-violet-400"
                          title="Skicka till Gemini"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Streaming preview or typing indicator */}
            {isThinking && (
              <div className="flex justify-start msg-cascade">
                <div className="max-w-[85%] bg-slate-800 rounded-2xl px-4 py-2.5 text-slate-100">
                  {streamingText ? (
                    <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-code:text-emerald-300">
                      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={streamingCodeComponent}>{cleanStreamingText(streamingText)}</ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
                      <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
                      <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Agent Status Bar — always rendered, hidden via CSS to prevent flicker */}
          {(() => {
            const cfg = agentStatus ? (STATUS_CONFIG[agentStatus.category] || STATUS_CONFIG.thinking) : STATUS_CONFIG.thinking;
            const Icon = cfg.icon;
            const toolLabel = agentStatus?.tool
              ? agentStatus.tool.replace(/_/g, " ")
              : "";
            const visible = !!agentStatus;
            return (
              <div
                style={{ display: visible ? 'flex' : 'none' }}
                className={`status-${agentStatus?.category || 'thinking'} shrink-0 mx-3 mb-2 px-4 py-2.5 rounded-xl border ${cfg.bg} items-center gap-3`}
              >
                <div className="relative">
                  <Icon className={`status-icon w-5 h-5 ${cfg.color}`} />
                  {agentStatus?.category === "filesystem" && (
                    <div className="scan-line" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${cfg.color} flex items-center gap-1`}>
                    {cfg.label}
                    {agentStatus?.type === "tool_start" && toolLabel && (
                      <span className="text-xs opacity-60 font-normal truncate">
                        — {toolLabel}
                      </span>
                    )}
                    <span className="status-dots" />
                    {agentStatus?.category === "command" && (
                      <span className="cursor-blink" />
                    )}
                  </div>
                  {agentStatus?.input && (
                    <div className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                      {agentStatus.input.slice(0, 60)}
                    </div>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${cfg.color.replace('text-', 'bg-')} animate-pulse`} />
              </div>
            );
          })()}

          {/* Budget warning */}
          {budgetWarning && (
            <div className="mx-3 mb-1 px-3 py-2 bg-amber-950/60 border border-amber-800/50 rounded-xl text-amber-300 text-xs flex items-center justify-between">
              <span>⚠️ Token-budget 80% ({Math.round(budgetWarning.used / 1000)}k / {Math.round(budgetWarning.budget / 1000)}k)</span>
              <button onClick={() => setBudgetWarning(null)} className="text-amber-500 ml-2" title="Stäng">✕</button>
            </div>
          )}

          {/* Slash commands menu */}
          {showSlash && (
            <div className="mx-3 mb-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              {SLASH_COMMANDS.filter((s) => !input || s.cmd.startsWith(input)).map((s) => (
                <button
                  key={s.cmd}
                  onClick={() => { setInput(s.cmd + " "); setShowSlash(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 active:bg-slate-600 flex items-center gap-2 border-b border-slate-700/50 last:border-0"
                >
                  <span className="text-blue-400 font-mono text-xs">{s.cmd}</span>
                  <span className="text-slate-400 text-xs">{s.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="shrink-0 mx-3 mb-1 grid grid-cols-4 gap-1.5 animate-fade-in-up">
              {[
                { icon: Camera, label: "Screenshot", msg: "Ta en screenshot och beskriv vad du ser", color: "text-cyan-400 bg-cyan-950/40 border-cyan-800/30" },
                { icon: Monitor, label: "System", msg: "Visa systeminfo: CPU, RAM, disk, nätverk", color: "text-violet-400 bg-violet-950/40 border-violet-800/30" },
                { icon: FileText, label: "Filer", msg: "Lista filerna i projektets rot-mapp", color: "text-blue-400 bg-blue-950/40 border-blue-800/30" },
                { icon: Search, label: "Sök", msg: "Sök på nätet efter: ", color: "text-pink-400 bg-pink-950/40 border-pink-800/30" },
                { icon: Brain, label: "Minnen", msg: "Lista alla sparade minnen", color: "text-purple-400 bg-purple-950/40 border-purple-800/30" },
                { icon: FolderSearch, label: "RAG", msg: "Visa RAG-statistik och källor", color: "text-indigo-400 bg-indigo-950/40 border-indigo-800/30" },
                { icon: Terminal, label: "Kommando", msg: "Kör kommandot: ", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/30" },
                { icon: Eye, label: "Skärm", msg: "Ta en screenshot och klicka på ", color: "text-amber-400 bg-amber-950/40 border-amber-800/30" },
              ].map(qa => {
                const QaIcon = qa.icon;
                return (
                  <button
                    key={qa.label}
                    onClick={() => {
                      if (qa.msg.endsWith(": ") || qa.msg.endsWith("på ")) {
                        setInput(qa.msg);
                      } else {
                        sendMessage(qa.msg);
                      }
                      setShowQuickActions(false);
                    }}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-colors active:scale-95 touch-manipulation ${qa.color}`}
                  >
                    <QaIcon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{qa.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 px-3 pb-1 pt-2 bg-slate-950 border-t border-slate-800">
            <div className="flex items-end gap-2">
              <VoiceButton
                onTranscript={(text) => { setInput(text); sendMessage(text); }}
                textToSpeak={messages.length > 0 && messages[messages.length - 1].role === "cascade" ? messages[messages.length - 1].content : null}
              />
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className={`p-3 rounded-2xl border transition-colors touch-manipulation shrink-0 ${showQuickActions ? "bg-blue-950/60 border-blue-700 text-blue-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}
                title="Snabbåtgärder"
              >
                {showQuickActions ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSlash(e.target.value === "/");
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  connected ? "Skriv till Gracestack... ( / för kommandon)" : "Ansluter..."
                }
                disabled={!connected}
                autoComplete="off"
                rows={1}
                className="flex-1 bg-slate-800 text-white rounded-2xl px-4 py-3 text-base border border-slate-700 focus:outline-none focus:border-blue-500 disabled:opacity-50 placeholder:text-slate-500 resize-none overflow-hidden leading-normal"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!connected || !input.trim()}
                className="relative p-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-2xl transition-colors touch-manipulation overflow-hidden shrink-0"
              >
                <Send className="w-5 h-5 relative z-10" />
                {sendRipple && <div className="send-ripple" />}
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "gemini" && (
        <>
          {/* Gemini History Bar */}
          <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-slate-800/30 bg-slate-900/50">
            <button
              onClick={() => setShowSidebar("gemini")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
              <span>Historik</span>
              {geminiConvs.length > 0 && (
                <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{geminiConvs.length}</span>
              )}
            </button>
            <button
              onClick={() => startNewConversation("gemini")}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ny chatt</span>
            </button>
          </div>
          {/* Gemini Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-3">
            {geminiMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4">
                <div className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 border border-violet-500/20 flex items-center justify-center empty-icon">
                  <Zap className="w-8 h-8 text-violet-400/60" />
                </div>
                <p className="text-lg font-semibold text-slate-200 mb-1">Gemini</p>
                <p className="text-xs opacity-50 mb-6">{geminiEnabled ? "Googles AI-modell – ställ en fråga!" : "Sätt GEMINI_API_KEY i bridge/.env"}</p>
                {geminiEnabled && (
                  <div className="w-full max-w-sm space-y-2">
                    {[
                      { icon: "⚡", text: "Jämför din lösning med Claudes svar" },
                      { icon: "🔬", text: "Analysera den här koden och hitta buggar" },
                      { icon: "✍️", text: "Skriv en sammanfattning av mitt projekt" },
                    ].map((s) => (
                      <button
                        key={s.text}
                        onClick={() => sendGeminiMessage(s.text)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 active:bg-slate-700/60 touch-manipulation group suggestion-btn stagger-item"
                      >
                        <span className="mr-2">{s.icon}</span>
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{s.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {geminiMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end msg-user" : "justify-start msg-cascade"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.role === "user" ? <Send className="w-3 h-3 opacity-60" /> : <Zap className="w-3 h-3 text-violet-400" />}
                    <span className="text-xs opacity-60">
                      {msg.role === "cascade" ? "Gemini" : "Du"} &middot; {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-code:text-violet-300 prose-code:bg-transparent prose-a:text-blue-400">
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={markdownCodeComponent}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  {msg.role === "cascade" && (
                    <div className="flex items-center gap-1 mt-1.5 -mb-0.5">
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="p-0.5 rounded transition-colors text-slate-500 hover:text-slate-300"
                        title="Kopiera"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => sendToOtherAI(msg.content, "gemini")}
                        className="p-0.5 rounded transition-colors text-slate-500 hover:text-blue-400"
                        title="Skicka till Claude"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Gemini streaming/thinking */}
            {geminiThinking && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-slate-800 rounded-2xl px-4 py-2.5 text-slate-100">
                  {geminiStream ? (
                    <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-code:text-violet-300">
                      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={streamingCodeComponent}>{cleanStreamingText(geminiStream)}</ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-0.5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
                      <div className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
                      <div className="typing-dot w-2 h-2 rounded-full bg-violet-400" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={geminiEndRef} />
          </div>

          {/* Gemini Input */}
          <div className="shrink-0 px-3 pb-1 pt-2 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendGeminiMessage(); } }}
                placeholder={geminiEnabled ? "Fråga Gemini..." : "GEMINI_API_KEY saknas"}
                disabled={!connected || !geminiEnabled}
                autoComplete="off"
                enterKeyHint="send"
                className="flex-1 bg-slate-800 text-white rounded-2xl px-4 py-3.5 text-base border border-slate-700 focus:outline-none focus:border-violet-500 disabled:opacity-50 placeholder:text-slate-500"
              />
              <button
                onClick={() => sendGeminiMessage()}
                disabled={!connected || !geminiEnabled || !geminiInput.trim()}
                className="relative p-3.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-2xl transition-colors touch-manipulation"
                title="Skicka till Gemini"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {geminiTokens.totalTokens > 0 && (
              <div className="text-center text-[10px] text-slate-600 mt-1">
                Gemini: {formattedGeminiTokens} tokens
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "frank" && (
        <Suspense fallback={<LazyFallback />}>
          <FrankensteinChatView />
        </Suspense>
      )}

      {activeTab === "arena" && (
        <>
          {/* Arena History Bar */}
          <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-slate-800/30 bg-slate-900/50">
            <button
              onClick={() => setShowSidebar("arena")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
              <span>Studier</span>
              {arenaConvs.length > 0 && (
                <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{arenaConvs.length}</span>
              )}
            </button>
            <button
              onClick={() => startNewConversation("arena")}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ny studie</span>
            </button>
          </div>
          {/* Shared Memories Drawer */}
          {showMemories && (
            <div className="shrink-0 max-h-[40vh] overflow-y-auto border-b border-slate-800 bg-slate-900/95 px-3 py-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Delade minnen ({sharedMemories.length})</h3>
                <div className="flex gap-2">
                  {sharedMemories.length > 0 && (
                    <button onClick={clearSharedMemories} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors">Rensa alla</button>
                  )}
                  <button onClick={() => setShowMemories(false)} className="text-[10px] text-slate-500 hover:text-white transition-colors">Stäng</button>
                </div>
              </div>
              {sharedMemories.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Inga minnen ännu. Starta en forskningssession!</p>
              ) : (
                <div className="space-y-1.5">
                  {sharedMemories.map((mem) => (
                    <div key={mem.id} className="flex gap-2 items-start px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
                      <span className="text-sm mt-0.5">{MEMORY_ICONS[mem.type] || "📎"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            mem.author === "claude" ? "bg-blue-900/60 text-blue-300" :
                            mem.author === "gemini" ? "bg-violet-900/60 text-violet-300" :
                            mem.author === "gemini-innovator" ? "bg-emerald-900/60 text-emerald-300" :
                            mem.author === "gemini-verifier" ? "bg-amber-900/60 text-amber-300" :
                            "bg-slate-700/60 text-slate-300"
                          }`}>{ARENA_AGENTS[mem.author]?.label || mem.author}</span>
                          <span className="text-[10px] text-slate-500">{mem.type}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{mem.content.slice(0, 200)}{mem.content.length > 200 ? "..." : ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Arena Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-3">
            {arenaMessages.length === 0 && !arenaRunning && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4">
                <div className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-amber-600/20 to-red-600/20 border border-amber-500/20 flex items-center justify-center empty-icon">
                  <Swords className="w-8 h-8 text-amber-400/60" />
                </div>
                <p className="text-lg font-semibold text-slate-200 mb-1">AI Research Lab</p>
                <p className="text-xs opacity-50 mb-6">4 AI-agenter forskar, debatterar och sparar insikter tillsammans</p>
                <div className="w-full max-w-sm space-y-2">
                  {[
                    { icon: "🔬", text: "Analysera microservices vs monolith" },
                    { icon: "🧠", text: "Hur bygger man en AI-agent från grunden?" },
                    { icon: "🚀", text: "Optimera React-appens prestanda" },
                    { icon: "🔐", text: "Designa ett säkert autentiseringssystem" },
                    { icon: "🧠", text: "Vad är medvetande?" },
                  ].map((s) => (
                    <button
                      key={s.text}
                      onClick={() => startArena(s.text)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 active:bg-slate-700/60 touch-manipulation group suggestion-btn stagger-item"
                    >
                      <span className="mr-2">{s.icon}</span>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{s.text}</span>
                    </button>
                  ))}
                </div>
                {sharedMemories.length > 0 && (
                  <button onClick={() => setShowMemories(true)} className="mt-4 text-xs text-amber-400/70 hover:text-amber-300 transition-colors">
                    💡 {sharedMemories.length} sparade minnen från tidigare sessioner
                  </button>
                )}
              </div>
            )}

            {arenaMessages.map((msg) => {
              const agentCfg = ARENA_AGENTS[msg.role];
              return (
              <div key={msg.id} className={`flex ${msg.role === "system" ? "justify-center arena-msg-center" : agentCfg?.align === "justify-end" ? agentCfg.align + " arena-msg-right" : (agentCfg?.align || "justify-start") + " arena-msg-left"}`}>
                {msg.role === "system" ? (
                  <div className={`px-4 py-2 rounded-full border text-xs ${
                    msg.phase === "summary"
                      ? "bg-amber-950/60 border-amber-700/50 text-amber-300"
                      : "bg-slate-800/60 border-slate-700/50 text-slate-400"
                  }`}>
                    {msg.phase === "summary" ? (
                      <div className="text-left max-w-[85vw] prose prose-invert prose-xs prose-p:my-1">
                        <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <>{msg.content}</>
                    )}
                  </div>
                ) : agentCfg ? (() => {
                  const AgentIcon = agentCfg.icon;
                  return (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${agentCfg.bg} border ${agentCfg.border} ${agentCfg.text}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{agentCfg.emoji}</span>
                      <AgentIcon className={`w-3 h-3 ${agentCfg.text}`} />
                      <span className="text-xs opacity-70 font-medium">
                        {agentCfg.label}
                        {msg.phase && <span className="ml-1 opacity-50">· {msg.phase}</span>}
                        {" · "}{formatTime(msg.timestamp)}
                      </span>
                      {msg.memoryId && <span className="text-[10px] ml-1" title="Sparade minne">💾</span>}
                    </div>
                    <div className={`text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 ${agentCfg.code} prose-code:bg-transparent prose-a:text-blue-400`}>
                      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={markdownCodeComponentNoCopy}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 -mb-0.5">
                      <button
                        onClick={() => voteArenaMessage(msg.id, "up")}
                        className="p-0.5 rounded transition-colors text-slate-500 hover:text-green-400 active:scale-90"
                        title="Bra svar"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => voteArenaMessage(msg.id, "down")}
                        className="p-0.5 rounded transition-colors text-slate-500 hover:text-red-400 active:scale-90"
                        title="Dåligt svar"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                      {msg.votes && (msg.votes.up > 0 || msg.votes.down > 0) && (
                        <span className="text-[10px] text-slate-500">
                          👍{msg.votes.up} 👎{msg.votes.down}
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })() : null}
              </div>
              );
            })}

            {/* Thinking indicator */}
            {arenaRunning && arenaStatus?.thinking && (() => {
              const thinkCfg = ARENA_AGENTS[arenaStatus.thinking];
              if (!thinkCfg) return null;
              const ThinkIcon = thinkCfg.icon;
              return (
              <div className={`flex ${thinkCfg.align}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${thinkCfg.bg} border ${thinkCfg.border}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{thinkCfg.emoji}</span>
                    <ThinkIcon className={`w-3.5 h-3.5 ${thinkCfg.text} animate-pulse`} />
                    <span className="text-xs text-slate-400">
                      {thinkCfg.label} {arenaStatus.phase || "tänker"}... ({arenaStatus.round}/{arenaStatus.maxRounds})
                    </span>
                  </div>
                </div>
              </div>
              );
            })()}
            <div ref={arenaEndRef} />
          </div>

          {/* Arena Controls */}
          <div className="shrink-0 px-3 pb-1 pt-2 bg-slate-950 border-t border-slate-800">
            {arenaRunning ? (
              <div className="flex gap-2">
                <button
                  onClick={stopArena}
                  className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-medium transition-colors touch-manipulation text-sm"
                >
                  ⏹ Stoppa
                </button>
                <button
                  onClick={() => setShowMemories(!showMemories)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors touch-manipulation text-sm"
                  title="Visa minnen"
                >
                  💡 {sharedMemories.length}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={arenaInput}
                    onChange={(e) => setArenaInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); startArena(); } }}
                    placeholder="Ämne att forska om..."
                    autoComplete="off"
                    enterKeyHint="send"
                    className="flex-1 bg-slate-800 text-white rounded-2xl px-4 py-3.5 text-base border border-slate-700 focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
                  />
                  <button
                    onClick={() => startArena(undefined, "full")}
                    disabled={!arenaInput.trim()}
                    className="p-3.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-2xl transition-colors touch-manipulation"
                    title="Full forskning (4 faser)"
                  >
                    <Swords className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {arenaInput.trim() && (
                      <button
                        onClick={() => startArena(undefined, "quick")}
                        className="text-[11px] text-amber-400/70 hover:text-amber-300 transition-colors px-2 py-1 rounded-lg bg-amber-950/30 border border-amber-800/30"
                      >
                        ⚡ Snabb (2 faser)
                      </button>
                    )}
                    {sharedMemories.length > 0 && (
                      <button
                        onClick={() => setShowMemories(!showMemories)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors px-2 py-1"
                      >
                        💡 {sharedMemories.length} minnen
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowSandbox(!showSandbox)} className={`text-[11px] transition-colors ${showSandbox ? "text-emerald-400" : "text-slate-400 hover:text-emerald-300"}`}>
                      🧪 Sandbox
                    </button>
                    {arenaMessages.length > 0 && (
                      <button onClick={exportArena} className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors">
                        📄 Export
                      </button>
                    )}
                    {arenaMessages.length > 0 && (
                      <button onClick={clearArena} className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
                        Rensa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          {/* Sandbox Panel */}
          {showSandbox && (
            <div className="mx-3 mb-3 rounded-xl border border-emerald-800/40 bg-emerald-950/30 overflow-hidden">
              <div className="px-3 py-2 border-b border-emerald-800/30 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-300">🧪 Sandbox — Kör kod direkt</span>
                <div className="flex items-center gap-2">
                  <select
                    value={sandboxLang}
                    onChange={(e) => setSandboxLang(e.target.value)}
                    title="Välj programmeringsspråk"
                    className="text-[10px] bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="shell">Shell</option>
                  </select>
                  <button
                    onClick={runSandboxCode}
                    disabled={!sandboxCode.trim()}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-40 transition-colors"
                  >
                    ▶ Kör
                  </button>
                </div>
              </div>
              <textarea
                value={sandboxCode}
                onChange={(e) => setSandboxCode(e.target.value)}
                placeholder={`// Skriv ${sandboxLang}-kod här...\nconsole.log("Hello Sandbox!");`}
                className="w-full bg-slate-900/80 text-emerald-100 text-xs font-mono p-3 resize-none focus:outline-none"
                rows={5}
                spellCheck={false}
              />
              {sandboxExecutions.length > 0 && (
                <div className="border-t border-emerald-800/30 max-h-48 overflow-y-auto">
                  {sandboxExecutions.slice(-5).reverse().map((exec) => (
                    <div key={exec.id} className={`px-3 py-2 border-b border-slate-800/30 ${exec.status === "success" ? "bg-emerald-950/20" : "bg-red-950/20"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400">
                          {exec.status === "success" ? "✅" : exec.status === "timeout" ? "⏱️" : "❌"} {exec.agentName} — {exec.filename} ({exec.durationMs}ms)
                        </span>
                        <span className="text-[10px] text-slate-500">{exec.language}</span>
                      </div>
                      {exec.stdout && (
                        <pre className="text-[10px] text-emerald-300 bg-slate-900/60 rounded p-1.5 overflow-x-auto whitespace-pre-wrap">{exec.stdout.slice(0, 2000)}</pre>
                      )}
                      {exec.stderr && (
                        <pre className="text-[10px] text-red-400 bg-slate-900/60 rounded p-1.5 mt-1 overflow-x-auto whitespace-pre-wrap">{exec.stderr.slice(0, 2000)}</pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </>
      )}

      {activeTab === "lab" && (
        <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-4">
          {/* Lab History Bar */}
          <div className="flex items-center justify-between -mt-2 -mx-1 mb-1">
            <button
              onClick={() => setShowSidebar("lab")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
              <span>Sessioner</span>
              {labConvs.length > 0 && (
                <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">{labConvs.length}</span>
              )}
            </button>
            <button
              onClick={() => startNewConversation("lab")}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ny session</span>
            </button>
          </div>
          {/* Evaluation Score + Stats Bar */}
          {labStats && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
                <div className={`text-2xl font-bold ${labStats.evaluationScore >= 70 ? "text-green-400" : labStats.evaluationScore >= 40 ? "text-amber-400" : "text-red-400"}`}>
                  {labStats.evaluationScore}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-slate-500 uppercase">System Health</div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full transition-all ${labStats.evaluationScore >= 70 ? "bg-green-500" : labStats.evaluationScore >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${labStats.evaluationScore}%` }} />
                  </div>
                </div>
                {labStats.biasAlerts > 0 && (
                  <div className="text-[10px] px-1.5 py-0.5 rounded bg-orange-900/60 text-orange-300">
                    ⚠ {labStats.biasAlerts} bias
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Tasks", value: labStats.completedTasks, sub: `/${labStats.totalTasks}` },
                  { label: "Latens", value: `${(labStats.avgLatencyMs / 1000).toFixed(1)}s`, sub: "" },
                  { label: "Tokens", value: labStats.totalTokens >= 1000 ? `${(labStats.totalTokens / 1000).toFixed(1)}k` : labStats.totalTokens, sub: "" },
                  { label: "Kostnad", value: `$${labStats.estimatedCostUsd.toFixed(3)}`, sub: "" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-2 py-2 text-center">
                    <div className="text-sm font-semibold text-white">{s.value}<span className="text-slate-500 text-xs">{s.sub}</span></div>
                    <div className="text-[10px] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="flex gap-1 bg-slate-800/40 rounded-lg p-0.5">
            {([["overview", "Översikt"], ["learning", "Learning"], ["audit", "Audit"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setLabSubTab(id)}
                className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors ${labSubTab === id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* === OVERVIEW SUB-TAB === */}
          {labSubTab === "overview" && (
            <>
              {/* Workers Grid */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Workers ({labWorkers.filter(w => w.enabled).length}/{labWorkers.length} aktiva)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {labWorkers.map(w => (
                    <div key={w.id} className={`rounded-xl border p-3 ${w.enabled ? "bg-slate-800/60 border-slate-700/50" : "bg-slate-900/40 border-slate-800/30 opacity-60"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[w.status] || "bg-slate-600"} ${w.status === "busy" ? "animate-pulse" : ""}`} />
                          <span className="text-xs font-semibold text-white">{w.name}</span>
                        </div>
                        <button
                          onClick={() => w.status === "error" ? resetWorker(w.id) : toggleWorker(w.id, !w.enabled)}
                          className={`text-[10px] px-1.5 py-0.5 rounded ${w.status === "error" ? "bg-red-900/60 text-red-300" : "bg-slate-700/60 text-slate-400"}`}
                        >
                          {w.status === "error" ? "Reset" : w.enabled ? "On" : "Off"}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 mb-1">{w.model}</div>
                      <div className="text-[10px] text-slate-400">{ROLE_LABELS[w.role] || w.role}</div>
                      {w.enabled && w.health.totalRequests > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">Framgång</span>
                            <span className={w.health.successRate > 0.9 ? "text-green-400" : w.health.successRate > 0.7 ? "text-amber-400" : "text-red-400"}>
                              {(w.health.successRate * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1">
                            <div className={`h-1 rounded-full ${w.health.successRate > 0.9 ? "bg-green-500" : w.health.successRate > 0.7 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${w.health.successRate * 100}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">Latens</span>
                            <span className="text-slate-300">{(w.health.avgLatencyMs / 1000).toFixed(1)}s</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">Requests</span>
                            <span className="text-slate-300">{w.health.totalRequests}</span>
                          </div>
                          {w.health.lastError && (
                            <div className="text-[10px] text-red-400 truncate" title={w.health.lastError}>⚠ {w.health.lastError.slice(0, 40)}</div>
                          )}
                        </div>
                      )}
                      {!w.enabled && (
                        <div className="mt-2 text-[10px] text-slate-600 italic">Ej konfigurerad</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bias Alerts */}
              {labBiasAlerts.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">⚠ Bias-varningar ({labBiasAlerts.length})</h3>
                  <div className="space-y-1.5">
                    {labBiasAlerts.slice(0, 5).map((alert, i) => (
                      <div key={i} className="bg-orange-950/30 border border-orange-800/40 rounded-lg px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-orange-300 font-medium">Divergens: {(alert.divergenceScore * 100).toFixed(0)}%</span>
                          <span className="text-[10px] text-slate-500">{formatTime(alert.timestamp)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {alert.workers.map(w => `${w.name}: ${w.keyDifference}`).join(" vs ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Task Result */}
              {labActiveTask && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        labActiveTask.status === "completed" ? "bg-green-900/60 text-green-300" :
                        labActiveTask.status === "failed" ? "bg-red-900/60 text-red-300" :
                        labActiveTask.status === "in_progress" || labActiveTask.status === "consensus" ? "bg-amber-900/60 text-amber-300" :
                        "bg-slate-700 text-slate-300"
                      }`}>{labActiveTask.status}</span>
                      <span className="text-[10px] text-slate-500">{labActiveTask.type}</span>
                      {labActiveTask.consensusScore !== null && (
                        <span className="text-[10px] text-amber-400">🎯 {(labActiveTask.consensusScore * 100).toFixed(0)}%</span>
                      )}
                    </div>
                    <button onClick={() => setLabActiveTask(null)} className="text-[10px] text-slate-500 hover:text-white">✕</button>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 line-clamp-2">{labActiveTask.prompt}</p>
                  {labActiveTask.consensusResult && (
                    <div className="prose prose-invert prose-xs max-w-none prose-p:my-1 text-sm">
                      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{labActiveTask.consensusResult}</ReactMarkdown>
                    </div>
                  )}
                  {labActiveTask.results.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <div className="text-[10px] text-slate-500 mb-1">Individuella svar ({labActiveTask.results.length}):</div>
                      {labActiveTask.results.map((r, i) => (
                        <div key={i} className="text-[10px] text-slate-400 mb-1">
                          <span className="font-medium text-slate-300">{r.workerName}</span>
                          <span className="text-slate-600 ml-1">{(r.latencyMs / 1000).toFixed(1)}s · {r.tokens} tokens · {(r.confidence * 100).toFixed(0)}% conf</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Task History */}
              {labTasks.length > 0 && !labActiveTask && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senaste uppgifter</h3>
                  <div className="space-y-1.5">
                    {labTasks.slice(0, 10).map(task => (
                      <button
                        key={task.id}
                        onClick={() => setLabActiveTask(task)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 truncate flex-1">{task.prompt.slice(0, 60)}{task.prompt.length > 60 ? "..." : ""}</span>
                          <span className={`text-[10px] ml-2 ${task.status === "completed" ? "text-green-400" : task.status === "failed" ? "text-red-400" : "text-amber-400"}`}>
                            {task.status === "completed" ? "✓" : task.status === "failed" ? "✗" : "⏳"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          {task.type} · {task.assignedWorkers.length} workers · {formatTime(task.createdAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {labTasks.length === 0 && !labActiveTask && labWorkers.length > 0 && (
                <div className="text-center py-8">
                  <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 mb-1">Skicka en uppgift till AI-teamet</p>
                  <p className="text-xs text-slate-600">Coordinator fördelar arbetet till bästa tillgängliga worker</p>
                </div>
              )}
            </>
          )}

          {/* === LEARNING SUB-TAB === */}
          {labSubTab === "learning" && (
            <>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cross-Worker Learning</h3>
              <p className="text-[10px] text-slate-600 -mt-2">Systemet lär sig vilken worker som presterar bäst per uppgiftstyp</p>
              {labLearnings.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">Ingen data ännu. Kör uppgifter för att bygga upp learning.</div>
              ) : (
                <div className="space-y-2">
                  {labWorkers.filter(w => w.enabled).map(worker => {
                    const wl = labLearnings.filter(l => l.workerId === worker.id);
                    if (wl.length === 0) return null;
                    return (
                      <div key={worker.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[worker.status]}`} />
                          <span className="text-xs font-semibold text-white">{worker.name}</span>
                        </div>
                        <div className="space-y-1.5">
                          {wl.map(l => (
                            <div key={l.taskType} className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400 capitalize">{l.taskType}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-500">{(l.avgLatencyMs / 1000).toFixed(1)}s</span>
                                <span className={l.avgConfidence > 0.7 ? "text-green-400" : "text-amber-400"}>
                                  {(l.avgConfidence * 100).toFixed(0)}% conf
                                </span>
                                <span className="text-slate-500">{l.successCount}✓ {l.failCount}✗</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* === AUDIT SUB-TAB === */}
          {labSubTab === "audit" && (
            <>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Säkerhetsaudit</h3>
              <p className="text-[10px] text-slate-600 -mt-2">Alla LLM-interaktioner loggas för spårbarhet</p>
              {labAuditLog.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">Ingen audit-data ännu.</div>
              ) : (
                <div className="space-y-1">
                  {labAuditLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30 border border-slate-800/50">
                      <span className={`text-[10px] px-1 py-0.5 rounded font-mono shrink-0 ${
                        entry.action === "task_completed" ? "bg-green-900/40 text-green-400" :
                        entry.action === "task_failed" ? "bg-red-900/40 text-red-400" :
                        entry.action === "bias_detected" ? "bg-orange-900/40 text-orange-400" :
                        entry.action === "consensus_run" ? "bg-purple-900/40 text-purple-400" :
                        "bg-slate-700/40 text-slate-400"
                      }`}>{entry.action.replace(/_/g, " ")}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-300">{entry.workerName}</div>
                        {entry.details && <div className="text-[10px] text-slate-500 truncate">{entry.details}</div>}
                      </div>
                      <div className="text-[10px] text-slate-600 shrink-0">{formatTime(entry.timestamp)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "lab" && (
        <div className="shrink-0 px-3 pb-1 pt-2 bg-slate-950 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={labInput}
              onChange={(e) => setLabInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitLabTask(); } }}
              placeholder="Ge en uppgift till AI-teamet..."
              autoComplete="off"
              enterKeyHint="send"
              className="flex-1 bg-slate-800 text-white rounded-2xl px-4 py-3.5 text-base border border-slate-700 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
            <button
              onClick={submitLabTask}
              disabled={!labInput.trim()}
              className="p-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-2xl transition-colors touch-manipulation"
              title="Skicka uppgift"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 px-1">
            <select
              value={labTaskType}
              onChange={(e) => setLabTaskType(e.target.value)}
              title="Uppgiftstyp"
              className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 rounded-lg px-2 py-1"
            >
              <option value="general">Generell</option>
              <option value="analysis">Analys</option>
              <option value="research">Forskning</option>
              <option value="code">Kod</option>
              <option value="review">Granskning</option>
            </select>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={labConsensus}
                onChange={(e) => setLabConsensus(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-0"
              />
              Konsensus (alla workers)
            </label>
          </div>
        </div>
      )}

      {activeTab === "tools" && (
        <Suspense fallback={<LazyFallback />}>
          <ToolsView onRunTool={(msg) => sendMessage(msg)} />
        </Suspense>
      )}

      {activeTab === "more" && (
        <>
          {/* Sub-navigation for More tab */}
          <div className="shrink-0 flex gap-1 px-3 pt-2 pb-1 glass-subtle overflow-x-auto">
            {[
              { id: "dashboard", label: "📊 Dashboard" },
              { id: "computers", label: "🖥️ Datorer" },
              { id: "scheduler", label: "⏰ Schema" },
              { id: "workflows", label: "🔄 Workflows" },
              { id: "chains", label: "⛓️ Chains" },
              { id: "files", label: "📁 Filer" },
              { id: "search", label: "🔍 Sök" },
              { id: "projects", label: "📂 Projekt" },
              { id: "clipboard", label: "📋 Urklipp" },
              { id: "plugins", label: "🧩 Plugins" },
              { id: "network", label: "🧬 Nätverk" },
              { id: "swarm", label: "🍄 Swarm" },
              { id: "frankenstein", label: "🧟 Frankenstein" },
              { id: "researchlab", label: "🔬 Research Lab" },
              { id: "hierarchy", label: "🏗️ Hierarki" },
              { id: "debate", label: "🏛️ Debatt" },
              { id: "editor", label: "💻 Editor" },
              { id: "git", label: "🔀 Git" },
              { id: "install", label: "📦 Installera" },
              { id: "settings", label: "⚙️ Inställningar" },
              { id: "flipper", label: "📡 Flipper Zero" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMoreTab(t.id)}
                className={`shrink-0 text-[11px] px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  moreTab === t.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Suspense fallback={<LazyFallback />}>
            {moreTab === "flipper" && <FlipperZeroView />}
            {moreTab === "dashboard" && <DashboardView />}
            {moreTab === "computers" && <ComputersView />}
            {moreTab === "scheduler" && <SchedulerView />}
            {moreTab === "workflows" && <WorkflowsView />}
            {moreTab === "chains" && <Suspense fallback={<LazyFallback />}><AgentChainsView /></Suspense>}
            {moreTab === "files" && <FilesView />}
            {moreTab === "search" && <SearchView />}
            {moreTab === "projects" && <ProjectsView />}
            {moreTab === "clipboard" && <ClipboardView />}
            {moreTab === "plugins" && <PluginsView />}
            {moreTab === "network" && <NetworkView />}
            {moreTab === "swarm" && <SwarmView />}
            {moreTab === "frankenstein" && <FrankensteinView />}
            {moreTab === "researchlab" && <ResearchLabView />}
            {moreTab === "hierarchy" && <HierarchyView />}
            {moreTab === "debate" && <DebateView />}
            {/* Editor rendered persistently outside More section */}
            {moreTab === "git" && <GitView />}
            {moreTab === "install" && <InstallView />}
            {moreTab === "settings" && <SettingsView />}
          </Suspense>
        </>
      )}

      {/* Persistent Editor — stays mounted once first visited */}
      {editorMounted && (
        <div className={activeTab === "more" && moreTab === "editor" ? "flex-1 flex flex-col overflow-hidden" : "hidden"}>
          <Suspense fallback={<LazyFallback />}>
            <CodeEditorView />
          </Suspense>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav className="shrink-0 flex border-t border-slate-800/50 glass" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 touch-manipulation tab-item ${
                isActive ? "tab-item-active" : "text-slate-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "tab-icon-active" : ""}`} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
