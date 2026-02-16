import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Brain, Sparkles, Shield, BarChart3, Zap, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { BRIDGE_URL } from "../config";
import ReactMarkdown from "react-markdown";

// --- Types ---

interface SwarmNode {
  id: string;
  label: string;
  emoji: string;
  domain: string;
  description: string;
  influence: number;
  enabled: boolean;
}

interface SwarmNodeResponse {
  nodeId: string;
  personality: string;
  emoji: string;
  content: string;
  timestamp: string;
  processingMs: number;
}

interface InsightPropagation {
  sourceNode: string;
  targetNode: string;
  insight: string;
  weight: number;
  crossDomain: boolean;
}

interface ConfidenceScore {
  nodeId: string;
  confidence: number;
  reasoning: string;
  adjustedByUncertainty: boolean;
}

interface DevilsAdvocateChallenge {
  challengerNodeId: string;
  targetClaim: string;
  challenge: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

interface ConsensusAnalysis {
  isSuspicious: boolean;
  similarityScore: number;
  diversityScore: number;
  flaggedPairs: Array<{ nodeA: string; nodeB: string; similarity: number }>;
  recommendation: string;
}

interface EmergenceMetrics {
  collectiveIQScore: number;
  novelSolutionRate: number;
  crossDomainIndex: number;
  consensusStrength: number;
  totalProcessingMs: number;
  confidenceScores?: ConfidenceScore[];
  devilsAdvocate?: DevilsAdvocateChallenge[];
  consensusAnalysis?: ConsensusAnalysis | null;
}

interface SwarmPhaseLog {
  phase: string;
  label: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

interface SwarmResult {
  query: string;
  sessionId: string;
  timestamp: string;
  nodeResponses: SwarmNodeResponse[];
  propagations: InsightPropagation[];
  synthesis: string;
  metrics: EmergenceMetrics;
  phases: SwarmPhaseLog[];
  devilsAdvocateReport: string | null;
}

interface SwarmStatus {
  running: boolean;
  nodeCount: number;
  sessionCount: number;
  lastSession: string | null;
}

interface ProgressEvent {
  phase: string;
  detail: string;
  timestamp: string;
}

// --- Node color mapping ---

const NODE_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  analytiker: { bg: "bg-blue-950/60", border: "border-blue-700/50", text: "text-blue-200", glow: "shadow-blue-500/20" },
  kreativist: { bg: "bg-purple-950/60", border: "border-purple-700/50", text: "text-purple-200", glow: "shadow-purple-500/20" },
  kritiker:   { bg: "bg-amber-950/60", border: "border-amber-700/50", text: "text-amber-200", glow: "shadow-amber-500/20" },
  navigator:  { bg: "bg-emerald-950/60", border: "border-emerald-700/50", text: "text-emerald-200", glow: "shadow-emerald-500/20" },
  intuitivist:{ bg: "bg-cyan-950/60", border: "border-cyan-700/50", text: "text-cyan-200", glow: "shadow-cyan-500/20" },
  empat:      { bg: "bg-rose-950/60", border: "border-rose-700/50", text: "text-rose-200", glow: "shadow-rose-500/20" },
  integrator: { bg: "bg-indigo-950/60", border: "border-indigo-700/50", text: "text-indigo-200", glow: "shadow-indigo-500/20" },
};

const getNodeStyle = (id: string) => NODE_STYLES[id] || NODE_STYLES.analytiker;

// --- Component ---

export default function SwarmView() {
  const [nodes, setNodes] = useState<SwarmNode[]>([]);
  const [status, setStatus] = useState<SwarmStatus | null>(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<SwarmResult | null>(null);
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showPropagations, setShowPropagations] = useState(false);
  const [sessions, setSessions] = useState<{ sessionId: string; query: string; timestamp: string; metrics: EmergenceMetrics }[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch nodes and status on mount
  useEffect(() => {
    fetchNodes();
    fetchStatus();
    fetchSessions();
  }, []);

  // Auto-scroll progress
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.scrollTop = progressRef.current.scrollHeight;
    }
  }, [progress]);

  // Socket.IO for real-time progress
  useEffect(() => {
    let socket: any = null;
    const connectSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
        socket.on("swarm_progress", (evt: ProgressEvent) => {
          setProgress(prev => [...prev, evt]);
        });
        socket.on("swarm_result", (res: SwarmResult) => {
          setResult(res);
          setLoading(false);
          fetchSessions();
        });
      } catch { /* socket optional */ }
    };
    connectSocket();
    return () => { socket?.disconnect(); };
  }, []);

  const fetchNodes = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/swarm/nodes`);
      if (res.ok) setNodes(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/swarm/status`);
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/swarm/sessions`);
      if (res.ok) setSessions(await res.json());
    } catch { /* ignore */ }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/swarm/session/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setSelectedSession(sessionId);
      }
    } catch { /* ignore */ }
  }, []);

  const submitQuery = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress([]);
    setExpandedNodes(new Set());
    setShowPropagations(false);

    try {
      const res = await fetch(`${BRIDGE_URL}/api/swarm/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuery();
    }
  };

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Group responses by phase
  const phase1Responses = result?.nodeResponses.filter((_, i) => i < nodes.length) || [];
  const phase2Responses = result?.nodeResponses.filter((_, i) => i >= nodes.length) || [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍄</span>
            <h2 className="text-base font-bold text-white">Swarm Intelligence</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
              ABA-Mycelium
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{nodes.length} noder</span>
            <span>•</span>
            <span>{sessions.length} sessioner</span>
            <button onClick={() => { fetchNodes(); fetchStatus(); fetchSessions(); }} className="p-1 hover:text-white transition-colors" title="Uppdatera">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Nodes */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {nodes.map(node => {
            const style = getNodeStyle(node.id);
            return (
              <div key={node.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${style.bg} ${style.border} ${style.text} text-xs`}>
                <span>{node.emoji}</span>
                <span className="font-medium">{node.label}</span>
                <span className="text-[10px] opacity-60">×{node.influence}</span>
              </div>
            );
          })}
          {nodes.length === 0 && (
            <span className="text-xs text-slate-500">Inga aktiva noder — kontrollera API-nycklar</span>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Progress feed */}
        {loading && progress.length > 0 && (
          <div ref={progressRef} className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3 max-h-40 overflow-y-auto">
            <div className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Svärmen arbetar...
            </div>
            {progress.map((p, i) => (
              <div key={i} className="text-xs text-slate-300 py-0.5">{p.detail}</div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-3 text-sm text-red-300">
            ❌ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Metrics bar */}
            <MetricsBar metrics={result.metrics} phases={result.phases} />

            {/* Synthesis */}
            <div className="rounded-xl border border-emerald-700/40 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 p-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-200">Syntes</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
                  {result.phases.find(p => p.phase === "synthesis")?.durationMs || 0}ms
                </span>
              </div>
              <div className="prose prose-sm prose-invert max-w-none text-slate-200 prose-headings:text-emerald-200 prose-strong:text-emerald-100 prose-code:text-emerald-300">
                <ReactMarkdown>{result.synthesis}</ReactMarkdown>
              </div>
            </div>

            {/* Devil's Advocate Report */}
            {result.metrics.devilsAdvocate && result.metrics.devilsAdvocate.length > 0 && (
              <div className="rounded-xl border border-red-700/40 bg-gradient-to-br from-red-950/30 to-slate-900/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">😈</span>
                  <h3 className="text-sm font-bold text-red-200">Djävulens Advokat</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 border border-red-700/50">
                    {result.metrics.devilsAdvocate.length} utmaningar
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 border border-red-700/50">
                    {result.phases.find(p => p.phase === "devilsAdvocate")?.durationMs || 0}ms
                  </span>
                </div>
                <div className="space-y-2">
                  {result.metrics.devilsAdvocate.map((c, i) => {
                    const severityColors = {
                      low: "border-yellow-700/40 bg-yellow-950/20 text-yellow-300",
                      medium: "border-orange-700/40 bg-orange-950/20 text-orange-300",
                      high: "border-red-700/40 bg-red-950/20 text-red-300",
                    };
                    return (
                      <div key={i} className={`rounded-lg border p-3 ${severityColors[c.severity]}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            c.severity === "high" ? "bg-red-800/50 text-red-200" :
                            c.severity === "medium" ? "bg-orange-800/50 text-orange-200" :
                            "bg-yellow-800/50 text-yellow-200"
                          }`}>{c.severity}</span>
                          <span className="text-xs text-slate-400 truncate flex-1">"{c.targetClaim}"</span>
                        </div>
                        <p className="text-xs leading-relaxed">{c.challenge}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Consensus Analysis */}
            {result.metrics.consensusAnalysis && (
              <div className={`rounded-xl border p-4 ${
                result.metrics.consensusAnalysis.isSuspicious
                  ? "border-amber-700/40 bg-amber-950/20"
                  : "border-slate-700/40 bg-slate-900/40"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${result.metrics.consensusAnalysis.isSuspicious ? "text-amber-400" : "text-emerald-400"}`} />
                  <h3 className="text-sm font-bold text-slate-200">Konsensusanalys</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{(result.metrics.consensusAnalysis.diversityScore * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-slate-500">Diversitet</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{(result.metrics.consensusAnalysis.similarityScore * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-slate-500">Likhet</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300">{result.metrics.consensusAnalysis.recommendation}</p>
                {result.metrics.consensusAnalysis.flaggedPairs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {result.metrics.consensusAnalysis.flaggedPairs.map((fp, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-700/30">
                        {fp.nodeA} ↔ {fp.nodeB}: {(fp.similarity * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Confidence Scores */}
            {result.metrics.confidenceScores && result.metrics.confidenceScores.length > 0 && (
              <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Confidence Scores
                </h3>
                <div className="space-y-1.5">
                  {result.metrics.confidenceScores.map((cs, i) => {
                    const pct = Math.round(cs.confidence * 100);
                    const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-20 truncate">{cs.nodeId}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-300 w-10 text-right">{pct}%</span>
                        {cs.adjustedByUncertainty && (
                          <span className="text-[10px] text-purple-400" title="Medveten osäkerhet tillämpad">🎲</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">🎲 = Medveten osäkerhet (slumpmässig sänkning för att tvinga djupare utforskning)</p>
              </div>
            )}

            {/* Phase 1: Individual responses */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Fas 1 — Individuella analyser
              </h3>
              <div className="space-y-2">
                {phase1Responses.map((resp, i) => (
                  <NodeResponseCard
                    key={`p1-${i}`}
                    response={resp}
                    expanded={expandedNodes.has(`p1-${resp.nodeId}`)}
                    onToggle={() => toggleNode(`p1-${resp.nodeId}`)}
                  />
                ))}
              </div>
            </div>

            {/* Phase 2: Cross-pollinated responses */}
            {phase2Responses.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Fas 2 — Cross-Pollination
                </h3>
                <div className="space-y-2">
                  {phase2Responses.map((resp, i) => (
                    <NodeResponseCard
                      key={`p2-${i}`}
                      response={resp}
                      expanded={expandedNodes.has(`p2-${resp.nodeId}`)}
                      onToggle={() => toggleNode(`p2-${resp.nodeId}`)}
                      refined
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Propagations */}
            {result.propagations.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPropagations(!showPropagations)}
                  className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 hover:text-slate-200 transition-colors"
                >
                  {showPropagations ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  🍄 Mycelium-flöden ({result.propagations.length})
                </button>
                {showPropagations && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.propagations.map((p, i) => (
                      <div key={i} className="rounded-lg border border-slate-700/40 bg-slate-900/40 p-2.5 text-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-medium text-slate-300">{p.sourceNode}</span>
                          <span className={p.crossDomain ? "text-yellow-400" : "text-slate-500"}>
                            {p.crossDomain ? "⚡→" : "→"}
                          </span>
                          <span className="font-medium text-slate-300">{p.targetNode}</span>
                          <span className="ml-auto text-slate-500">×{p.weight.toFixed(2)}</span>
                        </div>
                        {p.crossDomain && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400 border border-yellow-700/30">
                            tvärsdisciplinär
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Session history */}
        {!result && !loading && sessions.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tidigare sessioner</h3>
            <div className="space-y-1.5">
              {sessions.slice().reverse().map(s => (
                <button
                  key={s.sessionId}
                  onClick={() => loadSession(s.sessionId)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedSession === s.sessionId
                      ? "border-emerald-700/50 bg-emerald-950/30"
                      : "border-slate-700/40 bg-slate-900/30 hover:border-slate-600/50"
                  }`}
                >
                  <div className="text-sm text-slate-200 font-medium truncate">{s.query}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span>{new Date(s.timestamp).toLocaleString("sv-SE")}</span>
                    <span>CIQ: {s.metrics.collectiveIQScore}</span>
                    <span>Novelty: {(s.metrics.novelSolutionRate * 100).toFixed(0)}%</span>
                    <span>{s.metrics.totalProcessingMs}ms</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🍄</span>
            <h3 className="text-lg font-bold text-white mb-1">ABA-Mycelium Swarm</h3>
            <p className="text-sm text-slate-400 max-w-md">
              Ställ en fråga och låt svärmen analysera den genom tre faser:
              individuell analys, cross-pollination via Mycelium Protocol, och syntes.
            </p>
            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              {nodes.map(n => (
                <span key={n.id} className="text-xs px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300">
                  {n.emoji} {n.label} — {n.description}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-800/50 bg-slate-900/30">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ställ en fråga till svärmen..."
            rows={2}
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/30"
            disabled={loading}
          />
          <button
            onClick={submitQuery}
            disabled={loading || !question.trim()}
            className="shrink-0 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Kör..." : "Kör"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function MetricsBar({ metrics, phases }: { metrics: EmergenceMetrics; phases: SwarmPhaseLog[] }) {
  const items = [
    { label: "Collective IQ", value: metrics.collectiveIQScore.toFixed(2), icon: Brain, color: "text-blue-400" },
    { label: "Novelty", value: `${(metrics.novelSolutionRate * 100).toFixed(0)}%`, icon: Sparkles, color: "text-purple-400" },
    { label: "Cross-Domain", value: metrics.crossDomainIndex.toFixed(2), icon: Zap, color: "text-yellow-400" },
    { label: "Konsensus", value: `${(metrics.consensusStrength * 100).toFixed(0)}%`, icon: Shield, color: "text-emerald-400" },
    { label: "Total tid", value: `${(metrics.totalProcessingMs / 1000).toFixed(1)}s`, icon: BarChart3, color: "text-slate-400" },
  ];

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-3">
      <div className="grid grid-cols-5 gap-3">
        {items.map(item => (
          <div key={item.label} className="text-center">
            <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
            <div className="text-sm font-bold text-white">{item.value}</div>
            <div className="text-[10px] text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
      {/* Phase timeline */}
      <div className="flex gap-1 mt-3">
        {phases.map((p, i) => {
          const totalMs = metrics.totalProcessingMs || 1;
          const widthPct = Math.max((p.durationMs / totalMs) * 100, 8);
          const colors = ["bg-blue-600/40", "bg-purple-600/40", "bg-emerald-600/40"];
          return (
            <div
              key={i}
              className={`${colors[i % colors.length]} rounded-full h-1.5`}
              style={{ width: `${widthPct}%` }}
              title={`${p.label}: ${(p.durationMs / 1000).toFixed(1)}s`}
            />
          );
        })}
      </div>
    </div>
  );
}

function NodeResponseCard({
  response,
  expanded,
  onToggle,
  refined = false,
}: {
  response: SwarmNodeResponse;
  expanded: boolean;
  onToggle: () => void;
  refined?: boolean;
}) {
  const style = getNodeStyle(response.nodeId);

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} overflow-hidden transition-all`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        <span className="text-base">{response.emoji}</span>
        <span className={`text-sm font-medium ${style.text}`}>{response.personality}</span>
        {refined && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/30">
            fördjupad
          </span>
        )}
        <span className="ml-auto text-[10px] text-slate-500">{response.processingMs}ms</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-white/5">
          <div className="prose prose-sm prose-invert max-w-none text-slate-300 mt-2 prose-headings:text-slate-200 prose-strong:text-slate-100">
            <ReactMarkdown>{response.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
