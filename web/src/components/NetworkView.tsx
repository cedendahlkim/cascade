import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Zap, Brain, Shield, Lightbulb, Network, ChevronRight, Users, Sparkles, TrendingUp, Skull, Send, Loader2, MessageSquare } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface Bot {
  id: string;
  name: string;
  role: "worker" | "validator" | "coordinator" | "innovator";
  status: string;
  generation: number;
  reputation: number;
  energy: number;
  intelligence: number;
  creativity: number;
  accuracy: number;
  tasksCompleted: number;
  tasksFailed: number;
  knowledgeIds: string[];
  connections: string[];
  parentIds: string[];
  birthTick: number;
  traits: string[];
  color: string;
  personality: string;
  lastThought: string;
}

interface KnowledgeItem {
  id: string;
  type: string;
  content: string;
  confidence: number;
  validations: number;
  rejections: number;
  origin: string;
  generation: number;
  aiGenerated: boolean;
  validationReasons: string[];
}

interface NetworkEvent {
  id: string;
  tick: number;
  type: string;
  description: string;
  timestamp: number;
}

interface NetworkStats {
  totalBots: number;
  aliveBots: number;
  deadBots: number;
  generation: number;
  totalKnowledge: number;
  validatedKnowledge: number;
  totalTicks: number;
  avgReputation: number;
  avgIntelligence: number;
  networkIQ: number;
  reproductions: number;
  mutations: number;
  discoveries: number;
  aiCalls: number;
  tokensUsed: number;
}

interface NetworkState {
  bots: Bot[];
  knowledge: KnowledgeItem[];
  connections: { from: string; to: string; strength: number; interactions: number }[];
  events: NetworkEvent[];
  stats: NetworkStats;
  running: boolean;
  tick: number;
  topic: string;
  processing: boolean;
}

const ROLE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  worker: { icon: Zap, label: "Worker", color: "text-blue-400", bg: "bg-blue-500/20" },
  validator: { icon: Shield, label: "Validator", color: "text-green-400", bg: "bg-green-500/20" },
  coordinator: { icon: Network, label: "Coordinator", color: "text-purple-400", bg: "bg-purple-500/20" },
  innovator: { icon: Lightbulb, label: "Innovatör", color: "text-amber-400", bg: "bg-amber-500/20" },
};

const EVENT_ICONS: Record<string, string> = {
  birth: "🐣",
  death: "💀",
  discovery: "💡",
  validation: "✅",
  rejection: "❌",
  reproduction: "🧬",
  mutation: "🔀",
  promotion: "⭐",
  collaboration: "🤝",
  thinking: "🧠",
  synthesis: "🔮",
};

