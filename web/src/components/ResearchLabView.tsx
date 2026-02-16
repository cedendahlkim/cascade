import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BRIDGE_URL } from "../config";
import {
  Microscope, Brain, Zap, Play, Square, Trophy, Clock, Target,
  Activity, Eye, Database, Sparkles, ChevronRight, RotateCcw,
  Swords, Send, Download, Trash2, Star, TrendingUp, Lightbulb,
  Users, MessageSquare, Cpu, Shield, FlaskConical, BookOpen,
  BarChart3, Layers, RefreshCw, Search, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, Heart, Award, Flame, Timer, Hash,
  Gauge, GitBranch, Crown, Medal, History, Beaker, Filter,
  BarChart2, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  Percent, AlertTriangle,
} from "lucide-react";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

interface ResearchMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  phase?: string;
  memoryId?: string;
  votes?: { up: number; down: number };
  stack?: AgentStack;
  surpriseScore?: number;
}

interface AgentStack {
  hdc_concepts: number;
  aif_surprise: number;
  aif_exploration: number;
  memory_active: number;
  memory_stored: number;
  strategy_used?: string;
  confidence?: number;
}

interface SharedMemoryItem {
  id: string;
  type: string;
  content: string;
  author: string;
  topic: string;
  timestamp: string;
  importance: number;
  tags: string[];
}

interface ResearchSession {
  id: string;
  topic: string;
  phase: string;
  participants: string[];
  startedAt: string;
  messageCount: number;
}

interface ArenaParticipantInfo {
  id: string;
  name: string;
  emoji: string;
  enabled: boolean;
}

interface AgentRanking {
  agent: string;
  up: number;
  down: number;
  total: number;
  messages: number;
}

interface FrankensteinProgress {
  total_tasks_solved: number;
  total_tasks_attempted: number;
  current_difficulty: number;
  session_count: number;
  total_training_seconds: number;
  best_streak: number;
  skills: Record<string, any>;
  level_stats: Record<string, { attempted: number; solved: number }>;
  stack?: {
    hdc_concepts: number;
    aif_exploration: number;
    memory_active: number;
    memory_stored: number;
  };
}

interface Wellbeing {
  mood: string;
  energy: number;
  curiosity: number;
  confidence: number;
  frustration: number;
  streak: number;
}

interface ABTestResult {
  available: boolean;
  test_id?: string;
  timestamp?: string;
  num_tasks?: number;
  results?: {
    with_modules: { solved: number; total: number; avg_time_ms: number; strategies: Record<string, number> };
    without_modules: { solved: number; total: number; avg_time_ms: number };
    improvement: number;
    winner: string;
  };
}

interface SessionHistoryItem {
  id: string;
  topic: string;
  phase: string;
  participants: string[];
  startedAt: string;
  messageCount: number;
  endedAt?: string;
}

// Battle types
interface BattleEvent {
  type: string;
  round?: number;
  total_rounds?: number;
  agent?: string;
  solved?: boolean;
  score?: number;
  time_ms?: number;
  attempts?: number;
  strategy?: string;
  first_try?: boolean;
  hdc_concept?: string;
  hdc_is_new?: boolean;
  hdc_confidence?: number;
  aif_surprise?: number;
  frank_score?: number;
  bare_score?: number;
  frank_total_ms?: number;
  bare_total_ms?: number;
  frank_rate?: number;
  bare_rate?: number;
  frank_avg_ms?: number;
  bare_avg_ms?: number;
  winner?: string;
  battle_id?: string;
  num_tasks?: number;
  difficulties?: number[];
  category?: string;
  frankenstein_model?: string;
  bare_model?: string;
  llm_name?: string;
  task?: { id: string; title: string; difficulty: number; category: string; description: string };
  stack?: AgentStack & { strategy_stats: Record<string, { attempts: number; successes: number }> };
  timestamp?: number;
}

interface RoundResult {
  round: number;
  task: { id: string; title: string; difficulty: number; category: string };
  frank: { solved: boolean; score: number; time_ms: number; attempts: number; strategy: string; first_try: boolean; hdc_concept: string; hdc_is_new: boolean; hdc_confidence: number; aif_surprise: number };
  bare: { solved: boolean; score: number; time_ms: number; attempts: number; first_try: boolean };
}

// Self-improve types
interface Skill {
  id: string;
  name: string;
  description: string;
  toolChain: Array<{ tool: string; inputSummary: string }>;
  triggerPattern: string;
  tags: string[];
  useCount: number;
  avgScore: number;
  createdAt: string;
  lastUsedAt: string | null;
}

interface SelfImproveStats {
  skills: { total: number; totalUses: number; avgScore: number; topSkills: Skill[] };
  evaluations: { total: number; avgScore: number; recentTrend: number; scoreDistribution: Record<number, number> };
  reflections: { total: number; applied: number; avgDelta: number; improvementRate: number };
  learnings: string[];
}

type MainTab = "research" | "battle" | "stack";
type BattlePhase = "idle" | "running" | "finished";

// Simple markdown-ish renderer for research messages
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    // Headers
    if (line.startsWith("### ")) return <h4 key={i} className="text-[11px] font-bold text-white mt-1.5 mb-0.5">{line.slice(4)}</h4>;
    if (line.startsWith("## ")) return <h3 key={i} className="text-xs font-bold text-white mt-2 mb-0.5">{line.slice(3)}</h3>;
    if (line.startsWith("# ")) return <h2 key={i} className="text-sm font-bold text-white mt-2 mb-1">{line.slice(2)}</h2>;
    // Bullet lists
    if (/^\s*[-*]\s/.test(line)) {
      const content = line.replace(/^\s*[-*]\s/, "");
      return <div key={i} className="flex gap-1.5 text-[11px] text-slate-200 leading-relaxed"><span className="text-slate-500 shrink-0">•</span><span>{formatInline(content)}</span></div>;
    }
    // Numbered lists
    if (/^\s*\d+\.\s/.test(line)) {
      const match = line.match(/^\s*(\d+)\.\s(.*)/);
      if (match) return <div key={i} className="flex gap-1.5 text-[11px] text-slate-200 leading-relaxed"><span className="text-slate-500 shrink-0 w-4 text-right">{match[1]}.</span><span>{formatInline(match[2])}</span></div>;
    }
    // Empty line
    if (!line.trim()) return <div key={i} className="h-1" />;
    // Normal paragraph
    return <p key={i} className="text-[11px] text-slate-200 leading-relaxed">{formatInline(line)}</p>;
  });
}

function formatInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;
  // Bold **text**
  while (remaining.includes("**")) {
    const start = remaining.indexOf("**");
    const end = remaining.indexOf("**", start + 2);
    if (end === -1) break;
    if (start > 0) parts.push(remaining.slice(0, start));
    parts.push(<strong key={keyIdx++} className="font-semibold text-white">{remaining.slice(start + 2, end)}</strong>);
    remaining = remaining.slice(end + 2);
  }
  if (remaining) parts.push(remaining);
  return parts.length > 0 ? parts : [text];
}

// ════════════════════════════════════════════════════════════
// AGENT CONFIG
// ════════════════════════════════════════════════════════════

