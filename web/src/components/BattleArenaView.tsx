import { useState, useEffect, useCallback, useRef } from "react";
import { BRIDGE_URL } from "../config";
import {
  Swords, Brain, Zap, Play, Square, Trophy, Clock, Target,
  Activity, Eye, Database, Sparkles, ChevronRight, RotateCcw,
} from "lucide-react";

// === TYPES ===

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
  task?: {
    id: string;
    title: string;
    difficulty: number;
    category: string;
    description: string;
  };
  stack?: {
    hdc_concepts: number;
    aif_surprise: number;
    aif_exploration: number;
    memory_active: number;
    memory_stored: number;
    strategy_stats: Record<string, { attempts: number; successes: number }>;
  };
  timestamp?: number;
}

interface RoundResult {
  round: number;
  task: { id: string; title: string; difficulty: number; category: string };
  frank: { solved: boolean; score: number; time_ms: number; attempts: number; strategy: string; first_try: boolean; hdc_concept: string; hdc_is_new: boolean; hdc_confidence: number; aif_surprise: number };
  bare: { solved: boolean; score: number; time_ms: number; attempts: number; first_try: boolean };
}

type BattlePhase = "idle" | "configuring" | "running" | "finished";

// === COMPONENT ===

export default function BattleArenaView() {
  const [phase, setPhase] = useState<BattlePhase>("idle");
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [frankScore, setFrankScore] = useState(0);
  const [bareScore, setBareScore] = useState(0);
  const [thinking, setThinking] = useState<string>("");
  const [currentTask, setCurrentTask] = useState<BattleEvent["task"] | null>(null);
  const [finalResult, setFinalResult] = useState<BattleEvent | null>(null);
  const [battleId, setBattleId] = useState("");
  const [frankModel, setFrankModel] = useState("");
  const [bareModel, setBareModel] = useState("");

  // Config
  const [cfgDifficulty, setCfgDifficulty] = useState(0);
  const [cfgTasks, setCfgTasks] = useState(5);
  const [cfgCategory, setCfgCategory] = useState("");

  const eventsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any>(null);

  // Socket.IO listener
  useEffect(() => {
    let socket: any = null;
    const connectSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
        wsRef.current = socket;

        socket.on("battle_event", (data: { battle_id: string; event: BattleEvent }) => {
          const ev = data.event;
          setEvents(prev => [...prev, ev]);

          switch (ev.type) {
            case "battle_start":
              setTotalRounds(ev.num_tasks || 0);
              setBattleId(ev.battle_id || "");
              if (ev.frankenstein_model) setFrankModel(ev.frankenstein_model);
              if (ev.bare_model) setBareModel(ev.bare_model);
              break;

            case "round_start":
              setCurrentRound(ev.round || 0);
              setCurrentTask(ev.task || null);
              setThinking("");
              if (ev.task && ev.round) {
                setRounds(prev => {
                  const updated = [...prev];
                  const idx = ev.round! - 1;
                  if (!updated[idx]) {
                    updated[idx] = {
                      round: ev.round!,
                      task: ev.task!,
                      frank: { solved: false, score: 0, time_ms: 0, attempts: 0, strategy: "", first_try: false, hdc_concept: "", hdc_is_new: false, hdc_confidence: 0, aif_surprise: 0 },
                      bare: { solved: false, score: 0, time_ms: 0, attempts: 0, first_try: false },
                    };
                  } else {
                    updated[idx].task = ev.task!;
                  }
                  return updated;
                });
              }
              break;

            case "agent_thinking":
              setThinking(ev.agent || "");
              break;

            case "agent_result":
              setThinking("");
              if (ev.agent === "frankenstein" && ev.round) {
                setRounds(prev => {
                  const updated = [...prev];
                  const idx = ev.round! - 1;
                  if (!updated[idx]) {
                    updated[idx] = {
                      round: ev.round!,
                      task: { id: "", title: "", difficulty: 0, category: "" },
                      frank: { solved: false, score: 0, time_ms: 0, attempts: 0, strategy: "", first_try: false, hdc_concept: "", hdc_is_new: false, hdc_confidence: 0, aif_surprise: 0 },
                      bare: { solved: false, score: 0, time_ms: 0, attempts: 0, first_try: false },
                    };
                  }
                  updated[idx].frank = {
                    solved: ev.solved || false,
                    score: ev.score || 0,
                    time_ms: ev.time_ms || 0,
                    attempts: ev.attempts || 0,
                    strategy: ev.strategy || "",
                    first_try: ev.first_try || false,
                    hdc_concept: ev.hdc_concept || "",
                    hdc_is_new: ev.hdc_is_new || false,
                    hdc_confidence: ev.hdc_confidence || 0,
                    aif_surprise: ev.aif_surprise || 0,
                  };
                  return updated;
                });
              }
              if (ev.agent === "bare_llm" && ev.round) {
                setRounds(prev => {
                  const updated = [...prev];
                  const idx = ev.round! - 1;
                  if (!updated[idx]) {
                    updated[idx] = {
                      round: ev.round!,
                      task: { id: "", title: "", difficulty: 0, category: "" },
                      frank: { solved: false, score: 0, time_ms: 0, attempts: 0, strategy: "", first_try: false, hdc_concept: "", hdc_is_new: false, hdc_confidence: 0, aif_surprise: 0 },
                      bare: { solved: false, score: 0, time_ms: 0, attempts: 0, first_try: false },
                    };
                  }
                  updated[idx].bare = {
                    solved: ev.solved || false,
                    score: ev.score || 0,
                    time_ms: ev.time_ms || 0,
                    attempts: ev.attempts || 0,
                    first_try: ev.first_try || false,
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
              setPhase("finished");
              break;

            case "battle_stopped":
              setPhase("idle");
              break;
          }
        });
      } catch {
        // Socket.IO not available
      }
    };
    connectSocket();
    return () => { socket?.disconnect(); };
  }, []);

  // Auto-scroll events
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  // Check for running battle on mount
  useEffect(() => {
    fetch(`${BRIDGE_URL}/api/frankenstein/battle/status`)
      .then(r => r.json())
      .then(data => {
        if (data.active) {
          setPhase("running");
          setBattleId(data.battle_id);
          // Replay events
          for (const ev of data.events || []) {
            setEvents(prev => [...prev, ev]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const startBattle = useCallback(async () => {
    setEvents([]);
    setRounds([]);
    setFrankScore(0);
    setBareScore(0);
    setCurrentRound(0);
    setFinalResult(null);
    setThinking("");
    setCurrentTask(null);
    setPhase("running");

    try {
      const res = await fetch(`${BRIDGE_URL}/api/frankenstein/battle/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: cfgDifficulty,
          num_tasks: cfgTasks,
          category: cfgCategory,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setPhase("idle");
        alert(data.error);
      }
    } catch {
      setPhase("idle");
    }
  }, [cfgDifficulty, cfgTasks, cfgCategory]);

  const stopBattle = useCallback(async () => {
    await fetch(`${BRIDGE_URL}/api/frankenstein/battle/stop`, { method: "POST" });
    setPhase("idle");
  }, []);

  const categories = [
    "", "arithmetic", "string", "list", "pattern", "number_theory",
    "dict", "algorithm", "recursion", "matrix", "sorting",
    "string_advanced", "data_structure", "linked_list",
    "functional", "graph", "dp", "combinatorics",
  ];

  // === IDLE / CONFIG SCREEN ===
  if (phase === "idle" || phase === "configuring") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <div className="flex items-center gap-3">
          <Swords className="w-10 h-10 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Battle Arena</h1>
            <p className="text-sm text-slate-400">Frankenstein AI vs Ren LLM — Live tävling!</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Samma LLM (gemini-2.0-flash) — men Frankenstein har HDC + AIF + Ebbinghaus</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Konfigurera Battle</h3>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Antal uppgifter</label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setCfgTasks(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      cfgTasks === n
                        ? "bg-purple-600 text-white"
                        : "bg-slate-700/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Svårighetsgrad</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setCfgDifficulty(0)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cfgDifficulty === 0
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700/60 text-slate-400 hover:text-white"
                  }`}
                >
                  Blandad
                </button>
                {[3, 4, 5, 6, 7, 8].map(d => (
                  <button
                    key={d}
                    onClick={() => setCfgDifficulty(d)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      cfgDifficulty === d
                        ? "bg-purple-600 text-white"
                        : "bg-slate-700/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    Nv{d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Kategori</label>
              <select
                value={cfgCategory}
                onChange={e => setCfgCategory(e.target.value)}
                aria-label="Välj kategori"
                className="w-full bg-slate-700/60 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Alla kategorier</option>
                {categories.filter(c => c).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={startBattle}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30"
            >
              <Play className="w-5 h-5" />
              Starta Battle!
            </button>
          </div>
        </div>

        {finalResult && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 w-full max-w-md">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Senaste resultat</h3>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{finalResult.frank_score}</div>
                <div className="text-[10px] text-slate-500">Frankenstein</div>
              </div>
              <div className="text-lg text-slate-500">vs</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{finalResult.bare_score}</div>
                <div className="text-[10px] text-slate-500">Ren LLM</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === RUNNING / FINISHED ===
  const frankLeading = frankScore > bareScore;
  const bareLeading = bareScore > frankScore;
  const tied = frankScore === bareScore;

  return (
    <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Battle Arena</h2>
          {phase === "running" && (
            <span className="flex items-center gap-1 text-[10px] bg-red-900/60 text-red-400 px-2 py-0.5 rounded-full border border-red-700/50">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
          {phase === "finished" && (
            <span className="text-[10px] bg-green-900/60 text-green-400 px-2 py-0.5 rounded-full border border-green-700/50">
              KLAR
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {phase === "running" && (
            <button onClick={stopBattle} className="p-1.5 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors" title="Stoppa">
              <Square className="w-4 h-4" />
            </button>
          )}
          {phase === "finished" && (
            <button onClick={() => setPhase("idle")} className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors" title="Ny battle">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-800/60 to-orange-950/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          {/* Frankenstein */}
          <div className="flex-1 text-center">
            <div className="flex flex-col items-center mb-1">
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300">FRANKENSTEIN</span>
              </div>
              {frankModel && <span className="text-[8px] text-purple-400/60 mt-0.5">{frankModel}</span>}
            </div>
            <div className={`text-4xl font-black ${frankLeading ? "text-purple-400" : "text-slate-300"}`}>
              {frankScore}
            </div>
            {finalResult && (
              <div className="text-[10px] text-slate-500 mt-1">
                {Math.round((finalResult.frank_rate || 0) * 100)}% · {Math.round(finalResult.frank_avg_ms || 0)}ms avg
              </div>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center px-4">
            <div className="text-lg font-bold text-slate-500">VS</div>
            <div className="text-[10px] text-slate-600">
              {currentRound > 0 ? `${currentRound}/${totalRounds}` : ""}
            </div>
            {phase === "finished" && finalResult && (
              <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                finalResult.winner === "frankenstein"
                  ? "bg-purple-900/60 text-purple-300"
                  : finalResult.winner === "bare_llm"
                    ? "bg-orange-900/60 text-orange-300"
                    : "bg-slate-700/60 text-slate-300"
              }`}>
                {finalResult.winner === "frankenstein" ? "🧠 VINNARE" : finalResult.winner === "bare_llm" ? "📝 VINNARE" : "🤝 OAVGJORT"}
              </div>
            )}
          </div>

          {/* Bare LLM */}
          <div className="flex-1 text-center">
            <div className="flex flex-col items-center mb-1">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-orange-300">REN LLM</span>
              </div>
              {bareModel && <span className="text-[8px] text-orange-400/60 mt-0.5">{bareModel}</span>}
            </div>
            <div className={`text-4xl font-black ${bareLeading ? "text-orange-400" : "text-slate-300"}`}>
              {bareScore}
            </div>
            {finalResult && (
              <div className="text-[10px] text-slate-500 mt-1">
                {Math.round((finalResult.bare_rate || 0) * 100)}% · {Math.round(finalResult.bare_avg_ms || 0)}ms avg
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {totalRounds > 0 && (
          <div className="mt-3 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentRound / totalRounds) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Current Task / Thinking */}
      {phase === "running" && (currentTask || thinking) && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          {currentTask && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded">Nv{currentTask.difficulty}</span>
                <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded">{currentTask.category}</span>
              </div>
              <div className="text-sm font-medium text-white">{currentTask.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{currentTask.description}</div>
            </div>
          )}
          {thinking && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400">
                {thinking === "frankenstein" ? "🧠 Frankenstein tänker..." : "📝 Ren LLM tänker..."}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Round Results */}
      <div className="flex flex-col gap-1.5">
        {rounds.map((r, i) => (
          <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono w-6">R{r.round}</span>
                <span className="text-[11px] text-white font-medium truncate max-w-[180px]">
                  {r.task?.title || currentTask?.title || "..."}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {r.task?.difficulty && (
                  <span className="text-[9px] bg-slate-700/60 text-slate-500 px-1.5 py-0.5 rounded">Nv{r.task.difficulty}</span>
                )}
                {r.task?.category && (
                  <span className="text-[9px] bg-slate-700/60 text-slate-500 px-1.5 py-0.5 rounded">{r.task.category}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Frankenstein result */}
              <div className={`rounded-lg p-2 ${r.frank.solved ? "bg-purple-900/20 border border-purple-800/30" : "bg-slate-900/30 border border-slate-700/20"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-purple-300">🧠 FRANK</span>
                  <span className={`text-[10px] font-bold ${r.frank.solved ? "text-green-400" : r.frank.score > 0 ? "text-amber-400" : "text-red-400"}`}>
                    {r.frank.solved ? "✅" : "❌"} {Math.round(r.frank.score * 100)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-slate-500">{Math.round(r.frank.time_ms)}ms</span>
                  {r.frank.strategy && <span className="text-[9px] text-purple-400">{r.frank.strategy}</span>}
                  {r.frank.first_try && <span className="text-[9px] text-green-400">1st!</span>}
                  {r.frank.hdc_is_new && <span className="text-[9px] text-cyan-400">NEW</span>}
                  {r.frank.hdc_concept && <span className="text-[9px] text-slate-500 truncate max-w-[80px]">{r.frank.hdc_concept}</span>}
                </div>
              </div>

              {/* Bare LLM result */}
              <div className={`rounded-lg p-2 ${r.bare.solved ? "bg-orange-900/20 border border-orange-800/30" : "bg-slate-900/30 border border-slate-700/20"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-orange-300">📝 LLM</span>
                  <span className={`text-[10px] font-bold ${r.bare.solved ? "text-green-400" : r.bare.score > 0 ? "text-amber-400" : "text-red-400"}`}>
                    {r.bare.solved ? "✅" : "❌"} {Math.round(r.bare.score * 100)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] text-slate-500">{Math.round(r.bare.time_ms)}ms</span>
                  <span className="text-[9px] text-orange-400">direct</span>
                  {r.bare.first_try && <span className="text-[9px] text-green-400">1st!</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Frankenstein Stack (after battle) */}
      {phase === "finished" && finalResult?.stack && (
        <div className="bg-gradient-to-br from-purple-950/40 to-slate-800/40 border border-purple-800/30 rounded-xl p-3">
          <h3 className="text-[12px] font-bold text-purple-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Frankenstein Stack (efter battle)
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Brain className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-400">HDC Koncept:</span>
              <span className="text-white font-medium">{finalResult.stack.hdc_concepts}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-rose-400" />
              <span className="text-slate-400">AIF Surprise:</span>
              <span className="text-white font-medium">{finalResult.stack.aif_surprise?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-3 h-3 text-amber-400" />
              <span className="text-slate-400">Exploration:</span>
              <span className="text-white font-medium">{finalResult.stack.aif_exploration?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-400">Minnen:</span>
              <span className="text-white font-medium">{finalResult.stack.memory_active}/{finalResult.stack.memory_stored}</span>
            </div>
          </div>

          {finalResult.stack.strategy_stats && Object.keys(finalResult.stack.strategy_stats).length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-700/30">
              <div className="text-[10px] text-slate-500 mb-1">Strategier använda:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(finalResult.stack.strategy_stats).map(([name, st]) => {
                  const rate = st.attempts > 0 ? st.successes / st.attempts : 0;
                  return (
                    <span
                      key={name}
                      className={`text-[9px] px-2 py-0.5 rounded-full border ${
                        rate >= 0.5
                          ? "bg-green-900/30 text-green-300 border-green-700/30"
                          : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                      }`}
                    >
                      {name}: {st.successes}/{st.attempts}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Winner Banner */}
      {phase === "finished" && finalResult && (
        <div className={`rounded-2xl p-4 text-center ${
          finalResult.winner === "frankenstein"
            ? "bg-gradient-to-r from-purple-900/60 to-pink-900/60 border border-purple-700/50"
            : finalResult.winner === "bare_llm"
              ? "bg-gradient-to-r from-orange-900/60 to-amber-900/60 border border-orange-700/50"
              : "bg-gradient-to-r from-slate-800/60 to-slate-700/60 border border-slate-600/50"
        }`}>
          <Trophy className={`w-8 h-8 mx-auto mb-2 ${
            finalResult.winner === "frankenstein" ? "text-purple-400" : finalResult.winner === "bare_llm" ? "text-orange-400" : "text-slate-400"
          }`} />
          <div className="text-lg font-bold text-white mb-1">
            {finalResult.winner === "frankenstein"
              ? "🧠 Frankenstein AI vinner!"
              : finalResult.winner === "bare_llm"
                ? "📝 Ren LLM vinner!"
                : "🤝 Oavgjort!"}
          </div>
          <div className="text-sm text-slate-300">
            {finalResult.frank_score} - {finalResult.bare_score} ({finalResult.num_tasks} uppgifter)
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Frank: {Math.round((finalResult.frank_rate || 0) * 100)}% ({Math.round(finalResult.frank_avg_ms || 0)}ms avg)
            {" · "}
            LLM: {Math.round((finalResult.bare_rate || 0) * 100)}% ({Math.round(finalResult.bare_avg_ms || 0)}ms avg)
          </div>

          <button
            onClick={() => setPhase("idle")}
            className="mt-3 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/60 text-white text-sm rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
            Ny Battle
          </button>
        </div>
      )}

      <div ref={eventsEndRef} />
    </div>
  );
}