export default function NetworkView() {
  const [state, setState] = useState<NetworkState | null>(null);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "events" | "knowledge">("grid");
  const [topicInput, setTopicInput] = useState("");
  const [stepping, setStepping] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/network`);
      const data = await res.json();
      setState(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchState]);

  const apiCall = async (endpoint: string, body?: object) => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/network/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setState(data);
    } catch {}
  };

  const handleStep = async () => {
    setStepping(true);
    await apiCall("step", { ticks: 3 });
    setStepping(false);
  };

  const handleSetTopic = async () => {
    if (!topicInput.trim()) return;
    await apiCall("topic", { topic: topicInput.trim() });
    setTopicInput("");
  };

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500 text-sm animate-pulse">Laddar nätverk...</div>
      </div>
    );
  }

  const alive = state.bots.filter(b => b.status !== "dead");
  const s = state.stats;
  const isProcessing = state.processing || stepping;

  return (
    <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-3">
      {/* Header Stats */}
      <div className="p-3 bg-gradient-to-br from-indigo-950/50 to-purple-950/40 border border-indigo-800/40 rounded-2xl animate-fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className={`w-5 h-5 text-indigo-400 ${isProcessing ? "animate-pulse" : ""}`} />
            <h2 className="text-sm font-bold text-white">Bot-nätverk</h2>
            <span className="text-[10px] text-indigo-400 bg-indigo-900/50 px-1.5 py-0.5 rounded-full">
              Gen {s.generation}
            </span>
            {isProcessing && (
              <span className="text-[9px] text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> AI tänker...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {state.running ? (
              <button onClick={() => apiCall("stop")} className="p-1.5 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900/70 transition-colors" title="Pausa">
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button onClick={handleStep} disabled={stepping} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50" title="Stega (AI-anrop)">
                  {stepping ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <button onClick={() => apiCall("start", { speed: 1 })} className="p-1.5 rounded-lg bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/70 transition-colors" title="Starta auto">
                  <Play className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={() => apiCall("reset")} className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-red-400 transition-colors" title="Återställ">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Topic */}
        <div className="mb-2 p-2 bg-slate-900/40 rounded-lg border border-slate-700/30">
          <div className="text-[9px] text-slate-500 uppercase mb-1">Forskningsämne</div>
          <div className="text-[11px] text-slate-300 mb-1.5">{state.topic}</div>
          <div className="flex gap-1">
            <input
              type="text"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSetTopic()}
              placeholder="Ändra ämne..."
              className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-lg px-2 py-1 text-[11px] text-white placeholder-slate-600 outline-none focus:border-indigo-600"
              title="Forskningsämne"
            />
            <button onClick={handleSetTopic} className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors" title="Sätt ämne">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-300">{s.networkIQ}</div>
            <div className="text-[9px] text-slate-500 uppercase">Nätverks-IQ</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-300">{s.aliveBots}</div>
            <div className="text-[9px] text-slate-500 uppercase">Aktiva bots</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-300">{s.validatedKnowledge}</div>
            <div className="text-[9px] text-slate-500 uppercase">Validerad</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-300">{s.totalTicks}</div>
            <div className="text-[9px] text-slate-500 uppercase">Ticks</div>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-800/30 text-[10px] text-slate-500">
          <span>🧬 {s.reproductions}</span>
          <span>🔀 {s.mutations}</span>
          <span>💡 {s.discoveries}</span>
          <span>🤖 {s.aiCalls} AI-anrop</span>
          <span>� {s.tokensUsed > 1000 ? `${(s.tokensUsed / 1000).toFixed(1)}k` : s.tokensUsed} tokens</span>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1">
        {([
          { id: "grid" as const, label: "🤖 Bots", count: alive.length },
          { id: "events" as const, label: "📜 Händelser", count: state.events.length },
          { id: "knowledge" as const, label: "💡 Kunskap", count: state.knowledge.length },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
              view === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-slate-800/60 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Bot Grid */}
      {view === "grid" && (
        <div className="space-y-2">
          {/* Role summary */}
          <div className="flex gap-2 text-[10px] flex-wrap">
            {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
              const count = alive.filter(b => b.role === role).length;
              return (
                <div key={role} className={`flex items-center gap-1 px-2 py-1 rounded-lg ${cfg.bg}`}>
                  <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                  <span className={cfg.color}>{count} {cfg.label}</span>
                </div>
              );
            })}
          </div>

          {/* Bot cards */}
          {alive.map((bot, i) => {
            const cfg = ROLE_CONFIG[bot.role];
            const RoleIcon = cfg.icon;
            const isSelected = selectedBot?.id === bot.id;
            const isThinking = bot.status === "working" || bot.status === "validating";
            return (
              <div key={bot.id}>
                <button
                  onClick={() => setSelectedBot(isSelected ? null : bot)}
                  className={`w-full text-left rounded-xl p-2.5 border transition-all card-hover stagger-item ${
                    isSelected
                      ? "bg-indigo-950/60 border-indigo-700/50"
                      : isThinking
                      ? "bg-amber-950/30 border-amber-800/30"
                      : "bg-slate-800/40 border-slate-700/30"
                  }`}
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bot.color + "20", borderColor: bot.color + "40", borderWidth: 1 }}>
                        {isThinking
                          ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          : <RoleIcon className="w-4 h-4" style={{ color: bot.color }} />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">{bot.name}</span>
                          <span className={`text-[9px] px-1 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          {bot.generation > 0 && (
                            <span className="text-[9px] text-purple-400 bg-purple-900/30 px-1 py-0.5 rounded">G{bot.generation}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span>🧠 {Math.round(bot.intelligence)}</span>
                          <span>⭐ {Math.round(bot.reputation)}</span>
                          <span>⚡ {Math.round(bot.energy)}</span>
                          <span>✅ {bot.tasksCompleted}</span>
                        </div>
                        {/* Last thought */}
                        {bot.lastThought && (
                          <div className="mt-1 text-[10px] text-indigo-300/70 italic flex items-start gap-1">
                            <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{bot.lastThought}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="w-14 bg-slate-700 rounded-full h-1">
                        <div className="h-1 rounded-full bg-indigo-500 transition-all" style={{ width: `${bot.intelligence}%` }} />
                      </div>
                      <div className="w-14 bg-slate-700 rounded-full h-1">
                        <div className={`h-1 rounded-full transition-all ${bot.energy > 30 ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${bot.energy}%` }} />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded bot details */}
                {isSelected && (
                  <div className="mt-1 p-3 bg-slate-900/60 rounded-xl border border-slate-700/30 animate-fade-in-up space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="bg-slate-800/60 rounded-lg p-1.5">
                        <div className="text-xs font-bold text-blue-300">{Math.round(bot.intelligence)}</div>
                        <div className="text-slate-500">Intelligens</div>
                      </div>
                      <div className="bg-slate-800/60 rounded-lg p-1.5">
                        <div className="text-xs font-bold text-amber-300">{Math.round(bot.creativity)}</div>
                        <div className="text-slate-500">Kreativitet</div>
                      </div>
                      <div className="bg-slate-800/60 rounded-lg p-1.5">
                        <div className="text-xs font-bold text-green-300">{Math.round(bot.accuracy)}</div>
                        <div className="text-slate-500">Precision</div>
                      </div>
                    </div>
                    {/* Personality */}
                    {bot.personality && (
                      <div className="text-[10px] text-slate-400 italic bg-slate-800/40 rounded-lg p-1.5">
                        {bot.personality}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {bot.traits.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">{t}</span>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {bot.connections.length} kopplingar · {bot.knowledgeIds.length} kunskaper · {bot.parentIds.length > 0 ? `Föräldrar: ${bot.parentIds.length}` : "Gen 0 (original)"}
                    </div>
                    {/* Last thought full */}
                    {bot.lastThought && (
                      <div className="text-[10px] text-indigo-300/80 bg-indigo-950/30 rounded-lg p-2 border border-indigo-800/20">
                        <span className="text-[9px] text-indigo-500 uppercase block mb-0.5">Senaste tanke</span>
                        {bot.lastThought}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Dead bots */}
          {state.bots.filter(b => b.status === "dead").length > 0 && (
            <div className="pt-2 border-t border-slate-800/50">
              <p className="text-[10px] text-slate-600 mb-1 flex items-center gap-1">
                <Skull className="w-3 h-3" /> Döda bots ({state.bots.filter(b => b.status === "dead").length})
              </p>
              <div className="flex flex-wrap gap-1">
                {state.bots.filter(b => b.status === "dead").map(b => (
                  <span key={b.id} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-600 line-through">{b.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Events Log */}
      {view === "events" && (
        <div className="space-y-1">
          {state.events.slice().reverse().slice(0, 60).map(evt => (
            <div key={evt.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-slate-800/30 text-[11px] stagger-item">
              <span className="shrink-0">{EVENT_ICONS[evt.type] || "📌"}</span>
              <div className="flex-1">
                <span className="text-slate-300">{evt.description}</span>
                <span className="text-slate-600 ml-2">tick {evt.tick}</span>
              </div>
            </div>
          ))}
          {state.events.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40 empty-icon" />
              Inga händelser ännu. Starta nätverket!
            </div>
          )}
        </div>
      )}

      {/* Knowledge Base */}
      {view === "knowledge" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
            <span>Totalt: {state.knowledge.length}</span>
            <span>·</span>
            <span className="text-emerald-400">Validerad: {s.validatedKnowledge}</span>
            <span>·</span>
            <span className="text-indigo-400">AI-genererad: {state.knowledge.filter(k => k.aiGenerated).length}</span>
          </div>
          {state.knowledge.slice().reverse().slice(0, 30).map(k => {
            const isValidated = k.validations >= 3 && k.confidence > 0.7;
            const originBot = state.bots.find(b => b.id === k.origin);
            const isExpanded = selectedKnowledge === k.id;
            return (
              <div key={k.id}>
                <button
                  onClick={() => setSelectedKnowledge(isExpanded ? null : k.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border text-[11px] stagger-item transition-all ${
                    isValidated
                      ? "bg-emerald-950/30 border-emerald-800/30"
                      : "bg-slate-800/30 border-slate-700/20"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${
                      k.type === "pattern" ? "bg-blue-900/50 text-blue-300" :
                      k.type === "rule" ? "bg-amber-900/50 text-amber-300" :
                      k.type === "insight" ? "bg-purple-900/50 text-purple-300" :
                      "bg-emerald-900/50 text-emerald-300"
                    }`}>{k.type}</span>
                    {isValidated && <Sparkles className="w-3 h-3 text-emerald-400" />}
                    {k.aiGenerated && <span className="text-[8px] text-indigo-400 bg-indigo-900/40 px-1 rounded">AI</span>}
                    <span className="text-slate-600 ml-auto text-[10px]">
                      {originBot?.name || "?"} · {Math.round(k.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-slate-300">{k.content}</p>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-600">
                    <span>✅ {k.validations}</span>
                    {k.rejections > 0 && <span>❌ {k.rejections}</span>}
                    {k.validationReasons?.length > 0 && <span>💬 {k.validationReasons.length} granskningar</span>}
                  </div>
                </button>
                {/* Expanded: validation reasons */}
                {isExpanded && k.validationReasons?.length > 0 && (
                  <div className="mt-1 p-2 bg-slate-900/50 rounded-lg border border-slate-700/20 space-y-1 animate-fade-in-up">
                    <div className="text-[9px] text-slate-500 uppercase">AI-granskningar</div>
                    {k.validationReasons.map((r, i) => (
                      <div key={i} className="text-[10px] text-slate-400 pl-2 border-l-2 border-slate-700">
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {state.knowledge.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-40 empty-icon" />
              Ingen kunskap upptäckt ännu. Tryck ▶ för att starta!
            </div>
          )}
        </div>
      )}

      {/* Network Intelligence Growth */}
      {s.totalTicks > 0 && (
        <div className="p-3 bg-slate-800/40 border border-slate-700/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Intelligenstillväxt</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Nätverks-IQ</span>
              <span className="text-indigo-300 font-bold">{s.networkIQ}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all"
                style={{ width: `${Math.min(100, s.networkIQ)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Snitt intelligens</span>
              <span className="text-blue-300">{s.avgIntelligence}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${s.avgIntelligence}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Snitt reputation</span>
              <span className="text-emerald-300">{s.avgReputation}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${s.avgReputation}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-2.5 bg-slate-800/30 rounded-xl text-[10px] text-slate-500 space-y-1">
        <p className="font-medium text-slate-400">Riktigt AI-drivet nätverk</p>
        <p>🤖 <strong className="text-slate-300">Workers</strong> gör riktiga Gemini-anrop för att generera insikter</p>
        <p>🛡️ <strong className="text-slate-300">Validators</strong> använder AI för att kritiskt granska andras kunskap</p>
        <p>🔗 <strong className="text-slate-300">Coordinators</strong> syntetiserar kunskap med AI till djupare insikter</p>
        <p>💡 <strong className="text-slate-300">Innovatörer</strong> utforskar kreativt med högre AI-temperatur</p>
        <p>🧬 Bots med hög reputation <strong className="text-slate-300">reproducerar sig</strong> — avkomma ärver traits + kunskap</p>
        <p>� Varje tick = 1 riktig AI-anrop. Nätverket lär sig på riktigt!</p>
      </div>
    </div>
  );
}
