import { useState, useEffect, useCallback, useRef } from "react";
import { BRIDGE_URL } from "../config";
import { Brain, Zap, Activity, Database, TrendingUp, RefreshCw, Clock, Target, Sparkles, Eye, FlaskConical, BarChart3, Settings, ToggleLeft, ToggleRight, Play, Square, Download, Send, Loader2, MessageSquare, Wrench, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { io, Socket } from "socket.io-client";

interface TrendWindow {
  solve_rate: number;
  first_try_rate: number;
  avg_time_ms: number;
  count: number;
}

interface FrankensteinProgress {
  running: boolean;
  last_update_age_seconds: number;
  error?: string;
  total_tasks_attempted: number;
  total_tasks_solved: number;
  current_difficulty: number;
  session_count: number;
  total_training_seconds: number;
  best_streak: number;
  current_streak: number;
  first_try_solves?: number;
  retry_solves?: number;
  total_solve_time_ms?: number;
  skills: Record<string, { pattern: string; success_rate: number; times_used: number; task_ids: string[] }>;
  level_stats: Record<string, { attempted: number; solved: number }>;
  category_stats?: Record<string, { attempted: number; solved: number; first_try: number; total_time_ms: number; solve_rate?: number; avg_time_ms?: number }>;
  history: { id: string; score: number; difficulty: number; timestamp: number; time_ms?: number; attempts?: number; first_try?: boolean; strategy?: string; category?: string; gut_valence?: number; gut_rec?: string }[];
  stack?: {
    hdc_concepts: number;
    aif_exploration: number;
    aif_surprise: number;
    memory_active: number;
    memory_stored: number;
    memory_decayed: number;
    error_counts?: Record<string, number>;
    strategy_success_rates?: Record<string, number>;
    strategy_stats?: Record<string, { attempts: number; successes: number }>;
    gut_feeling?: {
      total_predictions: number;
      accuracy: number;
      weights: Record<string, number>;
      category_records: Record<string, string>;
      difficulty_records: Record<string, string>;
      history_size: number;
    };
    llm_stats?: {
      calls: number;
      successes: number;
      failures: number;
      rate_limits: number;
      timeouts: number;
      empty_responses: number;
      retries: number;
      avg_latency_ms: number;
      success_rate: number;
    };
    emotions?: {
      state: Record<string, number>;
      dominant: string;
      dominant_intensity: number;
      emoji: string;
      valence: number;
      arousal: number;
      total_updates: number;
      emotion_totals: Record<string, number>;
      recent_events: Array<{ trigger: string; emotion: string; delta: number; detail: string }>;
      behavioral_modifiers: {
        temperature_mod: number;
        extra_attempts: number;
        strategy_preference: string | null;
        exploration_mod: number;
        persistence_mod: number;
        prompt_tone: string;
        dominant_emotion: string;
        dominant_intensity: number;
        valence: number;
        arousal: number;
      };
    };
  };
  terminal_stats?: {
    total_tasks: number;
    total_solved: number;
    solve_rate: number;
    categories_learned: string[];
    known_patterns: number;
  };
  v2_stats?: {
    attempted: number;
    solved: number;
  };
  chaos_stats?: {
    attempted: number;
    solved: number;
  };
  trends?: {
    last_10?: TrendWindow;
    last_50?: TrendWindow;
    last_100?: TrendWindow;
    per_level?: Record<string, TrendWindow>;
    per_category?: Record<string, { attempted: number; solved: number; first_try: number; total_time_ms: number; solve_rate: number; avg_time_ms: number }>;
  };
  started_at?: string;
  last_saved?: string;
}

interface LogData {
  lines: string[];
}

interface ModuleConfig {
  enabled: boolean;
  label: string;
  description: string;
}

interface FrankConfig {
  modules: Record<string, ModuleConfig>;
}

interface ABTestData {
  available: boolean;
  timestamp?: string;
  num_tasks?: number;
  num_runs?: number;
  total_tasks?: number;
  frankenstein?: { solved: number; total: number; solve_rate: number; first_try_rate: number; avg_time_ms: number };
  bare_llm?: { solved: number; total: number; solve_rate: number; first_try_rate: number; avg_time_ms: number };
  difference?: { solve_rate: number; first_try_rate: number; winner: string };
  per_level?: Record<string, { frankenstein: { solved: number; total: number; rate: number }; bare_llm: { solved: number; total: number; rate: number } }>;
  runs?: { timestamp: string; num_tasks: number; frank_rate: number; bare_rate: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-400 w-10 text-right">{pct}%</span>
    </div>
  );
}

function StackGauge({ label, value, max, unit, color, icon: Icon }: { label: string; value: number; max: number; unit: string; color: string; icon: React.ElementType }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-[11px] text-slate-400">{label}</span>
        </div>
        <span className="text-[12px] font-mono text-white">{typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(2)) : value}{unit}</span>
      </div>
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniChart({ data, height = 40, color = "#22c55e" }: { data: number[]; height?: number; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const fillPoints = `0,${height} ${points} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <polyline points={fillPoints} fill={color} fillOpacity="0.15" stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function FrankensteinView() {
  const [progress, setProgress] = useState<FrankensteinProgress | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [abTest, setAbTest] = useState<ABTestData | null>(null);
  const [config, setConfig] = useState<FrankConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "charts" | "brain" | "abtest" | "swarm" | "terminal" | "chat">("overview");
  const [abLive, setAbLive] = useState<{
    active: boolean;
    events: { type: string; task_num?: number; total_tasks?: number; frank_score?: number; bare_score?: number; frank_solved?: number; bare_solved?: number; difficulty?: number; title?: string; output?: any }[];
    result?: any;
    module_config?: Record<string, boolean>;
    num_tasks?: number;
  } | null>(null);
  const [abModules, setAbModules] = useState<Record<string, boolean>>({
    hdc: true, aif: true, ebbinghaus: true, gut_feeling: true, emotions: true, stm: true,
  });
  const [abNumTasks, setAbNumTasks] = useState(30);
  const [swarmLive, setSwarmLive] = useState<{
    active: boolean;
    events: any[];
    result?: any;
    num_tasks?: number;
  } | null>(null);
  const [swarmNumTasks, setSwarmNumTasks] = useState(20);
  const [termLive, setTermLive] = useState<{
    active: boolean;
    events: any[];
    current_task: any | null;
    last_update: number;
    event_count: number;
  } | null>(null);
  const [trainRunning, setTrainRunning] = useState(false);
  const [trainStarting, setTrainStarting] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ id: string; role: "user" | "cascade"; content: string; timestamp: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatThinking, setChatThinking] = useState(false);
  const [chatStream, setChatStream] = useState("");
  const [chatStatus, setChatStatus] = useState<{ type: string; tool?: string } | null>(null);
  const chatSocketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const REMARK_PLUGINS = [remarkGfm];

  const startTraining = async () => {
    setTrainStarting(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/frankenstein/train/start`, { method: "POST" });
      if (res.ok) setTrainRunning(true);
    } catch { /* ignore */ }
    setTrainStarting(false);
  };

  const stopTraining = async () => {
    try {
      await fetch(`${BRIDGE_URL}/api/frankenstein/train/stop`, { method: "POST" });
      setTrainRunning(false);
    } catch { /* ignore */ }
  };

  // Chat socket setup
  useEffect(() => {
    if (activeTab !== "chat") return;

    // Load existing messages
    fetch(`${BRIDGE_URL}/api/frankenstein/chat/messages`)
      .then(r => r.json())
      .then(setChatMessages)
      .catch(() => {});

    const socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
    chatSocketRef.current = socket;

    socket.on("frank_message", (msg: { id: string; role: "user" | "cascade"; content: string; timestamp: string }) => {
      setChatMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.role === "cascade") {
        setChatThinking(false);
        setChatStream("");
        setChatStatus(null);
      }
    });
    socket.on("frank_stream", (data: { content: string }) => setChatStream(data.content));
    socket.on("frank_status", (s: { type: string; tool?: string }) => {
      setChatStatus(s);
      if (s.type === "thinking") setChatThinking(true);
      if (s.type === "done") { setChatThinking(false); setChatStatus(null); }
    });
    socket.on("frank_cleared", () => { setChatMessages([]); setChatStream(""); });

    return () => { socket.disconnect(); chatSocketRef.current = null; };
  }, [activeTab]);

  // Chat auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatStream]);

  const sendChatMessage = () => {
    const text = chatInput.trim();
    if (!text || chatThinking) return;
    setChatInput("");
    setChatThinking(true);
    setChatStream("");
    chatSocketRef.current?.emit("frank_message", { content: text });
    if (chatInputRef.current) chatInputRef.current.style.height = "auto";
  };

  const clearChatMessages = () => {
    chatSocketRef.current?.emit("frank_clear");
    setChatMessages([]);
    setChatStream("");
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  };

  const handleChatInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const fetchProgress = useCallback(async () => {
    try {
      const [pRes, lRes, abRes, cRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/frankenstein/progress`),
        fetch(`${BRIDGE_URL}/api/frankenstein/log`),
        fetch(`${BRIDGE_URL}/api/frankenstein/ab-test`),
        fetch(`${BRIDGE_URL}/api/frankenstein/config`),
      ]);
      if (pRes.ok) {
        const data: FrankensteinProgress = await pRes.json();
        setProgress(data);
      }
      if (lRes.ok) {
        const data: LogData = await lRes.json();
        setLog(data.lines || []);
      }
      if (abRes.ok) {
        const data: ABTestData = await abRes.json();
        setAbTest(data);
      }
      if (cRes.ok) {
        const data: FrankConfig = await cRes.json();
        setConfig(data);
      }
      // Check training process status
      try {
        const tRes = await fetch(`${BRIDGE_URL}/api/frankenstein/train/status`);
        if (tRes.ok) {
          const tData = await tRes.json();
          setTrainRunning(tData.running);
        }
      } catch { /* ignore */ }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchProgress, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchProgress]);

  // Poll Terminal live status when on terminal tab
  useEffect(() => {
    if (activeTab !== "terminal") return;
    const poll = async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/frankenstein/terminal/live`);
        if (res.ok) setTermLive(await res.json());
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Poll Swarm status when on swarm tab
  useEffect(() => {
    if (activeTab !== "swarm") return;
    const poll = async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/frankenstein/swarm/status`);
        if (res.ok) setSwarmLive(await res.json());
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Poll A/B test status when on abtest tab
  useEffect(() => {
    if (activeTab !== "abtest") return;
    const poll = async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/frankenstein/ab-test/status`);
        if (res.ok) setAbLive(await res.json());
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const startSwarm = async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/frankenstein/swarm/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_tasks: swarmNumTasks }),
      });
      if (res.ok) {
        setSwarmLive({ active: true, events: [], num_tasks: swarmNumTasks });
      }
    } catch { /* ignore */ }
  };

  const stopSwarm = async () => {
    try {
      await fetch(`${BRIDGE_URL}/api/frankenstein/swarm/stop`, { method: "POST" });
      setSwarmLive(prev => prev ? { ...prev, active: false } : null);
    } catch { /* ignore */ }
  };

  const startAbTest = async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/frankenstein/ab-test/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_tasks: abNumTasks, modules: abModules }),
      });
      if (res.ok) {
        const data = await res.json();
        setAbLive({ active: true, events: [], module_config: data.modules, num_tasks: data.num_tasks });
      }
    } catch { /* ignore */ }
  };

  const stopAbTest = async () => {
    try {
      await fetch(`${BRIDGE_URL}/api/frankenstein/ab-test/stop`, { method: "POST" });
      setAbLive(prev => prev ? { ...prev, active: false } : null);
    } catch { /* ignore */ }
  };

  const toggleModule = async (moduleKey: string) => {
    if (!config) return;
    const current = config.modules[moduleKey]?.enabled ?? true;
    const updated = { modules: { [moduleKey]: { enabled: !current } } };
    try {
      const res = await fetch(`${BRIDGE_URL}/api/frankenstein/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data: FrankConfig = await res.json();
        setConfig(data);
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!progress || progress.error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <Brain className="w-14 h-14 text-purple-500/60" />
        <p className="text-slate-400 text-sm text-center">Frankenstein AI har inte startats.</p>
        {trainRunning ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-green-400 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Träning körs — väntar på data...
            </div>
            <button
              onClick={stopTraining}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/60 hover:bg-red-900/80 text-red-300 rounded-lg text-sm font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              Stoppa träning
            </button>
          </div>
        ) : (
          <button
            onClick={startTraining}
            disabled={trainStarting}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-900/60 hover:bg-purple-900/80 text-purple-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {trainStarting ? (
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {trainStarting ? "Startar..." : "Starta träning"}
          </button>
        )}
      </div>
    );
  }

  const p = progress;
  const solveRate = p.total_tasks_attempted > 0 ? p.total_tasks_solved / p.total_tasks_attempted : 0;
  // total_solve_time_ms is the reliable cumulative time; total_training_seconds only tracks per-session
  const totalSolveHours = (p.total_solve_time_ms || 0) / 3600000;
  // Wall-clock time from started_at to last_saved
  const wallHours = p.started_at && p.last_saved
    ? (new Date(p.last_saved).getTime() - new Date(p.started_at).getTime()) / 3600000
    : 0;
  const totalHours = wallHours > totalSolveHours ? wallHours : totalSolveHours;
  const stack = p.stack || { hdc_concepts: 0, aif_exploration: 0, aif_surprise: 0, memory_active: 0, memory_stored: 0, memory_decayed: 0 };
  const skillCount = Object.keys(p.skills || {}).length;
  const firstTryRate = p.total_tasks_solved ? (p.first_try_solves || 0) / p.total_tasks_solved : 0;
  const avgSolveMs = p.total_tasks_solved ? (p.total_solve_time_ms || 0) / p.total_tasks_solved : 0;
  const trends = p.trends || {};
  const recent = (p.history || []).slice(-20);
  const recentSolveRate = recent.length > 0 ? recent.filter(h => h.score >= 1).length / recent.length : 0;

  return (
    <div className={`flex-1 flex flex-col gap-3 p-3 min-h-0 ${activeTab === "chat" ? "overflow-hidden" : "overflow-y-auto"}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Frankenstein AI</h2>
          {p.running ? (
            <span className="flex items-center gap-1 text-[10px] bg-green-900/60 text-green-400 px-2 py-0.5 rounded-full border border-green-700/50">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Kör
            </span>
          ) : (
            <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">Stoppad</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1.5 rounded-lg transition-colors ${autoRefresh ? "bg-purple-900/40 text-purple-400" : "text-slate-500 hover:text-slate-300"}`}
            title={autoRefresh ? "Auto-refresh PÅ" : "Auto-refresh AV"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : {}} />
          </button>
          <button onClick={fetchProgress} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors" title="Uppdatera nu">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-lg transition-colors ${showConfig ? "bg-amber-900/40 text-amber-400" : "text-slate-500 hover:text-slate-300"}`}
            title="Modul-inställningar"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <a
            href={`${BRIDGE_URL}/api/download/app-summary`}
            download
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 transition-colors"
            title="Ladda ner sammanfattning (.md)"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          <a
            href={`${BRIDGE_URL}/api/download/frankenstein-data`}
            download
            className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 transition-colors"
            title="Ladda ner all data (.json)"
          >
            <Database className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Module Config Panel */}
      {showConfig && config && (
        <div className="bg-slate-800/80 border border-amber-700/30 rounded-xl p-3">
          <h3 className="text-[12px] font-bold text-amber-300 mb-2 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" />
            Kognitiva Moduler
            <span className="text-[9px] text-slate-500 font-normal">Ändringar appliceras nästa uppgift</span>
          </h3>
          <div className="flex flex-col gap-1.5">
            {Object.entries(config.modules).map(([key, mod]) => (
              <button
                key={key}
                onClick={() => toggleModule(key)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                  mod.enabled
                    ? "bg-slate-700/40 hover:bg-slate-700/60"
                    : "bg-red-900/20 hover:bg-red-900/30 border border-red-800/30"
                }`}
              >
                {mod.enabled ? (
                  <ToggleRight className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-medium ${mod.enabled ? "text-white" : "text-red-300"}`}>
                    {mod.label}
                  </div>
                  <div className="text-[9px] text-slate-500 truncate">{mod.description}</div>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  mod.enabled ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"
                }`}>
                  {mod.enabled ? "PÅ" : "AV"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Stats Grid — hidden in chat mode */}
      {activeTab !== "chat" && <>
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={Target} label="Lösta" value={p.total_tasks_solved} sub={`av ${p.total_tasks_attempted} (${Math.round(solveRate * 100)}%)`} color="text-green-400" />
        <StatCard icon={TrendingUp} label="Svårighet" value={p.current_difficulty} sub={`Streak: ${p.current_streak} (bäst: ${p.best_streak})`} color="text-amber-400" />
        <StatCard icon={Sparkles} label="First-try" value={`${Math.round(firstTryRate * 100)}%`} sub={`${p.first_try_solves || 0} av ${p.total_tasks_solved} lösta`} color="text-purple-400" />
        <StatCard icon={Clock} label="Snitt tid" value={avgSolveMs > 0 ? `${(avgSolveMs / 1000).toFixed(1)}s` : "—"} sub={`${totalHours < 1 ? `${Math.round(totalHours * 60)}min` : `${totalHours.toFixed(1)}h`} totalt`} color="text-blue-400" />
      </div>

      {/* Rolling Trends */}
      {(trends.last_10 || trends.last_50 || trends.last_100) && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <h3 className="text-[12px] font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Rullande trender
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {([['last_10', '10'], ['last_50', '50'], ['last_100', '100']] as const).map(([key, label]) => {
              const t = trends[key];
              if (!t || !t.count) return null;
              return (
                <div key={key} className="bg-slate-900/40 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-slate-500 mb-1">Senaste {label}</div>
                  <div className={`text-sm font-bold ${t.solve_rate >= 0.7 ? 'text-green-400' : t.solve_rate >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                    {Math.round(t.solve_rate * 100)}%
                  </div>
                  <div className="text-[9px] text-slate-500">FT: {Math.round(t.first_try_rate * 100)}% · {Math.round(t.avg_time_ms)}ms</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Frankenstein Stack Panel */}
      <div className="bg-gradient-to-br from-purple-950/40 to-slate-800/40 border border-purple-800/30 rounded-xl p-3">
        <h3 className="text-[12px] font-bold text-purple-300 mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          FRANKENSTEIN STACK
        </h3>
        <div className="flex flex-col gap-2">
          <StackGauge icon={Brain} label="HDC Koncept" value={stack.hdc_concepts} max={100} unit="" color="text-cyan-400" />
          <StackGauge icon={Eye} label="AIF Exploration" value={stack.aif_exploration} max={1} unit="" color="text-amber-400" />
          <StackGauge icon={Activity} label="AIF Surprise" value={stack.aif_surprise} max={5} unit="" color="text-rose-400" />
          <StackGauge icon={Database} label="Ebbinghaus Minnen" value={stack.memory_active} max={Math.max(stack.memory_stored, 1)} unit={` / ${stack.memory_stored}`} color="text-emerald-400" />
          {stack.memory_decayed > 0 && (
            <div className="text-[10px] text-slate-500 pl-5">
              {stack.memory_decayed} svaga minnen glömda
            </div>
          )}
          {/* LLM Stats — kompakt i stackpanelen */}
          {stack.llm_stats && stack.llm_stats.calls > 0 && (
            <div className="mt-2 pt-2 border-t border-purple-800/20">
              <div className="text-[9px] text-purple-400/60 mb-1">LLM (Gemini 2.0 Flash)</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                <span className="text-slate-400">{stack.llm_stats.calls} anrop</span>
                <span className={stack.llm_stats.success_rate >= 0.95 ? "text-green-400" : stack.llm_stats.success_rate >= 0.8 ? "text-amber-400" : "text-red-400"}>
                  {(stack.llm_stats.success_rate * 100).toFixed(0)}% ok
                </span>
                <span className="text-slate-500">{Math.round(stack.llm_stats.avg_latency_ms)}ms snitt</span>
                {stack.llm_stats.rate_limits > 0 && <span className="text-amber-500">⚡{stack.llm_stats.rate_limits} rate</span>}
                {stack.llm_stats.timeouts > 0 && <span className="text-red-500">⏱{stack.llm_stats.timeouts} timeout</span>}
                {stack.llm_stats.retries > 0 && <span className="text-slate-500">↻{stack.llm_stats.retries}</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gut Feeling Panel */}
      {(() => {
        const gf = stack.gut_feeling;
        const recentGut = (p.history || []).slice(-50).filter(h => h.gut_valence !== undefined);
        const gutCorrect = recentGut.filter(h => (h.gut_valence! > 0) === (h.score >= 1.0)).length;
        const gutAcc = recentGut.length > 0 ? gutCorrect / recentGut.length : 0;
        const avgValence = recentGut.length > 0 ? recentGut.reduce((s, h) => s + (h.gut_valence || 0), 0) / recentGut.length : 0;
        const confident = recentGut.filter(h => h.gut_rec === "confident").length;
        const cautious = recentGut.filter(h => h.gut_rec === "cautious").length;
        const uncertain = recentGut.filter(h => h.gut_rec === "uncertain").length;
        const emoji = avgValence > 0.3 ? "😎" : avgValence > 0.1 ? "🙂" : avgValence > -0.1 ? "😐" : avgValence > -0.3 ? "😟" : "😰";
        return (
          <div className="bg-gradient-to-br from-amber-950/30 to-slate-800/40 border border-amber-800/30 rounded-xl p-3">
            <h3 className="text-[12px] font-bold text-amber-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              GUT FEELING {recentGut.length > 0 && <span className="text-[10px] font-normal text-amber-400/60 ml-1">{emoji} snitt {avgValence > 0 ? "+" : ""}{avgValence.toFixed(2)}</span>}
            </h3>
            <div className="flex flex-col gap-1.5">
              {/* Accuracy */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Träffsäkerhet</span>
                <span className={`text-[11px] font-bold ${gutAcc >= 0.7 ? "text-green-400" : gutAcc >= 0.5 ? "text-amber-400" : "text-red-400"}`}>
                  {recentGut.length > 0 ? `${(gutAcc * 100).toFixed(0)}%` : "—"} <span className="text-[9px] text-slate-500 font-normal">({gutCorrect}/{recentGut.length})</span>
                </span>
              </div>
              {/* Recommendation distribution */}
              {recentGut.length > 0 && (
                <div className="flex gap-1">
                  {confident > 0 && <span className="text-[9px] bg-green-900/40 text-green-300 px-1.5 py-0.5 rounded border border-green-700/30">😎 {confident}</span>}
                  {uncertain > 0 && <span className="text-[9px] bg-slate-700/40 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600/30">😐 {uncertain}</span>}
                  {cautious > 0 && <span className="text-[9px] bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded border border-red-700/30">😟 {cautious}</span>}
                </div>
              )}
              {/* Signal weights */}
              {gf?.weights && (
                <div className="mt-1 pt-1 border-t border-slate-700/30">
                  <div className="text-[9px] text-slate-500 mb-1">Signal-vikter (auto-kalibrerade)</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(gf.weights).map(([name, w]) => {
                      const labels: Record<string, string> = { familiarity: "Igenkänning", track_record: "Historik", momentum: "Momentum", complexity: "Komplexitet", memory_strength: "Minne", energy: "Energi" };
                      return (
                        <span key={name} className="text-[8px] bg-slate-700/40 text-slate-400 px-1.5 py-0.5 rounded">
                          {labels[name] || name}: {(w * 100).toFixed(0)}%
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {gf && gf.total_predictions > 0 && (
                <div className="text-[9px] text-slate-500">
                  Totalt: {gf.total_predictions} förutsägelser, {(gf.accuracy * 100).toFixed(0)}% accuracy
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Ekman Emotions Panel */}
      {stack.emotions && stack.emotions.total_updates > 0 && (() => {
        const emo = stack.emotions;
        const emotionLabels: Record<string, string> = {
          joy: "Glädje", sadness: "Sorg", anger: "Ilska",
          fear: "Rädsla", disgust: "Avsky", surprise: "Förvåning",
        };
        const emotionColors: Record<string, string> = {
          joy: "bg-yellow-400", sadness: "bg-blue-400", anger: "bg-red-500",
          fear: "bg-purple-400", disgust: "bg-green-500", surprise: "bg-cyan-400",
        };
        const emotionEmojis: Record<string, string> = {
          joy: "😊", sadness: "😢", anger: "😠",
          fear: "😨", disgust: "🤢", surprise: "😲",
        };
        return (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <h3 className="text-[12px] font-bold text-slate-300 mb-2 flex items-center gap-2">
              <span className="text-lg">{emo.emoji}</span>
              Ekman Emotioner
              <span className="text-[9px] text-slate-500 font-normal ml-auto">
                V:{emo.valence > 0 ? "+" : ""}{emo.valence.toFixed(2)} A:{emo.arousal.toFixed(2)}
              </span>
            </h3>
            {/* Emotion bars */}
            <div className="flex flex-col gap-1">
              {Object.entries(emo.state).map(([name, intensity]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className="text-[10px] w-[52px] shrink-0 text-slate-500">
                    {emotionEmojis[name]} {emotionLabels[name] || name}
                  </span>
                  <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${emotionColors[name] || "bg-slate-400"}`}
                      style={{ width: `${Math.min(intensity * 100, 100)}%`, opacity: Math.max(0.3, intensity) }}
                    />
                  </div>
                  <span className={`text-[9px] w-8 text-right ${intensity > 0.5 ? "text-white font-bold" : "text-slate-500"}`}>
                    {intensity > 0.01 ? (intensity * 100).toFixed(0) + "%" : "—"}
                  </span>
                </div>
              ))}
            </div>
            {/* Behavioral modifiers */}
            {emo.behavioral_modifiers && emo.dominant_intensity > 0.2 && (
              <div className="mt-2 pt-2 border-t border-slate-700/30">
                <div className="text-[9px] text-slate-500 mb-1">Beteendepåverkan</div>
                <div className="flex flex-wrap gap-1">
                  {emo.behavioral_modifiers.temperature_mod !== 0 && (
                    <span className="text-[8px] bg-slate-700/40 text-slate-400 px-1.5 py-0.5 rounded">
                      🌡️ temp {emo.behavioral_modifiers.temperature_mod > 0 ? "+" : ""}{emo.behavioral_modifiers.temperature_mod.toFixed(2)}
                    </span>
                  )}
                  {emo.behavioral_modifiers.extra_attempts > 0 && (
                    <span className="text-[8px] bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded">
                      🔄 +{emo.behavioral_modifiers.extra_attempts} försök
                    </span>
                  )}
                  {emo.behavioral_modifiers.strategy_preference && (
                    <span className="text-[8px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">
                      🎯 {emo.behavioral_modifiers.strategy_preference}
                    </span>
                  )}
                  {emo.behavioral_modifiers.exploration_mod !== 0 && (
                    <span className="text-[8px] bg-cyan-900/40 text-cyan-300 px-1.5 py-0.5 rounded">
                      🧭 explore {emo.behavioral_modifiers.exploration_mod > 0 ? "+" : ""}{emo.behavioral_modifiers.exploration_mod.toFixed(2)}
                    </span>
                  )}
                  {emo.behavioral_modifiers.prompt_tone && (
                    <span className="text-[8px] bg-slate-700/40 text-slate-400 px-1.5 py-0.5 rounded max-w-full truncate">
                      💬 {emo.behavioral_modifiers.prompt_tone.slice(0, 50)}
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* Recent emotion events */}
            {emo.recent_events.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/30">
                <div className="text-[9px] text-slate-500 mb-1">Senaste händelser</div>
                <div className="flex flex-col gap-0.5 max-h-16 overflow-y-auto">
                  {emo.recent_events.slice(-5).reverse().map((ev, i) => (
                    <div key={i} className="text-[8px] text-slate-500 flex gap-1">
                      <span>{emotionEmojis[ev.emotion] || "•"}</span>
                      <span className="text-slate-400">{ev.trigger}</span>
                      <span className={ev.delta > 0 ? "text-amber-400" : "text-slate-600"}>
                        {ev.delta > 0 ? "+" : ""}{ev.delta.toFixed(2)}
                      </span>
                      {ev.detail && <span className="text-slate-600 truncate">{ev.detail}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Level Progress */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
        <h3 className="text-[12px] font-bold text-slate-300 mb-2">Nivåprogression (1-10)</h3>
        <div className="flex flex-col gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => {
            const ls = (p.level_stats || {})[String(lvl)] || { attempted: 0, solved: 0 };
            const labels = ["", "Aritmetik", "Strängar", "Listor", "Dict/Algo", "Sortering", "Datastrukt.", "Grafer", "DP/Kombi", "Graf Adv.", "Expert"];
            const isActive = lvl === p.current_difficulty;
            return (
              <div key={lvl} className={`flex items-center gap-2 ${isActive ? "bg-purple-900/20 rounded px-1 -mx-1" : ""}`}>
                <span className={`text-[10px] w-20 shrink-0 ${isActive ? "text-purple-300 font-bold" : "text-slate-500"}`}>
                  {isActive ? "▸ " : ""}Nv{lvl}: {labels[lvl]}
                </span>
                <ProgressBar
                  value={ls.solved}
                  max={Math.max(ls.attempted, 1)}
                  color={ls.attempted === 0 ? "bg-slate-600" : ls.solved / ls.attempted >= 0.8 ? "bg-green-500" : ls.solved / ls.attempted >= 0.5 ? "bg-amber-500" : "bg-red-500"}
                />
                <span className="text-[10px] text-slate-500 w-12 text-right shrink-0">{ls.solved}/{ls.attempted}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategy Success Rates */}
      {stack.strategy_success_rates && Object.keys(stack.strategy_success_rates).length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <h3 className="text-[12px] font-bold text-slate-300 mb-2">Strategi-framgång</h3>
          <div className="flex flex-col gap-1.5">
            {Object.entries(stack.strategy_stats || {}).map(([name, st]) => {
              const rate = st.attempts > 0 ? st.successes / st.attempts : 0;
              const labels: Record<string, string> = { direct: "Direkt", with_hints: "Med tips", from_memory: "Från minne", step_by_step: "Steg-för-steg" };
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-20 shrink-0">{labels[name] || name}</span>
                  <ProgressBar value={st.successes} max={Math.max(st.attempts, 1)} color={rate >= 0.7 ? "bg-green-500" : rate >= 0.4 ? "bg-amber-500" : "bg-red-500"} />
                  <span className="text-[10px] text-slate-500 w-16 text-right shrink-0">{st.successes}/{st.attempts}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Analysis */}
      {stack.error_counts && Object.values(stack.error_counts).some(v => v > 0) && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <h3 className="text-[12px] font-bold text-slate-300 mb-2">Felanalys</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(stack.error_counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const colors: Record<string, string> = { syntax: "bg-red-900/40 text-red-300 border-red-700/50", logic: "bg-amber-900/40 text-amber-300 border-amber-700/50", timeout: "bg-purple-900/40 text-purple-300 border-purple-700/50", runtime: "bg-orange-900/40 text-orange-300 border-orange-700/50" };
              return (
                <span key={type} className={`text-[10px] px-2 py-1 rounded-lg border ${colors[type] || "bg-slate-700/40 text-slate-300 border-slate-600/50"}`}>
                  {type}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Performance */}
      {trends.per_category && Object.keys(trends.per_category).length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <h3 className="text-[12px] font-bold text-slate-300 mb-2">Kategori-prestanda</h3>
          <div className="flex flex-col gap-1.5">
            {Object.entries(trends.per_category)
              .sort((a, b) => b[1].attempted - a[1].attempted)
              .slice(0, 10)
              .map(([cat, cs]) => {
                const rate = cs.solve_rate;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-24 shrink-0 truncate" title={cat}>{cat}</span>
                    <ProgressBar value={cs.solved} max={Math.max(cs.attempted, 1)} color={rate >= 0.7 ? "bg-green-500" : rate >= 0.4 ? "bg-amber-500" : "bg-red-500"} />
                    <span className="text-[10px] text-slate-500 w-20 text-right shrink-0">
                      {cs.solved}/{cs.attempted} · {Math.round(cs.avg_time_ms)}ms
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      </>}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-800/40 rounded-lg p-0.5">
        {(["overview", "chat", "charts", "brain", "terminal", "abtest", "swarm"] as const).map(tab => {
          const labels = { overview: "Översikt", chat: "💬 Chat", charts: "📈 Grafer", brain: "🧠 Brain", terminal: "🖥️ Terminal", abtest: "🧪 A/B", swarm: "🐝 Swarm" };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-[11px] py-1.5 rounded-md transition-colors font-medium ${
                activeTab === tab ? "bg-purple-900/60 text-purple-300" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* === CHAT TAB === */}
      {activeTab === "chat" && (
        <div className="flex flex-col flex-1 -mx-3 -mb-3 min-h-0">
          {/* Chat header with training summary */}
          <div className="shrink-0 px-3 py-2 border-b border-slate-800/50 bg-slate-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">Chatta med Frankenstein</span>
                {p.running && (
                  <span className="flex items-center gap-1 text-[9px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Träning kör
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>{p.total_tasks_solved}/{p.total_tasks_attempted} lösta ({Math.round(solveRate * 100)}%)</span>
                <span>Lvl {p.current_difficulty}</span>
                <button onClick={clearChatMessages} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Rensa chat">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 h-0">
            {chatMessages.length === 0 && !chatThinking && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <span className="text-3xl mb-2">🧟</span>
                <h3 className="text-sm font-bold text-white mb-1">Prata med Frankenstein</h3>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Frank har realtidskoll på sin träning. Fråga om resultat, strategier, emotioner eller ge instruktioner.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3 max-w-xs justify-center">
                  {["Hur går träningen?", "Vilka strategier funkar bäst?", "Hur mår du?", "Vad har du lärt dig?"].map(q => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-1 rounded-lg hover:bg-purple-900/50 transition-colors border border-purple-700/30"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] min-w-0 rounded-2xl px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-purple-600/30 text-white rounded-br-md"
                    : "bg-slate-800/60 text-slate-100 rounded-bl-md border border-slate-700/30"
                }`}>
                  {msg.role === "cascade" && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[9px]">🧟</span>
                      <span className="text-[9px] text-purple-400 font-medium">Frankenstein</span>
                    </div>
                  )}
                  <div className="text-[12px] leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:my-1.5 prose-headings:my-1.5 prose-headings:text-white prose-li:my-0.5 prose-strong:text-white prose-code:text-purple-300 overflow-hidden [overflow-wrap:anywhere] [&_pre]:overflow-x-auto [&_pre]:text-[10px] [&_code]:break-all [&_pre_code]:break-normal">
                    <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{msg.content}</ReactMarkdown>
                  </div>
                  <div className="text-[8px] text-slate-600 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming / thinking */}
            {chatThinking && (
              <div className="flex justify-start">
                <div className="max-w-[90%] min-w-0 rounded-2xl rounded-bl-md px-3 py-2 bg-slate-800/60 border border-slate-700/30">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px]">🧟</span>
                    <span className="text-[9px] text-purple-400 font-medium">Frankenstein</span>
                  </div>
                  {chatStream ? (
                    <div className="text-[12px] leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:text-white prose-strong:text-white prose-code:text-purple-300 overflow-hidden [overflow-wrap:anywhere] [&_pre]:overflow-x-auto [&_pre]:text-[10px]">
                      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{chatStream}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {chatStatus?.type === "tool_start" ? (
                        <>
                          <Wrench className="w-3 h-3 text-amber-400 animate-pulse" />
                          <span className="text-[10px] text-amber-400">Använder {chatStatus.tool || "verktyg"}...</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                          <span className="text-[10px] text-purple-400">Tänker...</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-3 py-2 border-t border-slate-800/50">
            <div className="flex gap-2 items-end">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={handleChatInput}
                onKeyDown={handleChatKeyDown}
                placeholder="Fråga om träningen..."
                rows={1}
                className="flex-1 bg-slate-800/50 text-sm text-white rounded-xl px-3 py-2 border border-slate-700/50 focus:outline-none focus:border-purple-500 placeholder-slate-600 resize-none"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || chatThinking}
                className="p-2.5 bg-purple-600 text-white rounded-xl active:bg-purple-700 disabled:opacity-40 transition-colors touch-manipulation shrink-0"
                title="Skicka"
              >
                {chatThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[9px] text-slate-600 mt-1">
              Frank har realtidskoll på träningsdata • Shift+Enter ny rad
            </div>
          </div>
        </div>
      )}

      {/* === OVERVIEW TAB === */}
      {activeTab === "overview" && (
        <>
          {/* Recent Trend */}
          {recent.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[12px] font-bold text-slate-300">Senaste 20 uppgifter</h3>
                <span className={`text-[11px] font-mono ${recentSolveRate >= 0.8 ? "text-green-400" : recentSolveRate >= 0.5 ? "text-amber-400" : "text-red-400"}`}>
                  {Math.round(recentSolveRate * 100)}% lösningsgrad
                </span>
              </div>
              <div className="flex gap-0.5 items-end h-8">
                {recent.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all ${h.score >= 1 ? "bg-green-500" : h.score > 0 ? "bg-amber-500" : "bg-red-500/60"}`}
                    style={{ height: `${Math.max(15, h.score * 100)}%` }}
                    title={`${h.id}: ${Math.round(h.score * 100)}%`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skillCount > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <h3 className="text-[12px] font-bold text-slate-300 mb-2">Inlärda Skills ({skillCount})</h3>
              <div className="flex flex-wrap gap-1">
                {Object.entries(p.skills || {}).sort((a, b) => b[1].times_used - a[1].times_used).slice(0, 30).map(([name, skill]) => (
                  <span
                    key={name}
                    className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-700/40 border-slate-600/50 text-slate-300"
                    title={`Använd ${skill.times_used}x, ${Math.round(skill.success_rate * 100)}% success`}
                  >
                    {name} <span className="text-slate-500">×{skill.times_used}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Training Log */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowLog(!showLog)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
            >
              <h3 className="text-[12px] font-bold text-slate-300">Träningslogg</h3>
              <span className="text-[10px] text-slate-500">{showLog ? "Dölj" : "Visa"} ({log.length} rader)</span>
            </button>
            {showLog && (
              <div className="max-h-60 overflow-y-auto border-t border-slate-700/50 p-2">
                <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                  {log.slice(-50).map((line, i) => (
                    <div key={i} className={line.includes("SOLVED") ? "text-green-400/80" : line.includes("FAILED") ? "text-red-400/60" : line.includes("ERROR") ? "text-red-400" : ""}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* === CHARTS TAB === */}
      {activeTab === "charts" && (
        <>
          {/* Learning Curve */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-green-400" />
              <h3 className="text-[12px] font-bold text-slate-300">Inlärningskurva</h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-2">Lösningsgrad per 10 uppgifter (rullande medelvärde)</p>
            {(() => {
              const history = p.history || [];
              if (history.length < 10) return <p className="text-[10px] text-slate-500">Behöver minst 10 uppgifter...</p>;
              const windowSize = 10;
              const curve: number[] = [];
              for (let i = windowSize; i <= history.length; i += Math.max(1, Math.floor(windowSize / 2))) {
                const window = history.slice(i - windowSize, i);
                const rate = window.filter(h => h.score >= 1).length / window.length;
                curve.push(rate * 100);
              }
              return (
                <div>
                  <MiniChart data={curve} height={60} color="#22c55e" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-slate-600">Start</span>
                    <span className="text-[9px] text-slate-600">Nu: {curve.length > 0 ? `${Math.round(curve[curve.length - 1])}%` : "—"}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Difficulty Over Time */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-[12px] font-bold text-slate-300">Svårighetsprogression</h3>
            </div>
            {(() => {
              const history = p.history || [];
              if (history.length < 5) return <p className="text-[10px] text-slate-500">Behöver mer data...</p>;
              const diffCurve = history.map(h => h.difficulty);
              return (
                <div>
                  <MiniChart data={diffCurve} height={40} color="#f59e0b" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-slate-600">Nivå {diffCurve[0]}</span>
                    <span className="text-[9px] text-slate-600">Nivå {diffCurve[diffCurve.length - 1]}</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Exploration Weight Over Time */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <h3 className="text-[12px] font-bold text-slate-300">AIF Exploration Decay</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>Start: 0.60</span>
                  <span>Nu: {stack.aif_exploration?.toFixed(2) || "?"}</span>
                  <span>Mål: 0.15</span>
                </div>
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-700 rounded-full transition-all" style={{ width: `${((stack.aif_exploration || 0.6) / 0.8) * 100}%` }} />
                  <div className="absolute top-0 h-full w-px bg-green-400/60" style={{ left: `${(0.15 / 0.8) * 100}%` }} title="Mål: 0.15" />
                </div>
              </div>
            </div>
            <p className="text-[9px] text-slate-600 mt-1">Lägre = mer exploitation, högre = mer exploration</p>
          </div>

          {/* Strategy Evolution */}
          {stack.strategy_stats && Object.keys(stack.strategy_stats).length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <h3 className="text-[12px] font-bold text-slate-300">Strategi-evolution</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(stack.strategy_stats).map(([name, st]) => {
                  const rate = st.attempts > 0 ? st.successes / st.attempts : 0;
                  const labels: Record<string, string> = { direct: "⚡ Direkt", with_hints: "💡 Med tips", from_memory: "🧠 Från minne", step_by_step: "📋 Steg-för-steg" };
                  const totalAttempts = Object.values(stack.strategy_stats!).reduce((s, v) => s + v.attempts, 0);
                  const usagePct = totalAttempts > 0 ? (st.attempts / totalAttempts) * 100 : 0;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] text-slate-400">{labels[name] || name}</span>
                        <span className="text-[10px] text-slate-500">
                          {Math.round(rate * 100)}% framgång · {Math.round(usagePct)}% av val
                        </span>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div className="flex-1 bg-slate-700/50 rounded-full overflow-hidden" title="Framgångsgrad">
                          <div className={`h-full rounded-full ${rate >= 0.7 ? "bg-green-500" : rate >= 0.4 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${rate * 100}%` }} />
                        </div>
                        <div className="w-16 bg-slate-700/50 rounded-full overflow-hidden" title="Användningsfrekvens">
                          <div className="h-full bg-purple-500/60 rounded-full" style={{ width: `${usagePct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[9px] text-slate-600 mt-2">Vänster: framgångsgrad · Höger: hur ofta AIF väljer strategin</p>
            </div>
          )}
        </>
      )}

      {/* === BRAIN MAP TAB === */}
      {activeTab === "brain" && (() => {
        const stack = p.stack;
        const strats = stack?.strategy_stats || {};
        const s0 = strats["system0_deterministic"] || { attempts: 0, successes: 0 };
        const s1 = strats["system1_memory"] || { attempts: 0, successes: 0 };
        const llmStrats = Object.entries(strats).filter(([k]) => !k.startsWith("system"));
        const llmTotal = llmStrats.reduce((s, [, v]) => s + v.attempts, 0);
        const llmSuccess = llmStrats.reduce((s, [, v]) => s + v.successes, 0);
        const totalDecisions = s0.attempts + s1.attempts + llmTotal;
        const v2 = p.v2_stats || { attempted: 0, solved: 0 };
        const chaos = p.chaos_stats || { attempted: 0, solved: 0 };
        const v2Rate = v2.attempted > 0 ? v2.solved / v2.attempted : 0;
        const chaosRate = chaos.attempted > 0 ? chaos.solved / chaos.attempted : 0;

        return (
          <>
            {/* Decision Flow */}
            <div className="bg-slate-800/60 border border-purple-700/30 rounded-xl p-3">
              <h3 className="text-[12px] font-bold text-purple-300 mb-3 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5" />
                Live Brain Map — Beslutsflöde
              </h3>

              {/* System 0 → 1 → 2 flow */}
              <div className="flex items-center gap-1 mb-3">
                {[
                  { label: "S0 Deterministisk", count: s0.attempts, color: "emerald", desc: "Exakt lösning, 0ms" },
                  { label: "S1 Minne", count: s1.attempts, color: "cyan", desc: "Procedurellt minne" },
                  { label: "S2 LLM", count: llmTotal, color: "amber", desc: "Gemini/Grok inference" },
                ].map((sys, i) => {
                  const pct = totalDecisions > 0 ? (sys.count / totalDecisions) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className={`w-full bg-${sys.color}-900/30 border border-${sys.color}-700/40 rounded-lg p-2 text-center`}
                           style={{ backgroundColor: sys.color === "emerald" ? "rgba(6,78,59,0.3)" : sys.color === "cyan" ? "rgba(8,51,68,0.3)" : "rgba(78,49,6,0.3)", borderColor: sys.color === "emerald" ? "rgba(16,185,129,0.4)" : sys.color === "cyan" ? "rgba(34,211,238,0.4)" : "rgba(245,158,11,0.4)" }}>
                        <div className="text-[10px] font-bold" style={{ color: sys.color === "emerald" ? "#6ee7b7" : sys.color === "cyan" ? "#67e8f9" : "#fcd34d" }}>{sys.label}</div>
                        <div className="text-[18px] font-black text-white">{sys.count}</div>
                        <div className="text-[9px] text-slate-400">{pct.toFixed(1)}%</div>
                        <div className="text-[8px] text-slate-500 mt-0.5">{sys.desc}</div>
                      </div>
                      {i < 2 && <div className="text-slate-600 text-[10px] mt-1">→ fallback →</div>}
                    </div>
                  );
                })}
              </div>

              {/* LLM Strategy breakdown */}
              {llmStrats.length > 0 && (
                <div className="bg-slate-900/40 rounded-lg p-2 mt-2">
                  <div className="text-[9px] text-slate-500 mb-1.5">S2 LLM Strategier (AIF-styrda)</div>
                  <div className="grid grid-cols-2 gap-1">
                    {llmStrats.map(([name, st]) => {
                      const rate = st.attempts > 0 ? st.successes / st.attempts : 0;
                      const stratLabels: Record<string, string> = { direct: "⚡ Direkt", with_hints: "💡 Tips", from_memory: "🧠 Minne", step_by_step: "📋 Steg" };
                      return (
                        <div key={name} className="flex items-center gap-1.5 bg-slate-800/60 rounded px-1.5 py-1">
                          <span className="text-[9px] text-slate-400 w-14 shrink-0">{stratLabels[name] || name}</span>
                          <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500/60 rounded-full" style={{ width: `${rate * 100}%` }} />
                          </div>
                          <span className="text-[9px] text-slate-500 w-8 text-right">{st.attempts}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Frankenstein 2.0 Stats */}
            <div className="bg-slate-800/60 border border-red-700/30 rounded-xl p-3">
              <h3 className="text-[12px] font-bold text-red-300 mb-2 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                Frankenstein 2.0 — Nya utmaningar
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {/* V2 Tasks */}
                <div className="bg-slate-900/40 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[14px]">🧟</span>
                    <span className="text-[10px] font-bold text-red-300">V2 Uppgifter</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mb-1">Bugfix, API Design, Optimization, Multi-step</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[20px] font-black text-white">{v2.solved}</span>
                    <span className="text-[10px] text-slate-400">/ {v2.attempted}</span>
                    <span className={`text-[11px] font-bold ${v2Rate >= 0.7 ? "text-emerald-400" : v2Rate >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                      {v2.attempted > 0 ? `${(v2Rate * 100).toFixed(0)}%` : "—"}
                    </span>
                  </div>
                  {v2.attempted > 0 && (
                    <div className="mt-1.5 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500/60 rounded-full transition-all" style={{ width: `${v2Rate * 100}%` }} />
                    </div>
                  )}
                </div>

                {/* Chaos Monkey */}
                <div className="bg-slate-900/40 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[14px]">🐒</span>
                    <span className="text-[10px] font-bold text-orange-300">Chaos Monkey</span>
                  </div>
                  <div className="text-[9px] text-slate-500 mb-1">Bugg-injektion, Refaktorering</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[20px] font-black text-white">{chaos.solved}</span>
                    <span className="text-[10px] text-slate-400">/ {chaos.attempted}</span>
                    <span className={`text-[11px] font-bold ${chaosRate >= 0.7 ? "text-emerald-400" : chaosRate >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                      {chaos.attempted > 0 ? `${(chaosRate * 100).toFixed(0)}%` : "—"}
                    </span>
                  </div>
                  {chaos.attempted > 0 && (
                    <div className="mt-1.5 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500/60 rounded-full transition-all" style={{ width: `${chaosRate * 100}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* V2 Category Breakdown */}
            {p.trends?.per_category && (() => {
              const v2Cats = Object.entries(p.trends.per_category).filter(([k]) =>
                k.startsWith("bugfix") || k.startsWith("code_review") || k.startsWith("api_design") ||
                k.startsWith("optimization") || k.startsWith("multi_step") || k.startsWith("chaos_") ||
                k.startsWith("refactor_")
              );
              if (v2Cats.length === 0) return null;
              return (
                <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl p-3">
                  <h3 className="text-[11px] font-bold text-slate-300 mb-2">V2 Kategorier (senaste 200)</h3>
                  <div className="flex flex-col gap-1">
                    {v2Cats.sort((a, b) => b[1].attempted - a[1].attempted).map(([cat, st]) => {
                      const rate = st.attempted > 0 ? st.solved / st.attempted : 0;
                      const catEmoji: Record<string, string> = { bugfix: "🔧", code_review: "👁️", api_design: "🏗️", optimization: "⚡", multi_step: "📋" };
                      const prefix = cat.split("_")[0];
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <span className="text-[10px]">{catEmoji[prefix] || "🧟"}</span>
                          <span className="text-[9px] text-slate-400 w-28 shrink-0 truncate">{cat}</span>
                          <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${rate * 100}%`, backgroundColor: rate >= 0.7 ? "#6ee7b7" : rate >= 0.4 ? "#fcd34d" : "#fca5a5" }} />
                          </div>
                          <span className="text-[9px] text-slate-500 w-12 text-right">{st.solved}/{st.attempted}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* LLM Stats */}
            {stack?.llm_stats && (
              <div className="bg-slate-800/60 border border-slate-700/30 rounded-xl p-3">
                <h3 className="text-[11px] font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  LLM Prestanda
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Anrop", value: stack.llm_stats.calls, color: "text-slate-300" },
                    { label: "Framgång", value: `${(stack.llm_stats.success_rate * 100).toFixed(0)}%`, color: stack.llm_stats.success_rate >= 0.8 ? "text-emerald-400" : "text-amber-400" },
                    { label: "Latens", value: `${stack.llm_stats.avg_latency_ms.toFixed(0)}ms`, color: stack.llm_stats.avg_latency_ms < 3000 ? "text-cyan-400" : "text-amber-400" },
                    { label: "Rate Limits", value: stack.llm_stats.rate_limits, color: stack.llm_stats.rate_limits > 10 ? "text-red-400" : "text-slate-400" },
                    { label: "Timeouts", value: stack.llm_stats.timeouts, color: stack.llm_stats.timeouts > 5 ? "text-red-400" : "text-slate-400" },
                    { label: "Retries", value: stack.llm_stats.retries, color: "text-slate-400" },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/40 rounded-lg p-1.5">
                      <div className="text-[8px] text-slate-500">{item.label}</div>
                      <div className={`text-[13px] font-bold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* === A/B TEST TAB === */}
      {activeTab === "abtest" && (
        <>
          {/* === A/B Test Launcher === */}
          <div className="bg-slate-800/80 border border-cyan-700/30 rounded-xl p-3">
            <h3 className="text-[12px] font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5" />
              Starta A/B-test
              <span className="text-[9px] text-slate-500 font-normal">Frankenstein (med valda moduler) vs Ren LLM</span>
            </h3>

            {/* Module toggles for test */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {Object.entries({
                hdc: "HDC Kognition",
                aif: "Active Inference",
                ebbinghaus: "Ebbinghaus Minne",
                gut_feeling: "Gut Feeling",
                emotions: "Ekman Emotioner",
                stm: "Korttidsminne",
              }).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setAbModules(prev => ({ ...prev, [key]: !prev[key] }))}
                  disabled={abLive?.active}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg transition-all text-left text-[10px] ${
                    abModules[key]
                      ? "bg-cyan-900/30 border border-cyan-700/30 text-cyan-200"
                      : "bg-slate-700/30 border border-slate-600/30 text-slate-500"
                  } ${abLive?.active ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"}`}
                >
                  {abModules[key] ? (
                    <ToggleRight className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Task count + Start/Stop */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Uppgifter:</span>
                <select
                  value={abNumTasks}
                  onChange={e => setAbNumTasks(Number(e.target.value))}
                  disabled={abLive?.active}
                  aria-label="Antal uppgifter"
                  className="bg-slate-700/60 border border-slate-600/50 rounded px-2 py-0.5 text-[11px] text-white"
                >
                  {[10, 20, 30, 50].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1" />
              {abLive?.active ? (
                <button
                  onClick={stopAbTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/60 hover:bg-red-900/80 text-red-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stoppa
                </button>
              ) : (
                <button
                  onClick={startAbTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/60 hover:bg-cyan-900/80 text-cyan-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Starta test
                </button>
              )}
            </div>
          </div>

          {/* === Live A/B Test Progress === */}
          {abLive?.active && abLive.events.length > 0 && (() => {
            const taskEvents = abLive.events.filter(e => e.type === "ab_task_done");
            const last = taskEvents[taskEvents.length - 1];
            if (!last) return null;
            const pct = last.total_tasks ? Math.round((last.task_num! / last.total_tasks) * 100) : 0;
            return (
              <div className="bg-slate-800/60 border border-cyan-700/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[12px] font-bold text-cyan-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    Pågående test
                  </h3>
                  <span className="text-[10px] text-slate-400">{last.task_num}/{last.total_tasks} ({pct}%)</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-purple-950/30 border border-purple-700/30 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-purple-300 font-bold">Frankenstein</div>
                    <div className="text-lg font-bold text-white">{last.frank_solved}</div>
                    <div className="text-[9px] text-slate-400">av {last.task_num} ({last.task_num ? Math.round((last.frank_solved! / last.task_num!) * 100) : 0}%)</div>
                  </div>
                  <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-slate-300 font-bold">Ren LLM</div>
                    <div className="text-lg font-bold text-white">{last.bare_solved}</div>
                    <div className="text-[9px] text-slate-400">av {last.task_num} ({last.task_num ? Math.round((last.bare_solved! / last.task_num!) * 100) : 0}%)</div>
                  </div>
                </div>
                {/* Recent tasks feed */}
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {taskEvents.slice(-8).reverse().map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-500 truncate flex-1">#{ev.task_num} Lv{ev.difficulty} {ev.title}</span>
                      <div className="flex gap-2 shrink-0 ml-2">
                        <span className={ev.frank_score! >= 1 ? "text-green-400" : "text-red-400"}>
                          F:{ev.frank_score! >= 1 ? "OK" : "X"}
                        </span>
                        <span className={ev.bare_score! >= 1 ? "text-green-400" : "text-red-400"}>
                          B:{ev.bare_score! >= 1 ? "OK" : "X"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* === Completed Live Test Result === */}
          {abLive && !abLive.active && abLive.result && (
            <div className={`rounded-xl p-4 text-center border ${
              abLive.result.difference?.winner === "frankenstein"
                ? "bg-green-950/40 border-green-700/50"
                : abLive.result.difference?.winner === "bare_llm"
                  ? "bg-red-950/40 border-red-700/50"
                  : "bg-slate-800/60 border-slate-700/50"
            }`}>
              <div className="text-2xl mb-1">
                {abLive.result.difference?.winner === "frankenstein" ? "🧟 ✅" : abLive.result.difference?.winner === "bare_llm" ? "📝 ⚠️" : "🤝"}
              </div>
              <div className="text-sm font-bold text-white">
                {abLive.result.difference?.winner === "frankenstein"
                  ? "Frankenstein vinner!"
                  : abLive.result.difference?.winner === "bare_llm"
                    ? "Ren LLM vinner"
                    : "Oavgjort"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Frank: {Math.round((abLive.result.frankenstein?.solve_rate || 0) * 100)}% vs LLM: {Math.round((abLive.result.bare_llm?.solve_rate || 0) * 100)}%
                {abLive.result.module_config && (
                  <span className="ml-2">
                    · Moduler: {Object.entries(abLive.result.module_config as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k).join(", ")}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* === Historical Results === */}
          {abTest?.available && (
            <>
              <div className="border-t border-slate-700/30 pt-2 mt-1">
                <h3 className="text-[11px] font-bold text-slate-400 mb-2">Historiska resultat</h3>
              </div>

              {/* Winner Banner */}
              <div className={`rounded-xl p-4 text-center border ${
                abTest.difference?.winner === "frankenstein"
                  ? "bg-green-950/40 border-green-700/50"
                  : abTest.difference?.winner === "bare_llm"
                    ? "bg-red-950/40 border-red-700/50"
                    : "bg-slate-800/60 border-slate-700/50"
              }`}>
                <div className="text-2xl mb-1">
                  {abTest.difference?.winner === "frankenstein" ? "🧟 ✅" : abTest.difference?.winner === "bare_llm" ? "📝 ⚠️" : "🤝"}
                </div>
                <div className="text-sm font-bold text-white">
                  {abTest.difference?.winner === "frankenstein"
                    ? "Frankenstein vinner!"
                    : abTest.difference?.winner === "bare_llm"
                      ? "Ren LLM vinner"
                      : "Oavgjort"}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Skillnad: {((abTest.difference?.solve_rate || 0) * 100).toFixed(1)}% · {abTest.total_tasks || abTest.num_tasks} uppgifter{abTest.num_runs ? ` · ${abTest.num_runs} körningar` : ""} · {abTest.timestamp}
                </div>
              </div>

              {/* Comparison Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-purple-950/30 border border-purple-700/40 rounded-xl p-3">
                  <div className="text-[10px] text-purple-300 font-bold mb-1">🧟 Frankenstein</div>
                  <div className="text-xl font-bold text-white">{Math.round((abTest.frankenstein?.solve_rate || 0) * 100)}%</div>
                  <div className="text-[10px] text-slate-400">{abTest.frankenstein?.solved}/{abTest.frankenstein?.total} lösta</div>
                  <div className="text-[10px] text-slate-500 mt-1">First-try: {Math.round((abTest.frankenstein?.first_try_rate || 0) * 100)}%</div>
                  <div className="text-[10px] text-slate-500">Snitt: {Math.round(abTest.frankenstein?.avg_time_ms || 0)}ms</div>
                </div>
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="text-[10px] text-slate-300 font-bold mb-1">📝 Ren LLM</div>
                  <div className="text-xl font-bold text-white">{Math.round((abTest.bare_llm?.solve_rate || 0) * 100)}%</div>
                  <div className="text-[10px] text-slate-400">{abTest.bare_llm?.solved}/{abTest.bare_llm?.total} lösta</div>
                  <div className="text-[10px] text-slate-500 mt-1">First-try: {Math.round((abTest.bare_llm?.first_try_rate || 0) * 100)}%</div>
                  <div className="text-[10px] text-slate-500">Snitt: {Math.round(abTest.bare_llm?.avg_time_ms || 0)}ms</div>
                </div>
              </div>

              {/* Run History */}
              {abTest.runs && abTest.runs.length > 1 && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <h3 className="text-[12px] font-bold text-slate-300 mb-2">Körningshistorik</h3>
                  <div className="space-y-1">
                    {abTest.runs.map((run, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">#{i + 1} ({run.timestamp})</span>
                        <div className="flex gap-3">
                          <span className="text-purple-300">🧟 {Math.round(run.frank_rate * 100)}%</span>
                          <span className="text-slate-400">📝 {Math.round(run.bare_rate * 100)}%</span>
                          <span className={`font-mono ${run.frank_rate > run.bare_rate ? "text-green-400" : run.frank_rate < run.bare_rate ? "text-red-400" : "text-slate-500"}`}>
                            {run.frank_rate > run.bare_rate ? "+" : ""}{Math.round((run.frank_rate - run.bare_rate) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per Level Comparison */}
              {abTest.per_level && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <h3 className="text-[12px] font-bold text-slate-300 mb-2">Per svårighetsnivå</h3>
                  <div className="space-y-2">
                    {Object.entries(abTest.per_level).sort((a, b) => Number(a[0]) - Number(b[0])).map(([lvl, data]) => {
                      const fRate = data.frankenstein.rate;
                      const bRate = data.bare_llm.rate;
                      const diff = fRate - bRate;
                      return (
                        <div key={lvl}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-slate-400">Nivå {lvl}</span>
                            <span className={`text-[10px] font-mono ${diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : "text-slate-500"}`}>
                              {diff > 0 ? "+" : ""}{Math.round(diff * 100)}%
                            </span>
                          </div>
                          <div className="flex gap-1 h-2">
                            <div className="flex-1 bg-slate-700/50 rounded-full overflow-hidden" title={`Frankenstein: ${Math.round(fRate * 100)}%`}>
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${fRate * 100}%` }} />
                            </div>
                            <div className="flex-1 bg-slate-700/50 rounded-full overflow-hidden" title={`Ren LLM: ${Math.round(bRate * 100)}%`}>
                              <div className="h-full bg-slate-400 rounded-full" style={{ width: `${bRate * 100}%` }} />
                            </div>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-600">
                            <span>🧟 {data.frankenstein.solved}/{data.frankenstein.total}</span>
                            <span>📝 {data.bare_llm.solved}/{data.bare_llm.total}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* === TERMINAL BENCH TAB === */}
      {activeTab === "terminal" && (() => {
        // Live panel
        const liveActive = termLive?.active;
        const liveTask = termLive?.current_task;
        const liveEvents = (termLive?.events || []).filter((e: any) => e.type === "terminal_task_done").slice(-10);
        const batchStarts = (termLive?.events || []).filter((e: any) => e.type === "terminal_batch_start");
        const lastBatchStart = batchStarts.length > 0 ? batchStarts[batchStarts.length - 1] : null;
        const timeSinceUpdate = termLive?.last_update ? Math.round((Date.now() - termLive.last_update) / 1000) : null;
        const ts = p.terminal_stats;
        const termHistory = (p.history || []).filter((h: any) => h.terminal);
        const recentTerm = termHistory.slice(-30);
        const termSolveRate = recentTerm.length > 0 ? recentTerm.filter((h: any) => h.score >= 1).length / recentTerm.length : 0;

        // Per-category breakdown from terminal history
        const catMap: Record<string, { attempted: number; solved: number; totalMs: number }> = {};
        for (const h of termHistory) {
          const cat = (h.category || "unknown").replace("terminal_", "");
          if (!catMap[cat]) catMap[cat] = { attempted: 0, solved: 0, totalMs: 0 };
          catMap[cat].attempted++;
          if (h.score >= 1) catMap[cat].solved++;
          catMap[cat].totalMs += h.time_ms || 0;
        }
        const categories = Object.entries(catMap).sort((a, b) => b[1].attempted - a[1].attempted);

        return (
          <>
            {/* Live Terminal Panel */}
            {(liveActive || (liveEvents.length > 0 && timeSinceUpdate !== null && timeSinceUpdate < 120)) && (
              <div className={`bg-slate-800/80 border rounded-xl p-3 ${liveActive ? "border-cyan-700/50" : "border-slate-700/50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[12px] font-bold text-cyan-300 flex items-center gap-2">
                    {liveActive && <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />}
                    {liveActive ? "Pågående terminal-batch" : "Senaste terminal-batch"}
                  </h3>
                  <span className="text-[9px] text-slate-500">
                    {lastBatchStart ? `Batch #${lastBatchStart.batch} · Lv${lastBatchStart.difficulty}` : ""}
                    {timeSinceUpdate !== null && !liveActive && ` · ${timeSinceUpdate}s sedan`}
                  </span>
                </div>

                {/* Progress bar */}
                {liveActive && lastBatchStart && (() => {
                  const done = liveEvents.length;
                  const total = lastBatchStart.num_tasks || 5;
                  const pct = Math.round((done / total) * 100);
                  return (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                        <span>{done}/{total} uppgifter</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Current task being solved */}
                {liveTask && (
                  <div className="bg-cyan-950/30 border border-cyan-800/30 rounded-lg p-2 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                      <span className="text-[11px] text-cyan-200 font-medium">{liveTask.title}</span>
                    </div>
                    <div className="text-[9px] text-slate-500 mb-1">
                      Lv{liveTask.difficulty} · {liveTask.category} · {liveTask.steps?.length || 0} steg hittills
                    </div>
                    {liveTask.steps && liveTask.steps.length > 0 && (
                      <div className="space-y-0.5 max-h-24 overflow-y-auto">
                        {liveTask.steps.slice(-5).map((s: any, i: number) => (
                          <div key={i} className="text-[9px] font-mono bg-slate-900/60 rounded px-1.5 py-0.5">
                            <span className="text-cyan-400">$</span> <span className="text-slate-300">{(s.command || "").slice(0, 60)}</span>
                            {s.output && <div className="text-slate-500 truncate">{s.output.slice(0, 80)}</div>}
                            {s.error && <div className="text-red-400 truncate">{s.error.slice(0, 80)}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recent completed tasks in this batch */}
                {liveEvents.length > 0 && (
                  <div className="space-y-0.5">
                    {liveEvents.slice(-5).reverse().map((ev: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[9px]">
                        <span className="text-slate-500 truncate flex-1">
                          #{ev.task_num} {ev.title || ev.task_id}
                        </span>
                        <span className="text-slate-600 mx-1">{ev.steps} steg · {Math.round(ev.time_ms)}ms</span>
                        <span className={`shrink-0 font-mono ${ev.score >= 1 ? "text-green-400" : "text-red-400"}`}>
                          {ev.score >= 1 ? "✓" : `${Math.round(ev.score * 100)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Terminal Stats Overview */}
            {ts ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/60 border border-cyan-700/30 rounded-xl p-3">
                  <div className="text-[10px] text-cyan-400 mb-1">Lösta</div>
                  <div className="text-xl font-bold text-white">{ts.total_solved}<span className="text-sm text-slate-500">/{ts.total_tasks}</span></div>
                  <div className="text-[9px] text-slate-500">{Math.round(ts.solve_rate * 100)}% lösningsgrad</div>
                </div>
                <div className="bg-slate-800/60 border border-cyan-700/30 rounded-xl p-3">
                  <div className="text-[10px] text-cyan-400 mb-1">Mönster</div>
                  <div className="text-xl font-bold text-white">{ts.known_patterns}</div>
                  <div className="text-[9px] text-slate-500">{ts.categories_learned?.length || 0} kategorier</div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">🖥️</div>
                <p className="text-slate-400 text-[11px]">Terminal Bench har inte körts ännu</p>
                <p className="text-slate-500 text-[9px] mt-1">Körs automatiskt var 10:e batch i continuous_train.py</p>
              </div>
            )}

            {/* Recent Terminal Trend */}
            {recentTerm.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[12px] font-bold text-slate-300">Senaste {recentTerm.length} terminal-uppgifter</h3>
                  <span className={`text-[11px] font-mono ${termSolveRate >= 0.7 ? "text-green-400" : termSolveRate >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                    {Math.round(termSolveRate * 100)}%
                  </span>
                </div>
                <div className="flex gap-0.5 items-end h-8">
                  {recentTerm.map((h: any, i: number) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all ${h.score >= 1 ? "bg-cyan-500" : h.score > 0 ? "bg-amber-500" : "bg-red-500/60"}`}
                      style={{ height: `${Math.max(15, h.score * 100)}%` }}
                      title={`${h.id}: ${Math.round(h.score * 100)}% · ${h.attempts || 0} steg · ${Math.round(h.time_ms || 0)}ms`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Per-Category Breakdown */}
            {categories.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                <h3 className="text-[12px] font-bold text-slate-300 mb-2">Per kategori</h3>
                <div className="space-y-1.5">
                  {categories.map(([cat, stats]) => {
                    const rate = stats.attempted > 0 ? stats.solved / stats.attempted : 0;
                    const avgMs = stats.solved > 0 ? stats.totalMs / stats.solved : 0;
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-24 truncate" title={cat}>{cat}</span>
                        <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${rate >= 0.7 ? "bg-cyan-500" : rate >= 0.4 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${Math.round(rate * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 w-16 text-right">{stats.solved}/{stats.attempted}</span>
                        <span className={`text-[10px] w-10 text-right font-mono ${rate >= 0.7 ? "text-green-400" : rate >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                          {Math.round(rate * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Terminal History List */}
            {recentTerm.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                <h3 className="text-[12px] font-bold text-slate-300 mb-2">Historik</h3>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {recentTerm.slice().reverse().map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[9px] py-0.5">
                      <span className="text-slate-500 truncate flex-1" title={h.id}>
                        Lv{h.difficulty} {(h.category || "").replace("terminal_", "")}
                      </span>
                      <span className="text-slate-600 mx-2">{h.attempts || 0} steg · {Math.round(h.time_ms || 0)}ms</span>
                      <span className={`shrink-0 font-mono ${h.score >= 1 ? "text-green-400" : "text-red-400"}`}>
                        {h.score >= 1 ? "✓" : `${Math.round(h.score * 100)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learned Categories */}
            {ts && ts.categories_learned && ts.categories_learned.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                <h3 className="text-[12px] font-bold text-slate-300 mb-2">Inlärda kategorier</h3>
                <div className="flex flex-wrap gap-1">
                  {ts.categories_learned.map((cat: string) => (
                    <span key={cat} className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300 border border-cyan-700/30">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* === SWARM TAB === */}
      {activeTab === "swarm" && (
        <>
          {/* Swarm Launcher */}
          <div className="bg-slate-800/80 border border-amber-700/30 rounded-xl p-3">
            <h3 className="text-[12px] font-bold text-amber-300 mb-1 flex items-center gap-2">
              <span className="text-base">🧟‍♂️🐝</span>
              FrankensteinSwarm
            </h3>
            <p className="text-[9px] text-slate-500 mb-3">
              3 specialiserade Frankenstein-agenter med kollektiv kognition: Analytiker 🔬 + Kreativist 🎨 + Kritiker 📊
            </p>

            {/* Node profiles */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { emoji: "🔬", label: "Analytiker", desc: "Full stack, systematisk", modules: "6/6" },
                { emoji: "🎨", label: "Kreativist", desc: "Hög temp, fri strategi", modules: "4/6" },
                { emoji: "📊", label: "Kritiker", desc: "Låg temp, step-by-step", modules: "5/6" },
              ].map(n => (
                <div key={n.label} className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-2 text-center">
                  <div className="text-lg">{n.emoji}</div>
                  <div className="text-[10px] font-bold text-white">{n.label}</div>
                  <div className="text-[8px] text-slate-500">{n.desc}</div>
                  <div className="text-[8px] text-amber-400 mt-0.5">{n.modules} moduler</div>
                </div>
              ))}
            </div>

            {/* Task count + Start/Stop */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Uppgifter:</span>
                <select
                  value={swarmNumTasks}
                  onChange={e => setSwarmNumTasks(Number(e.target.value))}
                  disabled={swarmLive?.active}
                  aria-label="Antal uppgifter för swarm"
                  className="bg-slate-700/60 border border-slate-600/50 rounded px-2 py-0.5 text-[11px] text-white"
                >
                  {[5, 10, 20, 30].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1" />
              {swarmLive?.active ? (
                <button
                  onClick={stopSwarm}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/60 hover:bg-red-900/80 text-red-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stoppa
                </button>
              ) : (
                <button
                  onClick={startSwarm}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/60 hover:bg-amber-900/80 text-amber-300 rounded-lg text-[11px] font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  Starta svärm
                </button>
              )}
            </div>
          </div>

          {/* Live Swarm Progress */}
          {swarmLive?.active && swarmLive.events.length > 0 && (() => {
            const taskDone = swarmLive.events.filter((e: any) => e.type === "swarm_task_done");
            const nodeDone = swarmLive.events.filter((e: any) => e.type === "swarm_node_done");
            const last = taskDone[taskDone.length - 1];
            const totalTasks = swarmLive.num_tasks || 20;
            const pct = last ? Math.round((last.task_num / totalTasks) * 100) : 0;
            return (
              <div className="bg-slate-800/60 border border-amber-700/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[12px] font-bold text-amber-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    Pågående svärm
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {last ? `${last.task_num}/${totalTasks}` : "Startar..."} ({pct}%)
                  </span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>

                {/* Per-node stats */}
                {last && (
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {(last.per_node || []).map((n: any) => (
                      <div key={n.id} className={`rounded-lg p-1.5 text-center border ${
                        n.score >= 1 ? "bg-green-950/30 border-green-700/30" : "bg-slate-700/30 border-slate-600/30"
                      }`}>
                        <div className="text-[9px] font-bold text-white">{n.id === "analytiker" ? "🔬" : n.id === "kreativist" ? "🎨" : "📊"}</div>
                        <div className={`text-[10px] font-bold ${n.score >= 1 ? "text-green-400" : "text-red-400"}`}>
                          {n.score >= 1 ? "OK" : `${Math.round(n.score * 100)}%`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Solved counter */}
                {last && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Lösta: <span className="text-white font-bold">{last.total_solved}/{last.task_num}</span></span>
                    <span className="text-slate-400">Metod: <span className="text-amber-300">{last.consensus_method}</span></span>
                  </div>
                )}

                {/* Recent tasks */}
                <div className="space-y-0.5 mt-2 max-h-28 overflow-y-auto">
                  {taskDone.slice(-6).reverse().map((ev: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-500 truncate flex-1">#{ev.task_num} Lv{ev.difficulty} {ev.title}</span>
                      <span className={`shrink-0 ml-2 font-mono ${ev.consensus_score >= 1 ? "text-green-400" : "text-red-400"}`}>
                        {ev.consensus_score >= 1 ? "OK" : `${Math.round(ev.consensus_score * 100)}%`}
                        {ev.collective_improvement > 0 && <span className="text-cyan-400 ml-1">+{Math.round(ev.collective_improvement * 100)}%</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Completed Swarm Result */}
          {swarmLive && !swarmLive.active && swarmLive.result && (() => {
            const stats = swarmLive.result.stats;
            if (!stats) return null;
            return (
              <div className="bg-slate-800/60 border border-amber-700/30 rounded-xl p-3">
                <h3 className="text-[12px] font-bold text-amber-300 mb-2">Resultat</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-amber-950/30 border border-amber-700/30 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-amber-300">Svärm lösningsgrad</div>
                    <div className="text-xl font-bold text-white">{Math.round(stats.solve_rate * 100)}%</div>
                    <div className="text-[9px] text-slate-400">{stats.total_solved}/{stats.total_tasks}</div>
                  </div>
                  <div className="bg-cyan-950/30 border border-cyan-700/30 rounded-lg p-2 text-center">
                    <div className="text-[9px] text-cyan-300">Kollektiva vinster</div>
                    <div className="text-xl font-bold text-white">{Math.round(stats.collective_win_rate * 100)}%</div>
                    <div className="text-[9px] text-slate-400">{stats.collective_wins} gånger</div>
                  </div>
                </div>
                {/* Per node */}
                <div className="space-y-1">
                  {Object.entries(stats.per_node || {}).map(([pid, ns]: [string, any]) => (
                    <div key={pid} className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-300">{ns.emoji} {ns.label}</span>
                      <span className="text-white font-mono">{ns.solved}/{ns.tasks} ({Math.round(ns.rate * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Info panel when nothing is running */}
          {(!swarmLive || (!swarmLive.active && !swarmLive.result)) && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🧟‍♂️🐝</div>
              <p className="text-slate-400 text-[11px]">Biologisk kognition × kollektiv intelligens</p>
              <p className="text-slate-500 text-[9px] mt-2 max-w-xs mx-auto">
                3 Frankenstein-agenter med olika kognitiva profiler samarbetar via Mycelium-protokollet.
                Delat HDC-minne, insight-propagation och konsensus-mekanismer.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
