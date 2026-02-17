/**
 * DebateView — AI Panel Debate with Swedish Political Parties
 *
 * Uses Frankenstein cognitive architecture:
 * - Active Inference: Surprise-driven turn-taking
 * - HDC: Fast ideological reflexes
 * - Ebbinghaus: Argument memory reinforcement/decay
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { BRIDGE_URL } from "../config";
import {
  Play,
  Square,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  MessageCircle,
  BarChart3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Party {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  emoji: string;
  ideology: string;
  coreIssues: string[];
  rhetoricalStyle: string;
}

interface DebateMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: string;
  surprisal: number;
  round: number;
  isRebuttal: boolean;
}

interface DebateStatus {
  status: "idle" | "running" | "paused" | "finished";
  round: number;
  maxRounds: number;
}

interface ThinkingAgent {
  agentId: string;
  name: string;
  abbreviation: string;
}

const PARTY_STYLES: Record<string, { bg: string; border: string; text: string; accent: string; gradient: string }> = {
  s:  { bg: "bg-red-950/50",     border: "border-red-700/40",     text: "text-red-100",     accent: "text-red-400",     gradient: "from-red-600/20" },
  sd: { bg: "bg-blue-950/50",    border: "border-blue-700/40",    text: "text-blue-100",    accent: "text-blue-400",    gradient: "from-blue-600/20" },
  m:  { bg: "bg-sky-950/50",     border: "border-sky-700/40",     text: "text-sky-100",     accent: "text-sky-400",     gradient: "from-sky-600/20" },
  v:  { bg: "bg-rose-950/50",    border: "border-rose-700/40",    text: "text-rose-100",    accent: "text-rose-400",    gradient: "from-rose-600/20" },
  mp: { bg: "bg-green-950/50",   border: "border-green-700/40",   text: "text-green-100",   accent: "text-green-400",   gradient: "from-green-600/20" },
  kd: { bg: "bg-indigo-950/50",  border: "border-indigo-700/40",  text: "text-indigo-100",  accent: "text-indigo-400",  gradient: "from-indigo-600/20" },
  l:  { bg: "bg-cyan-950/50",    border: "border-cyan-700/40",    text: "text-cyan-100",    accent: "text-cyan-400",    gradient: "from-cyan-600/20" },
  c:  { bg: "bg-emerald-950/50", border: "border-emerald-700/40", text: "text-emerald-100", accent: "text-emerald-400", gradient: "from-emerald-600/20" },
};

const REMARK_PLUGINS = [remarkGfm];

export default function DebateView() {
  const [parties, setParties] = useState<Party[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedParties, setSelectedParties] = useState<string[]>(["s", "sd", "m", "v"]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [rounds, setRounds] = useState(3);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [status, setStatus] = useState<DebateStatus>({ status: "idle", round: 0, maxRounds: 3 });
  const [thinking, setThinking] = useState<ThinkingAgent | null>(null);
  const [surprisal, setSurprisal] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [showSurprisal, setShowSurprisal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Load parties and topics
  useEffect(() => {
    fetch(`${BRIDGE_URL}/api/debate/parties`).then(r => r.json()).then(setParties).catch(() => {});
    fetch(`${BRIDGE_URL}/api/debate/topics`).then(r => r.json()).then((t: string[]) => {
      setTopics(t);
      if (t.length > 0) setSelectedTopic(t[0]);
    }).catch(() => {});
  }, []);

  // Socket connection
  useEffect(() => {
    const socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("debate_message", (msg: DebateMessage) => {
      setMessages(prev => [...prev, msg]);
      setThinking(null);
    });

    socket.on("debate_status", (s: DebateStatus) => {
      setStatus(s);
      if (s.status === "finished") setThinking(null);
    });

    socket.on("debate_thinking", (agent: ThinkingAgent) => {
      setThinking(agent);
    });

    socket.on("debate_surprisal", (s: Record<string, number>) => {
      setSurprisal(s);
    });

    socket.on("debate_summary", (s: string) => {
      setSummary(s);
    });

    // Load existing session
    fetch(`${BRIDGE_URL}/api/debate/session`).then(r => r.json()).then(data => {
      if (data.session) {
        setMessages(data.session.messages || []);
        setStatus({ status: data.session.status, round: data.session.round, maxRounds: data.session.maxRounds });
        if (data.session.moderatorSummary) setSummary(data.session.moderatorSummary);
        if (data.session.status === "running" || data.session.messages?.length > 0) setShowSetup(false);
      }
    }).catch(() => {});

    return () => { socket.disconnect(); };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const toggleParty = useCallback((id: string) => {
    setSelectedParties(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev; // Min 2 parties
        return prev.filter(p => p !== id);
      }
      return [...prev, id];
    });
  }, []);

  const startDebate = useCallback(async () => {
    const topic = customTopic.trim() || selectedTopic;
    if (!topic || selectedParties.length < 2) return;

    setMessages([]);
    setSummary(null);
    setShowSetup(false);

    try {
      await fetch(`${BRIDGE_URL}/api/debate/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, parties: selectedParties, rounds }),
      });
    } catch (err) {
      console.error("Failed to start debate:", err);
    }
  }, [selectedTopic, customTopic, selectedParties, rounds]);

  const stopDebate = useCallback(async () => {
    try {
      await fetch(`${BRIDGE_URL}/api/debate/stop`, { method: "POST" });
    } catch {}
  }, []);

  const resetDebate = useCallback(async () => {
    try {
      await fetch(`${BRIDGE_URL}/api/debate/messages`, { method: "DELETE" });
      setMessages([]);
      setSummary(null);
      setStatus({ status: "idle", round: 0, maxRounds: 3 });
      setShowSetup(true);
    } catch {}
  }, []);

  const getParty = useCallback((id: string): Party | undefined => {
    return parties.find(p => p.id === id);
  }, [parties]);

  const getStyle = (id: string) => PARTY_STYLES[id] || PARTY_STYLES.s;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800/50 bg-gradient-to-r from-slate-900 to-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏛️</span>
            <div>
              <h2 className="text-sm font-bold text-white">AI Paneldebatt</h2>
              <p className="text-[10px] text-slate-500">Svenska partier • Frankenstein-arkitektur</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status.status === "running" && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-950/40 px-2 py-1 rounded-full border border-amber-800/30">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                Runda {status.round}/{status.maxRounds}
              </div>
            )}
            {status.status === "finished" && (
              <div className="text-[10px] text-green-400 bg-green-950/40 px-2 py-1 rounded-full border border-green-800/30">
                ✓ Avslutad
              </div>
            )}
            <button
              onClick={() => setShowSurprisal(!showSurprisal)}
              className={`p-1.5 rounded-lg transition-colors ${showSurprisal ? "bg-purple-900/50 text-purple-300" : "text-slate-500 hover:text-slate-300"}`}
              title="Visa överraskningsnivåer"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
              title="Inställningar"
            >
              {showSetup ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Surprisal Bar (Active Inference visualization) */}
      {showSurprisal && Object.keys(surprisal).length > 0 && (
        <div className="shrink-0 px-4 py-2 border-b border-slate-800/30 bg-slate-900/50">
          <div className="text-[9px] text-slate-500 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Ideologisk dissonans (Active Inference)
          </div>
          <div className="flex gap-2">
            {Object.entries(surprisal).map(([id, value]) => {
              const party = getParty(id);
              if (!party) return null;
              return (
                <div key={id} className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-medium text-slate-400">{party.emoji} {party.abbreviation}</span>
                    <span className="text-[9px] text-slate-500">{(value * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        value > 0.7 ? "bg-red-500" : value > 0.4 ? "bg-amber-500" : "bg-green-500"
                      }`}
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Setup Panel */}
      {showSetup && (
        <div className="shrink-0 px-4 py-3 border-b border-slate-800/30 bg-slate-900/30 space-y-3 overflow-y-auto max-h-[50vh]">
          {/* Topic Selection */}
          <div>
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">
              Debattämne
            </label>
            <select
              value={selectedTopic}
              onChange={e => { setSelectedTopic(e.target.value); setCustomTopic(""); }}
              title="Välj debattämne"
              className="w-full bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
            >
              {topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="text"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="...eller skriv eget ämne"
              className="w-full mt-1.5 bg-slate-800/50 text-white text-xs rounded-lg px-3 py-2 border border-slate-700/50 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
          </div>

          {/* Party Selection */}
          <div>
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Deltagande partier (min 2)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {parties.map(party => {
                const selected = selectedParties.includes(party.id);
                const style = getStyle(party.id);
                return (
                  <button
                    key={party.id}
                    onClick={() => toggleParty(party.id)}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all ${
                      selected
                        ? `${style.bg} ${style.border} ${style.text} ring-1 ring-white/10`
                        : "bg-slate-800/30 border-slate-700/30 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <span className="text-lg">{party.emoji}</span>
                    <span className="text-[10px] font-bold">{party.abbreviation}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rounds */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Rundor
            </label>
            <div className="flex gap-1">
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setRounds(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                    rounds === n
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startDebate}
            disabled={selectedParties.length < 2 || status.status === "running"}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-sm transition-all"
          >
            <Play className="w-4 h-4" />
            Starta debatt
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && status.status === "idle" && !showSetup && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <span className="text-4xl mb-2">🏛️</span>
            <p className="text-sm">Ingen debatt pågår</p>
            <button onClick={() => setShowSetup(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
              Starta en ny debatt
            </button>
          </div>
        )}

        {/* Round markers */}
        {messages.map((msg, idx) => {
          const party = getParty(msg.agentId);
          const style = getStyle(msg.agentId);
          const isNewRound = idx === 0 || messages[idx - 1].round !== msg.round;

          return (
            <div key={msg.id}>
              {isNewRound && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Runda {msg.round}
                  </span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
              )}

              <div className={`rounded-xl border p-3 ${style.bg} ${style.border} bg-gradient-to-br ${style.gradient} to-transparent`}>
                {/* Agent header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{party?.emoji || "🏛️"}</span>
                    <div>
                      <span className={`text-xs font-bold ${style.accent}`}>
                        {party?.name || msg.agentId}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        ({party?.abbreviation})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {msg.surprisal > 0.5 && (
                      <span className="text-[9px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded-full">
                        🔥 {(msg.surprisal * 100).toFixed(0)}%
                      </span>
                    )}
                    <span className="text-[9px] text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Message content */}
                <div className={`text-sm leading-relaxed ${style.text} prose prose-sm prose-invert max-w-none prose-p:my-1`}>
                  <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking indicator */}
        {thinking && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-800/30">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-slate-400">
              {thinking.agentId === "moderator"
                ? "📋 Moderatorn sammanfattar debatten..."
                : `${getParty(thinking.agentId)?.emoji || "🏛️"} ${thinking.name} formulerar sitt svar...`}
            </span>
          </div>
        )}

        {/* Moderator Summary */}
        {summary && (
          <div className="rounded-xl border border-purple-800/30 bg-purple-950/30 p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">📋</span>
              <span className="text-xs font-bold text-purple-300">Moderatorns sammanfattning</span>
            </div>
            <div className="text-sm text-purple-100 leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-1">
              <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                {summary}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Controls */}
      <div className="shrink-0 px-4 py-2 border-t border-slate-800/50 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <MessageCircle className="w-3 h-3" />
          {messages.length} inlägg
          {status.status === "running" && ` • Runda ${status.round}/${status.maxRounds}`}
        </div>
        <div className="flex items-center gap-1.5">
          {status.status === "running" && (
            <button
              onClick={stopDebate}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg text-xs transition-colors"
            >
              <Square className="w-3 h-3" />
              Stoppa
            </button>
          )}
          {(status.status === "finished" || (status.status === "idle" && messages.length > 0)) && (
            <button
              onClick={resetDebate}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Ny debatt
            </button>
          )}
          {status.status === "idle" && messages.length === 0 && !showSetup && (
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 rounded-lg text-xs transition-colors"
            >
              <Play className="w-3 h-3" />
              Starta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
