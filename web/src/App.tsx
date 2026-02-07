import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ToolsView from "./components/ToolsView";
import SettingsView from "./components/SettingsView";

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

const BRIDGE_URL =
  import.meta.env.VITE_BRIDGE_URL ||
  (window.location.port === "5173"
    ? `${window.location.protocol}//${window.location.hostname}:3031`
    : window.location.origin);

type Tab = "chat" | "gemini" | "arena" | "lab" | "tools" | "settings";

interface ArenaMessage {
  id: string;
  role: "claude" | "gemini" | "system";
  content: string;
  timestamp: string;
  phase?: string;
  memoryId?: string;
}

interface ArenaStatus {
  thinking: "claude" | "gemini" | null;
  round: number;
  maxRounds: number;
  phase?: string;
  done?: boolean;
}

interface SharedMemoryItem {
  id: string;
  type: "insight" | "finding" | "decision" | "question" | "todo" | "summary";
  content: string;
  author: "claude" | "gemini" | "both";
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
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const socket = io(BRIDGE_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("history", (history: Message[]) => {
      setMessages(history);
    });

    socket.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("question", (q: PendingQuestion) => {
      setPendingQuestion(q);
      if (navigator.vibrate) navigator.vibrate(200);
    });

    socket.on("agent_status", (status: AgentStatusEvent) => {
      if (status.type === "done") {
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => setAgentStatus(null), 500);
      } else {
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
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

    socket.on("agent_stream", (chunk: string) => {
      setStreamingText(chunk);
    });

    socket.on("budget_warning", (data: { used: number; budget: number }) => {
      setBudgetWarning(data);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    });

    // Gemini events
    socket.on("gemini_history", (history: Message[]) => {
      setGeminiMessages(history);
    });
    socket.on("gemini_enabled", (enabled: boolean) => {
      setGeminiEnabled(enabled);
    });
    socket.on("gemini_message", (msg: Message) => {
      setGeminiMessages((prev) => [...prev, msg]);
      setGeminiThinking(false);
      setGeminiStream(null);
    });
    socket.on("gemini_stream", (chunk: string) => {
      setGeminiStream(chunk);
    });
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
    socket.on("orchestrator_worker", (worker: OrchestratorWorker) => {
      setLabWorkers(prev => prev.map(w => w.id === worker.id ? worker : w));
    });

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

  const SLASH_COMMANDS = [
    { cmd: "/screenshot", desc: "Ta en skärmdump", action: "Ta en screenshot och beskriv vad du ser" },
    { cmd: "/search", desc: "Sök på nätet", action: "" },
    { cmd: "/files", desc: "Lista filer", action: "Lista filerna i projektets rot-mapp" },
    { cmd: "/status", desc: "Systemstatus", action: "Visa systeminfo: CPU, RAM, disk, nätverk" },
    { cmd: "/clear", desc: "Rensa chatten", action: "__clear__" },
    { cmd: "/memory", desc: "Visa minnen", action: "Lista alla sparade minnen" },
    { cmd: "/rag", desc: "Kunskapsbas", action: "Visa RAG-statistik och källor" },
  ];

  const clearConversation = async () => {
    try {
      await fetch(`${BRIDGE_URL}/api/messages`, { method: "DELETE" });
      setMessages([]);
      setStreamingText(null);
    } catch { /* ignore */ }
  };

  const sendMessage = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || !socketRef.current) return;

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

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "chat", label: "Claude", icon: Brain },
    { id: "gemini", label: "Gemini", icon: Zap },
    { id: "arena", label: "Arena", icon: Swords },
    { id: "lab", label: "Lab", icon: Activity },
    { id: "tools", label: "Verktyg", icon: Wrench },
    { id: "settings", label: "Inställningar", icon: Settings },
  ];