const AGENT_CONFIG: Record<string, { label: string; emoji: string; color: string; bgClass: string; borderClass: string }> = {
  claude:              { label: "Claude",              emoji: "🏗️", color: "text-blue-300",    bgClass: "bg-blue-950/60",    borderClass: "border-blue-800/40" },
  gemini:              { label: "Gemini",              emoji: "🔍", color: "text-violet-300",  bgClass: "bg-violet-950/60",  borderClass: "border-violet-800/40" },
  "gemini-innovator":  { label: "Innovatör",           emoji: "🧪", color: "text-emerald-300", bgClass: "bg-emerald-950/60", borderClass: "border-emerald-800/40" },
  "gemini-verifier":   { label: "Verifierare",         emoji: "📊", color: "text-amber-300",   bgClass: "bg-amber-950/60",   borderClass: "border-amber-800/40" },
  ollama:              { label: "Ollama",              emoji: "🦙", color: "text-rose-300",    bgClass: "bg-rose-950/60",    borderClass: "border-rose-800/40" },
  system:              { label: "System",              emoji: "📋", color: "text-slate-300",   bgClass: "bg-slate-800/60",   borderClass: "border-slate-700/40" },
};

const PHASE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  start:      { label: "Start",       emoji: "🚀", color: "text-blue-400" },
  analyze:    { label: "Analys",      emoji: "🔍", color: "text-purple-400" },
  discuss:    { label: "Diskussion",  emoji: "💬", color: "text-emerald-400" },
  steelman:   { label: "Steel Man",   emoji: "🛡️", color: "text-cyan-400" },
  redteam:    { label: "Red Team",    emoji: "🔴", color: "text-red-400" },
  synthesize: { label: "Syntes",      emoji: "🧬", color: "text-amber-400" },
  conclude:   { label: "Slutsats",    emoji: "📋", color: "text-green-400" },
};

// ════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════

export default function ResearchLabView() {
  const [mainTab, setMainTab] = useState<MainTab>("research");

  // ── Research state ──
  const [researchMessages, setResearchMessages] = useState<ResearchMessage[]>([]);
  const [researchInput, setResearchInput] = useState("");
  const [researchRunning, setResearchRunning] = useState(false);
  const [researchStatus, setResearchStatus] = useState<{ thinking: string | null; round: number; maxRounds: number; phase: string; done?: boolean } | null>(null);
  const [sharedMemories, setSharedMemories] = useState<SharedMemoryItem[]>([]);
  const [showMemories, setShowMemories] = useState(false);
  const [researchMode, setResearchMode] = useState<"full" | "quick" | "adversarial" | "deepdive">("full");
  const [researchRounds, setResearchRounds] = useState(8);
  const researchEndRef = useRef<HTMLDivElement>(null);

  // ── Battle state ──
  const [battlePhase, setBattlePhase] = useState<BattlePhase>("idle");
  const [battleEvents, setBattleEvents] = useState<BattleEvent[]>([]);
  const [battleRounds, setBattleRounds] = useState<RoundResult[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [frankScore, setFrankScore] = useState(0);
  const [bareScore, setBareScore] = useState(0);
  const [battleThinking, setBattleThinking] = useState("");
  const [currentTask, setCurrentTask] = useState<BattleEvent["task"] | null>(null);
  const [finalResult, setFinalResult] = useState<BattleEvent | null>(null);
  const [cfgDifficulty, setCfgDifficulty] = useState(0);
  const [cfgTasks, setCfgTasks] = useState(5);
  const [cfgCategory, setCfgCategory] = useState("");
  const [frankModel, setFrankModel] = useState("");
  const [bareModel, setBareModel] = useState("");

  // ── Stack/Stats state ──
  const [selfStats, setSelfStats] = useState<SelfImproveStats | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stackSubTab, setStackSubTab] = useState<"overview" | "skills" | "memories" | "training">("overview");

  // ── New: participants, ranking, progress, wellbeing ──
  const [participants, setParticipants] = useState<ArenaParticipantInfo[]>([]);
  const [ranking, setRanking] = useState<AgentRanking[]>([]);
  const [frankProgress, setFrankProgress] = useState<FrankensteinProgress | null>(null);
  const [wellbeing, setWellbeing] = useState<Wellbeing | null>(null);
  const [expandedMsgs, setExpandedMsgs] = useState<Set<string>>(new Set());
  const [votedMsgs, setVotedMsgs] = useState<Record<string, "up" | "down">>({});

  // ── Session history, AB test, memory search ──
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [abTestResult, setAbTestResult] = useState<ABTestResult | null>(null);
  const [memorySearch, setMemorySearch] = useState("");
  const [battleHistory, setBattleHistory] = useState<BattleEvent[]>([]);

  const wsRef = useRef<any>(null);

  // ── Socket.IO ──
  useEffect(() => {
    let socket: any = null;
    const connectSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
        wsRef.current = socket;

        // Research events
        socket.on("arena_message", (msg: ResearchMessage) => {
          setResearchMessages(prev => [...prev, msg]);
        });
        socket.on("arena_status", (status: any) => {
          setResearchStatus(status);
          if (status.done) setResearchRunning(false);
        });
        socket.on("arena_memory", (mem: SharedMemoryItem) => {
          setSharedMemories(prev => [...prev, mem]);
        });

        // Battle events
        socket.on("battle_event", (data: { battle_id: string; event: BattleEvent }) => {
          const ev = data.event;
          setBattleEvents(prev => [...prev, ev]);
          handleBattleEvent(ev);
        });
      } catch { /* Socket.IO not available */ }
    };
    connectSocket();
    return () => { socket?.disconnect(); };
  }, []);

  // Auto-scroll research
  useEffect(() => {
    researchEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [researchMessages]);

  // Load initial data
  useEffect(() => {
    // Research messages
    fetch(`${BRIDGE_URL}/api/arena/messages`).then(r => r.json()).then(setResearchMessages).catch(() => {});
    // Shared memories
    fetch(`${BRIDGE_URL}/api/shared-memory`).then(r => r.json()).then(setSharedMemories).catch(() => {});
    // Arena status
    fetch(`${BRIDGE_URL}/api/arena/status`).then(r => r.json()).then(data => {
      if (data.running) setResearchRunning(true);
    }).catch(() => {});
    // Battle status
    fetch(`${BRIDGE_URL}/api/frankenstein/battle/status`).then(r => r.json()).then(data => {
      if (data.active) {
        setBattlePhase("running");
        for (const ev of data.events || []) handleBattleEvent(ev);
      }
    }).catch(() => {});
    // Self-improve stats + Frankenstein progress
    fetchStackData();
    fetchResearchMeta();
  }, []);

  const fetchStackData = useCallback(() => {
    fetch(`${BRIDGE_URL}/api/self-improve/stats`).then(r => r.json()).then(setSelfStats).catch(() => {});
    fetch(`${BRIDGE_URL}/api/self-improve/skills`).then(r => r.json()).then(setSkills).catch(() => {});
    fetch(`${BRIDGE_URL}/api/frankenstein/progress`).then(r => r.json()).then(setFrankProgress).catch(() => {});
    fetch(`${BRIDGE_URL}/api/frankenstein/wellbeing`).then(r => r.json()).then(setWellbeing).catch(() => {});
    fetch(`${BRIDGE_URL}/api/frankenstein/ab-test`).then(r => r.json()).then(setAbTestResult).catch(() => {});
  }, []);

  const fetchResearchMeta = useCallback(() => {
    fetch(`${BRIDGE_URL}/api/arena/participants`).then(r => r.json()).then(setParticipants).catch(() => {});
    fetch(`${BRIDGE_URL}/api/arena/ranking`).then(r => r.json()).then(setRanking).catch(() => {});
    fetch(`${BRIDGE_URL}/api/arena/sessions`).then(r => r.json()).then(setSessionHistory).catch(() => {});
  }, []);

  // Auto-refresh when research is running
  useEffect(() => {
    if (!researchRunning) return;
    const interval = setInterval(() => {
      fetchResearchMeta();
    }, 10000);
    return () => clearInterval(interval);
  }, [researchRunning, fetchResearchMeta]);

  // ── Battle event handler ──
  const handleBattleEvent = useCallback((ev: BattleEvent) => {
    switch (ev.type) {
      case "battle_start":
        setTotalRounds(ev.num_tasks || 0);
        if (ev.frankenstein_model) setFrankModel(ev.frankenstein_model);
        if (ev.bare_model) setBareModel(ev.bare_model);
        setBattlePhase("running");
        break;
      case "round_start":
        setCurrentRound(ev.round || 0);
        setCurrentTask(ev.task || null);
        setBattleThinking("");
        if (ev.task && ev.round) {
          setBattleRounds(prev => {
            const updated = [...prev];
            const idx = ev.round! - 1;
            if (!updated[idx]) {
              updated[idx] = {
                round: ev.round!, task: ev.task!,
                frank: { solved: false, score: 0, time_ms: 0, attempts: 0, strategy: "", first_try: false, hdc_concept: "", hdc_is_new: false, hdc_confidence: 0, aif_surprise: 0 },
                bare: { solved: false, score: 0, time_ms: 0, attempts: 0, first_try: false },
              };
            } else { updated[idx].task = ev.task!; }
            return updated;
          });
        }
        break;
      case "agent_thinking":
        setBattleThinking(ev.agent || "");
        break;
      case "agent_result":
        setBattleThinking("");
        if (ev.agent === "frankenstein" && ev.round) {
          setBattleRounds(prev => {
            const updated = [...prev];
            const idx = ev.round! - 1;
            if (!updated[idx]) {
              updated[idx] = { round: ev.round!, task: { id: "", title: "", difficulty: 0, category: "" },
                frank: { solved: false, score: 0, time_ms: 0, attempts: 0, strategy: "", first_try: false, hdc_concept: "", hdc_is_new: false, hdc_confidence: 0, aif_surprise: 0 },
                bare: { solved: false, score: 0, time_ms: 0, attempts: 0, first_try: false } };
            }
            updated[idx].frank = {
              solved: ev.solved || false, score: ev.score || 0, time_ms: ev.time_ms || 0,
              attempts: ev.attempts || 0, strategy: ev.strategy || "", first_try: ev.first_try || false,
              hdc_concept: ev.hdc_concept || "", hdc_is_new: ev.hdc_is_new || false,
              hdc_confidence: ev.hdc_confidence || 0, aif_surprise: ev.aif_surprise || 0,
            };
            return updated;
          });
        }
        if (ev.agent === "bare_llm" && ev.round) {
          setBattleRounds(prev => {
            const updated = [...prev];
            const idx = ev.round! - 1;
            if (!updated[idx]) {
              updated[idx] = { round: ev.round!, task: { id: "", title: "", difficulty: 0, category: "" },
                frank: { solved: false, score: 0, time_ms: 0, attempts: 0, strategy: "", first_try: false, hdc_concept: "", hdc_is_new: false, hdc_confidence: 0, aif_surprise: 0 },
                bare: { solved: false, score: 0, time_ms: 0, attempts: 0, first_try: false } };
            }
            updated[idx].bare = {
              solved: ev.solved || false, score: ev.score || 0, time_ms: ev.time_ms || 0,
              attempts: ev.attempts || 0, first_try: ev.first_try || false,
            };
            return updated;
          });
        }
        break;
      case "round_end":
        setFrankScore(ev.frank_score || 0);
        setBareScore(ev.bare_score || 0);
        break;
      case "battle_end":
        setFinalResult(ev);
        setBattlePhase("finished");
        break;
      case "battle_stopped":
        setBattlePhase("idle");
        break;
    }
  }, []);

  // ── Research actions ──
  const startResearch = useCallback(async () => {
    if (!researchInput.trim()) return;
    setResearchRunning(true);
    try {
      await fetch(`${BRIDGE_URL}/api/arena/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: researchInput.trim(), rounds: researchRounds, mode: researchMode }),
      });
    } catch { setResearchRunning(false); }
  }, [researchInput, researchRounds, researchMode]);

  const stopResearch = useCallback(async () => {
    await fetch(`${BRIDGE_URL}/api/arena/stop`, { method: "POST" });
    setResearchRunning(false);
  }, []);

  const clearResearch = useCallback(async () => {
    await fetch(`${BRIDGE_URL}/api/arena/clear`, { method: "POST" });
    setResearchMessages([]);
    setSharedMemories([]);
  }, []);

  const voteMessage = useCallback(async (messageId: string, direction: "up" | "down") => {
    try {
      await fetch(`${BRIDGE_URL}/api/arena/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, direction }),
      });
      setVotedMsgs(prev => ({ ...prev, [messageId]: direction }));
      setResearchMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const votes = m.votes || { up: 0, down: 0 };
        return { ...m, votes: { ...votes, [direction]: votes[direction] + 1 } };
      }));
      fetchResearchMeta();
    } catch { /* ignore */ }
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedMsgs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Computed: phase progress for timeline
  const phaseTimeline = useMemo(() => {
    const phases = ["analyze", "discuss", "synthesize", "conclude"];
    const currentPhase = researchStatus?.phase || "";
    const currentIdx = phases.indexOf(currentPhase);
    return phases.map((p, i) => ({
      ...PHASE_LABELS[p],
      id: p,
      status: i < currentIdx ? "done" as const : i === currentIdx ? "active" as const : "pending" as const,
    }));
  }, [researchStatus?.phase]);

  // Computed: message count per agent
  const agentMsgCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of researchMessages) {
      if (m.role !== "system") counts[m.role] = (counts[m.role] || 0) + 1;
    }
    return counts;
  }, [researchMessages]);

  // Computed: consensus meter (how much agents agree based on votes)
  const consensusMeter = useMemo(() => {
    const msgs = researchMessages.filter(m => m.role !== "system" && m.votes);
    if (msgs.length === 0) return null;
    const totalUp = msgs.reduce((s, m) => s + (m.votes?.up || 0), 0);
    const totalDown = msgs.reduce((s, m) => s + (m.votes?.down || 0), 0);
    const total = totalUp + totalDown;
    if (total === 0) return null;
    return Math.round((totalUp / total) * 100);
  }, [researchMessages]);

  // Computed: filtered memories for search
  const filteredMemories = useMemo(() => {
    if (!memorySearch.trim()) return sharedMemories;
    const q = memorySearch.toLowerCase();
    return sharedMemories.filter(m =>
      m.content.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      m.author.toLowerCase().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [sharedMemories, memorySearch]);

  // Computed: research stats for empty state
  const researchStats = useMemo(() => ({
    totalSessions: sessionHistory.length,
    totalMessages: researchMessages.length,
    totalMemories: sharedMemories.length,
    activeAgents: participants.filter(p => p.enabled).length,
  }), [sessionHistory, researchMessages, sharedMemories, participants]);

  const exportResearch = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/arena/export`);
      const data = await res.json();
      const blob = new Blob([data.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `research-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, []);

  // ── Battle actions ──
  const startBattle = useCallback(async () => {
    setBattleEvents([]);
    setBattleRounds([]);
    setFrankScore(0);
    setBareScore(0);
    setCurrentRound(0);
    setFinalResult(null);
    setBattleThinking("");
    setCurrentTask(null);
    setBattlePhase("running");
    try {
      const res = await fetch(`${BRIDGE_URL}/api/frankenstein/battle/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: cfgDifficulty, num_tasks: cfgTasks, category: cfgCategory }),
      });
      const data = await res.json();
      if (data.error) { setBattlePhase("idle"); alert(data.error); }
    } catch { setBattlePhase("idle"); }
  }, [cfgDifficulty, cfgTasks, cfgCategory]);

  const stopBattle = useCallback(async () => {
    await fetch(`${BRIDGE_URL}/api/frankenstein/battle/stop`, { method: "POST" });
    setBattlePhase("idle");
  }, []);

  const categories = [
    "", "arithmetic", "string", "list", "pattern", "number_theory",
    "dict", "algorithm", "recursion", "matrix", "sorting",
    "string_advanced", "data_structure", "linked_list",
    "functional", "graph", "dp", "combinatorics",
  ];

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Microscope className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">AI Research Lab</h1>
              <p className="text-[10px] text-slate-500">Djupforskning med alla AI:er + Frankenstein-stack</p>
            </div>
          </div>
          {researchRunning && (
            <span className="flex items-center gap-1 text-[10px] bg-red-900/60 text-red-400 px-2 py-0.5 rounded-full border border-red-700/50">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* Main tabs */}
        <div className="flex gap-1">
          {([
            { id: "research" as MainTab, label: "🔬 Forskning", icon: FlaskConical, badge: researchMessages.length > 0 ? researchMessages.length : 0 },
            { id: "battle" as MainTab, label: "⚔️ Tävling", icon: Swords, badge: battlePhase === "running" ? currentRound : 0 },
            { id: "stack" as MainTab, label: "🧠 Stack & Stats", icon: Layers, badge: 0 },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setMainTab(t.id)}
              className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all relative ${
                mainTab === t.id
                  ? "bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg shadow-purple-900/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge > 0 && mainTab !== t.id && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] font-bold bg-purple-500 text-white rounded-full px-0.5">
                  {t.badge > 99 ? "99+" : t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* RESEARCH TAB */}
      {/* ══════════════════════════════════════════════════════ */}
      {mainTab === "research" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Research input */}
          <div className="shrink-0 px-3 py-2">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={researchInput}
                  onChange={e => setResearchInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !researchRunning && startResearch()}
                  placeholder="Ange forskningsämne... t.ex. 'Kvantdatorers påverkan på kryptografi'"
                  className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  disabled={researchRunning}
                />
                {researchRunning ? (
                  <button onClick={stopResearch} className="px-3 py-2 bg-red-600/80 hover:bg-red-500/80 text-white rounded-lg transition-colors" title="Stoppa">
                    <Square className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={startResearch} disabled={!researchInput.trim()} className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white rounded-lg transition-all" title="Starta forskning">
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Config row */}
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Läge:</span>
                  {([
                    { id: "full", label: "🔬 Standard", tip: "4-fas forskning" },
                    { id: "quick", label: "⚡ Snabb", tip: "Diskussion + slutsats" },
                    { id: "adversarial", label: "⚔️ Adversarial", tip: "Steel Man + Red Team" },
                    { id: "deepdive", label: "🌊 Djupdyk", tip: "Dubbla analyser + Steel Man" },
                  ] as const).map(m => (
                    <button key={m.id} onClick={() => setResearchMode(m.id)} title={m.tip}
                      className={`px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                        researchMode === m.id ? "bg-purple-900/60 text-purple-300 border border-purple-700/40" : "text-slate-500 hover:text-slate-300"
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Rundor:</span>
                  {[4, 8, 12, 16].map(n => (
                    <button key={n} onClick={() => setResearchRounds(n)}
                      className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                        researchRounds === n ? "bg-purple-900/60 text-purple-300" : "text-slate-500 hover:text-slate-300"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex-1" />
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1 text-slate-500 hover:text-purple-300 transition-colors">
                  <History className="w-3 h-3" />
                  Historik
                </button>
                <button onClick={() => setShowMemories(!showMemories)} className="flex items-center gap-1 text-slate-500 hover:text-purple-300 transition-colors">
                  <Database className="w-3 h-3" />
                  Minnen ({sharedMemories.length})
                </button>
                <button onClick={exportResearch} className="text-slate-500 hover:text-white transition-colors" title="Exportera">
                  <Download className="w-3 h-3" />
                </button>
                <button onClick={clearResearch} className="text-slate-500 hover:text-red-400 transition-colors" title="Rensa">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Phase timeline + participants */}
          {(researchRunning || researchMessages.length > 0) && (
            <div className="shrink-0 px-3 pb-1 space-y-1.5">
              {/* Phase timeline */}
              <div className="flex items-center gap-0.5">
                {phaseTimeline.map((p, i) => (
                  <div key={p.id} className="flex items-center flex-1">
                    <div className={`flex-1 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      p.status === "active" ? "bg-purple-900/60 text-purple-200 border border-purple-700/50 shadow-sm shadow-purple-900/30" :
                      p.status === "done" ? "bg-green-900/30 text-green-300 border border-green-800/30" :
                      "bg-slate-800/40 text-slate-500 border border-slate-700/30"
                    }`}>
                      {p.status === "done" ? "✓" : p.status === "active" ? <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" /> : <span className="w-1.5 h-1.5 bg-slate-600 rounded-full" />}
                      <span className="truncate">{p.emoji} {p.label}</span>
                    </div>
                    {i < phaseTimeline.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600 shrink-0 mx-0.5" />}
                  </div>
                ))}
              </div>

              {/* Participants row */}
              {participants.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto">
                  <Users className="w-3 h-3 text-slate-500 shrink-0" />
                  {participants.map(p => {
                    const isThinking = researchStatus?.thinking === p.id;
                    const msgCount = agentMsgCounts[p.id] || 0;
                    return (
                      <div key={p.id} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium shrink-0 transition-all ${
                        isThinking ? "bg-purple-900/60 text-purple-200 border border-purple-600/50 animate-pulse" :
                        msgCount > 0 ? "bg-slate-700/60 text-slate-300 border border-slate-600/40" :
                        "bg-slate-800/30 text-slate-500 border border-slate-700/20"
                      }`}>
                        <span>{p.emoji}</span>
                        <span>{p.name}</span>
                        {msgCount > 0 && <span className="text-slate-500">({msgCount})</span>}
                      </div>
                    );
                  })}
                  {researchRunning && researchStatus && (
                    <span className="text-[9px] text-slate-500 ml-auto shrink-0">
                      R{researchStatus.round}/{researchStatus.maxRounds}
                    </span>
                  )}
                  {consensusMeter !== null && (
                    <div className="flex items-center gap-1 ml-auto shrink-0">
                      <span className="text-[8px] text-slate-500">Konsensus:</span>
                      <div className="w-12 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${consensusMeter >= 70 ? "bg-green-500" : consensusMeter >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${consensusMeter}%` }} />
                      </div>
                      <span className={`text-[8px] font-bold ${consensusMeter >= 70 ? "text-green-400" : consensusMeter >= 40 ? "text-amber-400" : "text-red-400"}`}>{consensusMeter}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Session history panel */}
          {showHistory && sessionHistory.length > 0 && (
            <div className="shrink-0 px-3 pb-1 max-h-32 overflow-y-auto">
              <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-2 space-y-1">
                <div className="text-[10px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <History className="w-3 h-3" /> Tidigare sessioner
                </div>
                {sessionHistory.slice(-10).reverse().map(s => (
                  <div key={s.id} className="flex items-center gap-2 text-[10px] py-0.5">
                    <span className="text-slate-500 shrink-0">{new Date(s.startedAt).toLocaleDateString("sv-SE", { month: "short", day: "numeric" })}</span>
                    <span className="text-white font-medium truncate">{s.topic}</span>
                    <span className="text-slate-600 shrink-0 ml-auto">{s.messageCount} msg</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded shrink-0 ${
                      s.phase === "conclude" ? "bg-green-900/40 text-green-400" : "bg-slate-700/40 text-slate-400"
                    }`}>{s.phase === "conclude" ? "Klar" : s.phase}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared memories panel */}
          {showMemories && sharedMemories.length > 0 && (
            <div className="shrink-0 px-3 pb-1 max-h-40 overflow-y-auto">
              <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-2 space-y-1">
                <div className="text-[10px] font-bold text-amber-300 mb-1">💡 Delade insikter & minnen</div>
                {sharedMemories.slice(-15).map(m => (
                  <div key={m.id} className="flex items-start gap-1.5 text-[10px]">
                    <span className={`shrink-0 px-1 py-0.5 rounded font-medium ${
                      m.type === "insight" ? "bg-purple-900/60 text-purple-300" :
                      m.type === "decision" ? "bg-green-900/60 text-green-300" :
                      m.type === "question" ? "bg-blue-900/60 text-blue-300" :
                      m.type === "finding" ? "bg-amber-900/60 text-amber-300" :
                      "bg-slate-700/60 text-slate-300"
                    }`}>{m.type}</span>
                    <span className="text-slate-300 leading-tight">{m.content}</span>
                    <span className="shrink-0 text-slate-600 ml-auto">{m.author}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research messages */}
          <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1.5">
            {researchMessages.length === 0 && !researchRunning && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/30 flex items-center justify-center">
                  <Microscope className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">AI Research Lab</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Ange ett forskningsämne ovan. Alla tillgängliga AI:er samarbetar med Frankenstein-stacken
                    (HDC, AIF, Ebbinghaus-minne) för djupforskning.
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
                  <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-purple-300">{researchStats.totalSessions}</div>
                    <div className="text-[8px] text-slate-500">Sessioner</div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-blue-300">{researchStats.activeAgents}</div>
                    <div className="text-[8px] text-slate-500">AI:er</div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-amber-300">{researchStats.totalMemories}</div>
                    <div className="text-[8px] text-slate-500">Minnen</div>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/30 rounded-lg p-2 text-center">
                    <div className="text-sm font-bold text-green-300">{ranking.length > 0 ? `${ranking[0]?.agent?.slice(0, 6)}..` : "—"}</div>
                    <div className="text-[8px] text-slate-500">Topp-AI</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
                  {["Kvantdatorers framtid", "AI-medvetande", "Mörk materia", "CRISPR-etik", "Fusion-energi", "Neuroplasticitet", "AGI-risker", "Rymdkolonisering"].map(topic => (
                    <button key={topic} onClick={() => setResearchInput(topic)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-purple-300 hover:border-purple-700/40 transition-colors">
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {researchMessages.map(msg => {
              const agent = AGENT_CONFIG[msg.role] || AGENT_CONFIG.system;
              const phaseInfo = msg.phase ? PHASE_LABELS[msg.phase] : null;
              const isExpanded = expandedMsgs.has(msg.id);
              const isLong = msg.content.length > 300;
              const voted = votedMsgs[msg.id];

              if (msg.role === "system") {
                return (
                  <div key={msg.id} className="flex items-center gap-2 py-1.5">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      phaseInfo ? `${phaseInfo.color} bg-slate-800/60 border-slate-700/40` : "text-slate-400 bg-slate-800/40 border-slate-700/30"
                    }`}>
                      {phaseInfo ? `${phaseInfo.emoji} ${phaseInfo.label}` : msg.content}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`${agent.bgClass} border ${agent.borderClass} rounded-xl p-2.5 transition-all hover:border-opacity-70`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px]">{agent.emoji}</span>
                    <span className={`text-[11px] font-bold ${agent.color}`}>{agent.label}</span>
                    {msg.stack && (
                      <span className="text-[8px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-700/30">
                        HDC:{msg.stack.hdc_concepts} AIF:{msg.stack.aif_surprise?.toFixed(1)} Mem:{msg.stack.memory_active}
                      </span>
                    )}
                    {msg.surpriseScore != null && msg.surpriseScore > 0.4 && (
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-medium ${
                        msg.surpriseScore > 0.7
                          ? "bg-red-900/40 text-red-300 border-red-700/30"
                          : msg.surpriseScore > 0.5
                            ? "bg-amber-900/40 text-amber-300 border-amber-700/30"
                            : "bg-cyan-900/40 text-cyan-300 border-cyan-700/30"
                      }`}>
                        🎯 {Math.round(msg.surpriseScore * 100)}% överraskning
                      </span>
                    )}
                    <span className="text-[9px] text-slate-600 ml-auto">
                      {new Date(msg.timestamp).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className={`text-[11px] leading-relaxed break-words ${
                    isLong && !isExpanded ? "line-clamp-6" : ""
                  }`}>
                    {renderMarkdown(msg.content)}
                  </div>
                  {isLong && (
                    <button onClick={() => toggleExpand(msg.id)} className="text-[9px] text-purple-400 hover:text-purple-300 mt-0.5 flex items-center gap-0.5">
                      {isExpanded ? <><ChevronUp className="w-2.5 h-2.5" /> Visa mindre</> : <><ChevronDown className="w-2.5 h-2.5" /> Visa mer ({msg.content.length} tecken)</>}
                    </button>
                  )}
                  {/* Footer: memory + votes */}
                  <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-white/5">
                    {msg.memoryId && (
                      <span className="text-[8px] text-amber-400/70 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Insikt sparad
                      </span>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={() => voteMessage(msg.id, "up")} disabled={!!voted}
                        className={`p-0.5 rounded transition-colors ${voted === "up" ? "text-green-400" : "text-slate-600 hover:text-green-400"}`} title="Bra bidrag">
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      {(msg.votes?.up || 0) > 0 && <span className="text-[8px] text-green-400/70">{msg.votes?.up}</span>}
                      <button onClick={() => voteMessage(msg.id, "down")} disabled={!!voted}
                        className={`p-0.5 rounded transition-colors ${voted === "down" ? "text-red-400" : "text-slate-600 hover:text-red-400"}`} title="Svagt bidrag">
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                      {(msg.votes?.down || 0) > 0 && <span className="text-[8px] text-red-400/70">{msg.votes?.down}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={researchEndRef} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* BATTLE TAB */}
      {/* ══════════════════════════════════════════════════════ */}
      {mainTab === "battle" && (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {battlePhase === "idle" && (
            <>
              {/* Battle config */}
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Frankenstein vs Ren LLM</h3>
                    <p className="text-[10px] text-slate-500">Samma LLM — men Frankenstein har HDC + AIF + Ebbinghaus</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">Antal uppgifter</label>
                    <div className="flex gap-1.5">
                      {[3, 5, 8, 10].map(n => (
                        <button key={n} onClick={() => setCfgTasks(n)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            cfgTasks === n ? "bg-purple-600 text-white" : "bg-slate-700/60 text-slate-400 hover:text-white"
                          }`}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">Svårighetsgrad</label>
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => setCfgDifficulty(0)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          cfgDifficulty === 0 ? "bg-purple-600 text-white" : "bg-slate-700/60 text-slate-400 hover:text-white"
                        }`}>Blandad</button>
                      {[3, 4, 5, 6, 7, 8].map(d => (
                        <button key={d} onClick={() => setCfgDifficulty(d)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            cfgDifficulty === d ? "bg-purple-600 text-white" : "bg-slate-700/60 text-slate-400 hover:text-white"
                          }`}>Nv{d}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">Kategori</label>
                    <select value={cfgCategory} onChange={e => setCfgCategory(e.target.value)} aria-label="Välj kategori"
                      className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-1.5 text-xs text-white">
                      <option value="">Alla kategorier</option>
                      {categories.filter(c => c).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <button onClick={startBattle}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30 text-sm">
                    <Play className="w-4 h-4" />
                    Starta Battle!
                  </button>
                </div>
              </div>

              {/* Previous result */}
              {finalResult && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
                  <div className="text-[10px] text-slate-500 mb-2">Senaste resultat</div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-400">{finalResult.frank_score}</div>
                      <div className="text-[10px] text-slate-500">Frankenstein</div>
                    </div>
                    <div className="text-sm text-slate-500">vs</div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-400">{finalResult.bare_score}</div>
                      <div className="text-[10px] text-slate-500">Ren LLM</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Running / Finished battle */}
          {(battlePhase === "running" || battlePhase === "finished") && (
            <>
              {/* Scoreboard */}
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-800/60 to-orange-950/60 border border-slate-700/50 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Battle</span>
                    {battlePhase === "running" && (
                      <span className="flex items-center gap-1 text-[9px] bg-red-900/60 text-red-400 px-1.5 py-0.5 rounded-full">
                        <span className="w-1 h-1 bg-red-400 rounded-full animate-pulse" /> LIVE
                      </span>
                    )}
                  </div>
                  {battlePhase === "running" && (
                    <button onClick={stopBattle} className="p-1 rounded text-red-400 hover:bg-red-900/30" title="Stoppa">
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {battlePhase === "finished" && (
                    <button onClick={() => setBattlePhase("idle")} className="p-1 rounded text-slate-400 hover:text-white" title="Ny battle">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[10px] font-bold text-purple-300">FRANKENSTEIN</span>
                    </div>
                    <div className={`text-3xl font-black ${frankScore > bareScore ? "text-purple-400" : "text-slate-300"}`}>{frankScore}</div>
                  </div>
                  <div className="flex flex-col items-center px-3">
                    <div className="text-sm font-bold text-slate-500">VS</div>
                    <div className="text-[10px] text-slate-600">{currentRound > 0 ? `${currentRound}/${totalRounds}` : ""}</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Zap className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[10px] font-bold text-orange-300">REN LLM</span>
                    </div>
                    <div className={`text-3xl font-black ${bareScore > frankScore ? "text-orange-400" : "text-slate-300"}`}>{bareScore}</div>
                  </div>
                </div>

                {totalRounds > 0 && (
                  <div className="mt-2 h-1 bg-slate-700/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${(currentRound / totalRounds) * 100}%` }} />
                  </div>
                )}
              </div>

              {/* Current thinking */}
              {battlePhase === "running" && (currentTask || battleThinking) && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5">
                  {currentTask && (
                    <div className="mb-1.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">Nv{currentTask.difficulty}</span>
                        <span className="text-[9px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{currentTask.category}</span>
                      </div>
                      <div className="text-xs font-medium text-white">{currentTask.title}</div>
                    </div>
                  )}
                  {battleThinking && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-slate-400">
                        {battleThinking === "frankenstein" ? "🧠 Frankenstein tänker..." : "📝 Ren LLM tänker..."}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Round results */}
              {battleRounds.map((r, i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-500 font-mono w-5">R{r.round}</span>
                      <span className="text-[10px] text-white font-medium truncate max-w-[160px]">{r.task?.title || "..."}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.task?.difficulty > 0 && <span className="text-[8px] bg-slate-700/60 text-slate-500 px-1 py-0.5 rounded">Nv{r.task.difficulty}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`rounded-lg p-1.5 ${r.frank.solved ? "bg-purple-900/20 border border-purple-800/30" : "bg-slate-900/30 border border-slate-700/20"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-purple-300">🧠</span>
                        <span className={`text-[9px] font-bold ${r.frank.solved ? "text-green-400" : "text-red-400"}`}>
                          {r.frank.solved ? "✅" : "❌"} {Math.round(r.frank.score * 100)}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        <span className="text-[8px] text-slate-500">{Math.round(r.frank.time_ms)}ms</span>
                        {r.frank.strategy && <span className="text-[8px] text-purple-400">{r.frank.strategy}</span>}
                        {r.frank.first_try && <span className="text-[8px] text-green-400">1st!</span>}
                        {r.frank.hdc_is_new && <span className="text-[8px] text-cyan-400">NEW</span>}
                      </div>
                    </div>
                    <div className={`rounded-lg p-1.5 ${r.bare.solved ? "bg-orange-900/20 border border-orange-800/30" : "bg-slate-900/30 border border-slate-700/20"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-orange-300">📝</span>
                        <span className={`text-[9px] font-bold ${r.bare.solved ? "text-green-400" : "text-red-400"}`}>
                          {r.bare.solved ? "✅" : "❌"} {Math.round(r.bare.score * 100)}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        <span className="text-[8px] text-slate-500">{Math.round(r.bare.time_ms)}ms</span>
                        {r.bare.first_try && <span className="text-[8px] text-green-400">1st!</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Winner banner */}
              {battlePhase === "finished" && finalResult && (
                <>
                  {/* Stack after battle */}
                  {finalResult.stack && (
                    <div className="bg-gradient-to-br from-purple-950/40 to-slate-800/40 border border-purple-800/30 rounded-xl p-3">
                      <h3 className="text-[11px] font-bold text-purple-300 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Frankenstein Stack
                      </h3>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="flex items-center gap-1"><Brain className="w-3 h-3 text-cyan-400" /><span className="text-slate-400">HDC:</span><span className="text-white font-medium">{finalResult.stack.hdc_concepts}</span></div>
                        <div className="flex items-center gap-1"><Activity className="w-3 h-3 text-rose-400" /><span className="text-slate-400">AIF:</span><span className="text-white font-medium">{finalResult.stack.aif_surprise?.toFixed(2)}</span></div>
                        <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-amber-400" /><span className="text-slate-400">Explore:</span><span className="text-white font-medium">{finalResult.stack.aif_exploration?.toFixed(2)}</span></div>
                        <div className="flex items-center gap-1"><Database className="w-3 h-3 text-emerald-400" /><span className="text-slate-400">Minnen:</span><span className="text-white font-medium">{finalResult.stack.memory_active}/{finalResult.stack.memory_stored}</span></div>
                      </div>
                      {finalResult.stack.strategy_stats && Object.keys(finalResult.stack.strategy_stats).length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-slate-700/30">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(finalResult.stack.strategy_stats).map(([name, st]) => (
                              <span key={name} className={`text-[8px] px-1.5 py-0.5 rounded-full border ${
                                st.attempts > 0 && st.successes / st.attempts >= 0.5
                                  ? "bg-green-900/30 text-green-300 border-green-700/30"
                                  : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                              }`}>{name}: {st.successes}/{st.attempts}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`rounded-2xl p-4 text-center ${
                    finalResult.winner === "frankenstein"
                      ? "bg-gradient-to-r from-purple-900/60 to-pink-900/60 border border-purple-700/50"
                      : finalResult.winner === "bare_llm"
                        ? "bg-gradient-to-r from-orange-900/60 to-amber-900/60 border border-orange-700/50"
                        : "bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-slate-600/50"
                  }`}>
                    <Trophy className={`w-7 h-7 mx-auto mb-1.5 ${
                      finalResult.winner === "frankenstein" ? "text-purple-400" : finalResult.winner === "bare_llm" ? "text-orange-400" : "text-slate-400"
                    }`} />
                    <div className="text-base font-bold text-white mb-0.5">
                      {finalResult.winner === "frankenstein" ? "🧠 Frankenstein vinner!" : finalResult.winner === "bare_llm" ? "📝 Ren LLM vinner!" : "🤝 Oavgjort!"}
                    </div>
                    <div className="text-xs text-slate-300">{finalResult.frank_score} - {finalResult.bare_score}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Frank: {Math.round((finalResult.frank_rate || 0) * 100)}% ({Math.round(finalResult.frank_avg_ms || 0)}ms)
                      {" · "}
                      LLM: {Math.round((finalResult.bare_rate || 0) * 100)}% ({Math.round(finalResult.bare_avg_ms || 0)}ms)
                    </div>
                    <button onClick={() => setBattlePhase("idle")}
                      className="mt-2 px-3 py-1.5 bg-slate-700/60 hover:bg-slate-600/60 text-white text-xs rounded-lg transition-colors">
                      <RotateCcw className="w-3 h-3 inline mr-1" /> Ny Battle
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* STACK & STATS TAB */}
      {/* ══════════════════════════════════════════════════════ */}
      {mainTab === "stack" && (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Sub-tabs */}
          <div className="flex gap-1 flex-wrap">
            {([
              { id: "overview" as const, label: "Översikt", icon: BarChart3 },
              { id: "training" as const, label: "Träning", icon: Flame },
              { id: "skills" as const, label: "Skills", icon: Zap },
              { id: "memories" as const, label: "Minnen", icon: Database },
            ]).map(t => (
              <button key={t.id} onClick={() => { setStackSubTab(t.id); fetchStackData(); }}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  stackSubTab === t.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                }`}>
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            ))}
            <button onClick={fetchStackData} className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors" title="Uppdatera">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Overview */}
          {stackSubTab === "overview" && (
            <div className="space-y-3">
              {/* Frankenstein hero card */}
              <div className="bg-gradient-to-br from-purple-950/50 via-slate-800/50 to-pink-950/30 border border-purple-800/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-purple-300 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Frankenstein AI
                  </h3>
                  {wellbeing && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{wellbeing.mood === "happy" ? "😊" : wellbeing.mood === "curious" ? "🤔" : wellbeing.mood === "frustrated" ? "😤" : wellbeing.mood === "tired" ? "😴" : "🧐"}</span>
                      <div className="flex items-center gap-0.5">
                        <Heart className={`w-3 h-3 ${wellbeing.energy > 0.5 ? "text-green-400" : "text-red-400"}`} />
                        <span className="text-[9px] text-slate-400">{Math.round(wellbeing.energy * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-slate-900/40 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-purple-300">{frankProgress ? Math.round(frankProgress.total_tasks_solved / Math.max(frankProgress.total_tasks_attempted, 1) * 100) : 0}%</div>
                    <div className="text-[9px] text-slate-500">Lösningsgrad</div>
                  </div>
                  <div className="bg-slate-900/40 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-cyan-300">Nv{frankProgress?.current_difficulty || 0}</div>
                    <div className="text-[9px] text-slate-500">Nivå</div>
                  </div>
                  <div className="bg-slate-900/40 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-amber-300">{frankProgress ? Object.keys(frankProgress.skills).length : 0}</div>
                    <div className="text-[9px] text-slate-500">Skills</div>
                  </div>
                  <div className="bg-slate-900/40 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-green-300">{frankProgress?.best_streak || 0}</div>
                    <div className="text-[9px] text-slate-500">Bästa streak</div>
                  </div>
                </div>

                {/* Solved / attempted */}
                {frankProgress && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400">🎯 {frankProgress.total_tasks_solved.toLocaleString()} / {frankProgress.total_tasks_attempted.toLocaleString()} uppgifter</span>
                      <span className="text-slate-500">{frankProgress.session_count} sessioner · {Math.round(frankProgress.total_training_seconds / 3600)}h</span>
                    </div>
                    <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${Math.round(frankProgress.total_tasks_solved / Math.max(frankProgress.total_tasks_attempted, 1) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Wellbeing bar */}
              {wellbeing && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 mb-2 font-medium">Mående</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Energi", value: wellbeing.energy, color: "bg-green-500", icon: Flame },
                      { label: "Nyfikenhet", value: wellbeing.curiosity, color: "bg-blue-500", icon: Search },
                      { label: "Självförtroende", value: wellbeing.confidence, color: "bg-purple-500", icon: Award },
                      { label: "Frustration", value: wellbeing.frustration, color: "bg-red-500", icon: Activity },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <m.icon className="w-3.5 h-3.5 mx-auto mb-0.5 text-slate-400" />
                        <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden mb-0.5">
                          <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${Math.round(m.value * 100)}%` }} />
                        </div>
                        <div className="text-[8px] text-slate-500">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {wellbeing.streak > 0 && (
                    <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Streak: {wellbeing.streak} i rad!
                    </div>
                  )}
                </div>
              )}

              {/* Agent ranking */}
              {ranking.length > 0 && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 mb-2 font-medium flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Agentranking (forskning)
                  </div>
                  <div className="space-y-1">
                    {ranking.slice(0, 5).map((r, i) => {
                      const agent = AGENT_CONFIG[r.agent];
                      return (
                        <div key={r.agent} className="flex items-center gap-2 text-[10px]">
                          <span className={`w-4 text-center font-bold ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-orange-400" : "text-slate-500"}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                          </span>
                          <span>{agent?.emoji || "🤖"}</span>
                          <span className={`font-medium ${agent?.color || "text-slate-300"}`}>{agent?.label || r.agent}</span>
                          <span className="text-slate-500 ml-auto">{r.messages} msg</span>
                          <span className="text-green-400">↑{r.up}</span>
                          <span className="text-red-400">↓{r.down}</span>
                          <span className="text-white font-medium w-6 text-right">{r.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Self-improve stats */}
              {selfStats && selfStats.evaluations.total > 0 && (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="text-[10px] text-slate-400 mb-2 font-medium">Självförbättring</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-sm font-bold text-amber-300">{selfStats.evaluations.avgScore || "—"}</div>
                      <div className="text-[9px] text-slate-500">Snittbetyg</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-bold ${(selfStats.evaluations.recentTrend || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {(selfStats.evaluations.recentTrend || 0) >= 0 ? "+" : ""}{selfStats.evaluations.recentTrend || 0}
                      </div>
                      <div className="text-[9px] text-slate-500">Trend</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-blue-300">{selfStats.reflections.total}</div>
                      <div className="text-[9px] text-slate-500">Reflektioner</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Learnings */}
              {selfStats?.learnings && selfStats.learnings.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-300">Insikter</span>
                  </div>
                  {selfStats.learnings.map((l, i) => (
                    <p key={i} className="text-[10px] text-slate-300 mb-0.5">{l}</p>
                  ))}
                </div>
              )}

              {!frankProgress && (!selfStats || selfStats.evaluations.total === 0) && sharedMemories.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Ingen data ännu</p>
                  <p className="text-[10px] text-slate-600">Starta en forskningssession eller battle för att se statistik</p>
                </div>
              )}
            </div>
          )}

          {/* Training */}
          {stackSubTab === "training" && (
            <div className="space-y-3">
              {frankProgress ? (
                <>
                  {/* Big numbers */}
                  <div className="bg-gradient-to-br from-purple-950/50 to-slate-800/50 border border-purple-800/30 rounded-2xl p-4">
                    <div className="text-center mb-3">
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {frankProgress.total_tasks_solved.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">uppgifter lösta av {frankProgress.total_tasks_attempted.toLocaleString()}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <Timer className="w-4 h-4 text-blue-400 mx-auto mb-0.5" />
                        <div className="text-sm font-bold text-white">{Math.round(frankProgress.total_training_seconds / 3600)}h</div>
                        <div className="text-[9px] text-slate-500">Träningstid</div>
                      </div>
                      <div>
                        <Hash className="w-4 h-4 text-green-400 mx-auto mb-0.5" />
                        <div className="text-sm font-bold text-white">{frankProgress.session_count}</div>
                        <div className="text-[9px] text-slate-500">Sessioner</div>
                      </div>
                      <div>
                        <Flame className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
                        <div className="text-sm font-bold text-white">{frankProgress.best_streak}</div>
                        <div className="text-[9px] text-slate-500">Bästa streak</div>
                      </div>
                    </div>
                  </div>

                  {/* Level stats */}
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 mb-2 font-medium flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> Per nivå
                    </div>
                    <div className="space-y-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(lvl => {
                        const ls = frankProgress.level_stats?.[String(lvl)] || { attempted: 0, solved: 0 };
                        const rate = ls.attempted > 0 ? ls.solved / ls.attempted : 0;
                        const isCurrentLevel = lvl === frankProgress.current_difficulty;
                        return (
                          <div key={lvl} className={`flex items-center gap-2 ${isCurrentLevel ? "bg-purple-900/20 rounded-lg px-2 py-1 border border-purple-800/30" : ""}`}>
                            <span className={`text-[10px] font-bold w-8 ${isCurrentLevel ? "text-purple-300" : "text-slate-400"}`}>Nv{lvl}</span>
                            <div className="flex-1 h-2 bg-slate-700/60 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${rate >= 0.9 ? "bg-green-500" : rate >= 0.7 ? "bg-blue-500" : rate >= 0.5 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${Math.round(rate * 100)}%` }} />
                            </div>
                            <span className="text-[9px] text-slate-400 w-16 text-right">{ls.solved}/{ls.attempted}</span>
                            <span className={`text-[9px] font-bold w-8 text-right ${rate >= 0.9 ? "text-green-400" : rate >= 0.7 ? "text-blue-400" : rate >= 0.5 ? "text-amber-400" : "text-red-400"}`}>
                              {ls.attempted > 0 ? `${Math.round(rate * 100)}%` : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stack info */}
                  {frankProgress.stack && (
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                      <div className="text-[10px] text-slate-400 mb-2 font-medium flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5" /> Frankenstein Stack
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5"><Brain className="w-3 h-3 text-cyan-400" /><span className="text-slate-400">HDC Koncept:</span><span className="text-white font-medium">{frankProgress.stack.hdc_concepts}</span></div>
                        <div className="flex items-center gap-1.5"><Eye className="w-3 h-3 text-amber-400" /><span className="text-slate-400">AIF Exploration:</span><span className="text-white font-medium">{frankProgress.stack.aif_exploration?.toFixed(2)}</span></div>
                        <div className="flex items-center gap-1.5"><Database className="w-3 h-3 text-emerald-400" /><span className="text-slate-400">Minnen aktiva:</span><span className="text-white font-medium">{frankProgress.stack.memory_active}</span></div>
                        <div className="flex items-center gap-1.5"><Database className="w-3 h-3 text-slate-400" /><span className="text-slate-400">Minnen totalt:</span><span className="text-white font-medium">{frankProgress.stack.memory_stored}</span></div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Ingen träningsdata</p>
                  <p className="text-[10px] text-slate-600">Starta Frankenstein-träning för att se progress här</p>
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {stackSubTab === "skills" && (
            <div className="space-y-2">
              {skills.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Inga skills ännu</p>
                  <p className="text-[10px] text-slate-600">Skills extraheras automatiskt under träning och forskning</p>
                </div>
              ) : (
                skills.map(s => (
                  <div key={s.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-white">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`w-2.5 h-2.5 ${i <= Math.round(s.avgScore) ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1">{s.description}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {s.toolChain.map((t, i) => (
                        <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-slate-700/60 text-blue-300 font-mono">{t.tool}</span>
                      ))}
                      <span className="text-[9px] text-slate-600 ml-auto">Använd {s.useCount}x</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Memories */}
          {stackSubTab === "memories" && (
            <div className="space-y-2">
              {/* Search bar */}
              {sharedMemories.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={memorySearch}
                    onChange={e => setMemorySearch(e.target.value)}
                    placeholder="Sök i minnen..."
                    className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                  {memorySearch && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">
                      {filteredMemories.length}/{sharedMemories.length}
                    </span>
                  )}
                </div>
              )}

              {/* Memory type filter chips */}
              {sharedMemories.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {["insight", "decision", "question", "finding", "todo"].map(type => {
                    const count = sharedMemories.filter(m => m.type === type).length;
                    if (count === 0) return null;
                    return (
                      <button key={type} onClick={() => setMemorySearch(memorySearch === type ? "" : type)}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                          memorySearch === type ? "bg-purple-900/60 text-purple-300 border border-purple-700/40" : "bg-slate-800/40 text-slate-500 border border-slate-700/30 hover:text-slate-300"
                        }`}>
                        {type} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {sharedMemories.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Inga delade minnen ännu</p>
                  <p className="text-[10px] text-slate-600">Minnen skapas automatiskt under forskningssessioner</p>
                </div>
              ) : filteredMemories.length === 0 ? (
                <div className="text-center py-4">
                  <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Inga träffar för "{memorySearch}"</p>
                </div>
              ) : (
                filteredMemories.slice().reverse().map(m => (
                  <div key={m.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        m.type === "insight" ? "bg-purple-900/60 text-purple-300" :
                        m.type === "decision" ? "bg-green-900/60 text-green-300" :
                        m.type === "question" ? "bg-blue-900/60 text-blue-300" :
                        m.type === "finding" ? "bg-amber-900/60 text-amber-300" :
                        m.type === "todo" ? "bg-red-900/60 text-red-300" :
                        "bg-slate-700/60 text-slate-300"
                      }`}>{m.type}</span>
                      <span className="text-[9px] text-slate-500">{m.author}</span>
                      <span className="text-[9px] text-slate-600 ml-auto">
                        {new Date(m.timestamp).toLocaleDateString("sv-SE", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed">{m.content}</p>
                    {m.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {m.tags.map((tag, i) => (
                          <span key={i} className="text-[8px] px-1 py-0.5 rounded bg-slate-700/40 text-slate-500">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