  return (
    <div className="flex flex-col bg-slate-950" style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Cascade
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
        <div className="flex items-center gap-3">
          {tokenUsage.totalTokens > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/50 ${tokenPulse ? 'token-update' : ''}`}>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-300">{formattedTokens}</span>
            </div>
          )}
          {connected ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <Wifi className="w-3.5 h-3.5" />
              <span className="animate-pulse-dot">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-400 text-xs">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </header>

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
                  navigator.share({ title: "Cascade Remote", url: tunnelUrl }).catch(() => {});
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

      {/* Tab Content */}
      {activeTab === "chat" && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4">
                <div className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center">
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
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 active:bg-slate-700/60 transition-all touch-manipulation group"
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
                      {msg.role === "cascade" ? "Cascade" : "Du"} &middot;{" "}
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-code:text-emerald-300 prose-code:bg-transparent prose-a:text-blue-400">
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
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
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Streaming preview or typing indicator */}
            {isThinking && (
              <div className="flex justify-start msg-cascade">
                <div className="max-w-[85%] bg-slate-800 rounded-2xl px-4 py-2.5 text-slate-100">
                  {streamingText ? (
                    <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-code:text-emerald-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
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

          {/* Agent Status Bar */}
          {agentStatus && (() => {
            const cfg = STATUS_CONFIG[agentStatus.category] || STATUS_CONFIG.thinking;
            const Icon = cfg.icon;
            const toolLabel = agentStatus.tool
              ? agentStatus.tool.replace(/_/g, " ")
              : "";
            return (
              <div
                className={`status-${agentStatus.category} status-bar-enter status-glow-${agentStatus.category} shrink-0 mx-3 mb-2 px-4 py-2.5 rounded-xl border ${cfg.bg} flex items-center gap-3`}
              >
                <div className="relative">
                  <Icon className={`status-icon w-5 h-5 ${cfg.color}`} />
                  {agentStatus.category === "filesystem" && (
                    <div className="scan-line" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${cfg.color} flex items-center gap-1`}>
                    {cfg.label}
                    {agentStatus.type === "tool_start" && toolLabel && (
                      <span className="text-xs opacity-60 font-normal truncate">
                        — {toolLabel}
                      </span>
                    )}
                    <span className="status-dots" />
                    {agentStatus.category === "command" && (
                      <span className="cursor-blink" />
                    )}
                  </div>
                  {agentStatus.input && (
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

          {/* Input */}
          <div className="shrink-0 px-3 pb-1 pt-2 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSlash(e.target.value === "/");
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  connected ? "Skriv till Cascade... ( / för kommandon)" : "Ansluter..."
                }
                disabled={!connected}
                autoComplete="off"
                enterKeyHint="send"
                className="flex-1 bg-slate-800 text-white rounded-2xl px-4 py-3.5 text-base border border-slate-700 focus:outline-none focus:border-blue-500 disabled:opacity-50 placeholder:text-slate-500"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!connected || !input.trim()}
                className="relative p-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-2xl transition-colors touch-manipulation overflow-hidden"
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
          {/* Gemini Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-3">
            {geminiMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4">
                <div className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 border border-violet-500/20 flex items-center justify-center">
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
                        className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/40 active:bg-slate-700/60 transition-all touch-manipulation group"
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
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
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
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Gemini streaming/thinking */}
            {geminiThinking && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-slate-800 rounded-2xl px-4 py-2.5 text-slate-100">
                  {geminiStream ? (
                    <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-code:text-violet-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{geminiStream}</ReactMarkdown>
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

      {activeTab === "arena" && (
        <>
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
                            "bg-amber-900/60 text-amber-300"
                          }`}>{mem.author}</span>
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
                <div className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-amber-600/20 to-red-600/20 border border-amber-500/20 flex items-center justify-center">
                  <Swords className="w-8 h-8 text-amber-400/60" />
                </div>
                <p className="text-lg font-semibold text-slate-200 mb-1">AI Research Lab</p>
                <p className="text-xs opacity-50 mb-6">Claude & Gemini forskar, löser problem och sparar insikter</p>
                <div className="w-full max-w-sm space-y-2">
                  {[
                    { icon: "🔬", text: "Analysera microservices vs monolith" },
                    { icon: "🧠", text: "Hur bygger man en AI-agent från grunden?" },
                    { icon: "🚀", text: "Optimera React-appens prestanda" },
                    { icon: "🔐", text: "Designa ett säkert autentiseringssystem" },
                    { icon: "�", text: "Vad är medvetande?" },
                  ].map((s) => (
                    <button
                      key={s.text}
                      onClick={() => startArena(s.text)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 active:bg-slate-700/60 transition-all touch-manipulation group"
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

            {arenaMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "system" ? "justify-center" : msg.role === "claude" ? "justify-start" : "justify-end"}`}>
                {msg.role === "system" ? (
                  <div className={`px-4 py-2 rounded-full border text-xs ${
                    msg.phase === "summary"
                      ? "bg-amber-950/60 border-amber-700/50 text-amber-300"
                      : "bg-slate-800/60 border-slate-700/50 text-slate-400"
                  }`}>
                    {msg.phase === "summary" ? (
                      <div className="text-left max-w-[85vw] prose prose-invert prose-xs prose-p:my-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <>{msg.content}</>
                    )}
                  </div>
                ) : (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "claude"
                      ? "bg-blue-950/60 border border-blue-800/50 text-blue-100"
                      : "bg-violet-950/60 border border-violet-800/50 text-violet-100"
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {msg.role === "claude" ? <Brain className="w-3 h-3 text-blue-400" /> : <Zap className="w-3 h-3 text-violet-400" />}
                      <span className="text-xs opacity-70 font-medium">
                        {msg.role === "claude" ? "Claude" : "Gemini"}
                        {msg.phase && <span className="ml-1 opacity-50">· {msg.phase}</span>}
                        {" · "}{formatTime(msg.timestamp)}
                      </span>
                      {msg.memoryId && <span className="text-[10px] ml-1" title="Sparade minne">💾</span>}
                    </div>
                    <div className={`text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 ${
                      msg.role === "claude" ? "prose-code:text-blue-300" : "prose-code:text-violet-300"
                    } prose-code:bg-transparent prose-a:text-blue-400`}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
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
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {arenaRunning && arenaStatus?.thinking && (
              <div className={`flex ${arenaStatus.thinking === "claude" ? "justify-start" : "justify-end"}`}>
                <div className={`rounded-2xl px-4 py-2.5 ${
                  arenaStatus.thinking === "claude"
                    ? "bg-blue-950/60 border border-blue-800/50"
                    : "bg-violet-950/60 border border-violet-800/50"
                }`}>
                  <div className="flex items-center gap-2">
                    {arenaStatus.thinking === "claude" ? <Brain className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> : <Zap className="w-3.5 h-3.5 text-violet-400 animate-pulse" />}
                    <span className="text-xs text-slate-400">
                      {arenaStatus.thinking === "claude" ? "Claude" : "Gemini"} {arenaStatus.phase || "tänker"}... ({arenaStatus.round}/{arenaStatus.maxRounds})
                    </span>
                  </div>
                </div>
              </div>
            )}
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
                  {arenaMessages.length > 0 && (
                    <button onClick={clearArena} className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">
                      Rensa
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "lab" && (
        <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-4">
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{labActiveTask.consensusResult}</ReactMarkdown>
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
        <ToolsView onRunTool={(msg) => sendMessage(msg)} />
      )}

      {activeTab === "settings" && (
        <SettingsView />
      )}

      {/* Bottom Tab Bar */}
      <nav className="shrink-0 flex border-t border-slate-800 bg-slate-900" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors touch-manipulation ${
                isActive ? "text-blue-400" : "text-slate-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
