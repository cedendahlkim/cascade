import { useState, useEffect, useCallback } from "react";
import {
  GitBranch, Play, Square, RefreshCw, ChevronDown, ChevronUp,
  CheckCircle, XCircle, AlertTriangle, Clock, Brain, Shield,
  Eye, Zap, Loader2, BarChart3,
} from "lucide-react";
import { BRIDGE_URL } from "../config";

interface PlanStep {
  id: string;
  index: number;
  description: string;
  specialty: string;
  status: string;
  dependencies: string[];
  output: string | null;
  criticFeedback: string | null;
  validationResult: { passed: boolean; checks: { name: string; passed: boolean; message: string }[]; blockers: string[] } | null;
  attempts: number;
  maxAttempts: number;
  durationMs: number;
}

interface CriticReview {
  id: string;
  targetType: string;
  overallScore: number;
  recommendation: string;
  reasoning: string;
  issues: { severity: string; category: string; description: string; suggestion: string }[];
  timestamp: string;
}

interface Workflow {
  id: string;
  goal: string;
  state: string;
  plan: { id: string; goal: string; steps: PlanStep[]; reasoning: string; revisionCount: number } | null;
  currentStepId: string | null;
  criticReviews: CriticReview[];
  stateHistory: { from: string; to: string; reason: string; timestamp: string }[];
  finalOutput: string | null;
  createdAt: string;
  completedAt: string | null;
  totalDurationMs: number;
}

interface Stats {
  totalWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  avgStepsPerPlan: number;
  avgRevisionsPerWorkflow: number;
  avgCriticScore: number;
  validationPassRate: number;
  activeWorkflows: number;
}

const STATE_COLORS: Record<string, string> = {
  idle: "text-slate-500",
  planning: "text-blue-400",
  plan_review: "text-indigo-400",
  executing: "text-emerald-400",
  criticizing: "text-amber-400",
  validating: "text-purple-400",
  revision: "text-orange-400",
  completed: "text-emerald-400",
  failed: "text-red-400",
  blocked: "text-red-500",
};

const STATE_LABELS: Record<string, string> = {
  idle: "Vilande",
  planning: "Planerar",
  plan_review: "Granskar plan",
  executing: "Utför",
  criticizing: "Kritiserar",
  validating: "Validerar",
  revision: "Reviderar",
  completed: "Klar",
  failed: "Misslyckad",
  blocked: "Blockerad",
};

const STEP_ICONS: Record<string, string> = {
  pending: "⏳",
  in_progress: "⚡",
  completed: "✅",
  failed: "❌",
  skipped: "⏭️",
  blocked: "🚫",
};

const SPECIALTY_COLORS: Record<string, string> = {
  code: "bg-blue-900/50 text-blue-300",
  research: "bg-purple-900/50 text-purple-300",
  analysis: "bg-amber-900/50 text-amber-300",
  writing: "bg-emerald-900/50 text-emerald-300",
  data: "bg-cyan-900/50 text-cyan-300",
  general: "bg-slate-700/50 text-slate-300",
};

export default function HierarchyView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedWf, setExpandedWf] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<Record<string, string | null>>({});

  const fetchData = useCallback(() => {
    fetch(`${BRIDGE_URL}/api/hierarchy/workflows`).then(r => r.json()).then(setWorkflows).catch(() => {});
    fetch(`${BRIDGE_URL}/api/hierarchy/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const startNew = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/hierarchy/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() }),
      });
      const wf = await res.json();
      setGoal("");
      setExpandedWf(wf.id);
      fetchData();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const cancelWf = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/hierarchy/workflows/${id}/cancel`, { method: "POST" });
    fetchData();
  };

  const retryWf = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/hierarchy/workflows/${id}/retry`, { method: "POST" });
    fetchData();
  };

  const toggleSection = (wfId: string, section: string) => {
    setExpandedSection(prev => ({
      ...prev,
      [wfId]: prev[wfId] === section ? null : section,
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="w-5 h-5 text-indigo-400" />
        <h2 className="text-sm font-bold text-white">Hierarkisk Agent-koordinering</h2>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Totalt", value: stats.totalWorkflows, color: "text-slate-300" },
            { label: "Klara", value: stats.completedWorkflows, color: "text-emerald-400" },
            { label: "Misslyckade", value: stats.failedWorkflows, color: "text-red-400" },
            { label: "Aktiva", value: stats.activeWorkflows, color: "text-blue-400" },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
              <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {stats && stats.totalWorkflows > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-xs font-bold text-amber-300">{stats.avgCriticScore}/10</div>
            <div className="text-[9px] text-slate-500">Critic-snitt</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-xs font-bold text-purple-300">{Math.round(stats.validationPassRate * 100)}%</div>
            <div className="text-[9px] text-slate-500">Validering OK</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <div className="text-xs font-bold text-slate-300">{stats.avgStepsPerPlan}</div>
            <div className="text-[9px] text-slate-500">Steg/plan</div>
          </div>
        </div>
      )}

      {/* New workflow */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
        <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">Nytt arbetsflöde</div>
        <div className="flex gap-2">
          <input
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && startNew()}
            placeholder="Beskriv ett komplext mål..."
            aria-label="Workflow-mål"
            className="flex-1 bg-slate-900 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
          />
          <button
            onClick={startNew}
            disabled={!goal.trim() || loading}
            className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg active:bg-indigo-700 disabled:opacity-40 transition-colors touch-manipulation flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Starta
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1.5">
          Planner bryter ner → Executor utför → Critic granskar → Validator godkänner
        </p>
      </div>

      {/* Workflows */}
      {workflows.map(wf => {
        const isExpanded = expandedWf === wf.id;
        const isActive = !["completed", "failed", "blocked", "idle"].includes(wf.state);
        const section = expandedSection[wf.id] || null;

        return (
          <div key={wf.id} className={`bg-slate-800/40 border rounded-xl overflow-hidden ${
            isActive ? "border-indigo-700/50" : wf.state === "completed" ? "border-emerald-800/30" : "border-slate-700/40"
          }`}>
            {/* Workflow header */}
            <button
              onClick={() => setExpandedWf(isExpanded ? null : wf.id)}
              className="w-full flex items-center gap-2 p-3 text-left touch-manipulation"
            >
              <div className={`w-2 h-2 rounded-full ${isActive ? "bg-indigo-400 animate-pulse" : wf.state === "completed" ? "bg-emerald-400" : wf.state === "failed" ? "bg-red-400" : "bg-slate-600"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{wf.goal.slice(0, 80)}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-medium ${STATE_COLORS[wf.state] || "text-slate-500"}`}>
                    {STATE_LABELS[wf.state] || wf.state}
                  </span>
                  {wf.plan && (
                    <span className="text-[10px] text-slate-600">
                      {wf.plan.steps.filter(s => s.status === "completed").length}/{wf.plan.steps.length} steg
                    </span>
                  )}
                  {wf.totalDurationMs > 0 && (
                    <span className="text-[10px] text-slate-600">{(wf.totalDurationMs / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
              {isActive && (
                <button onClick={e => { e.stopPropagation(); cancelWf(wf.id); }} className="p-1 text-red-400 hover:text-red-300" title="Avbryt">
                  <Square className="w-3.5 h-3.5" />
                </button>
              )}
              {(wf.state === "failed" || wf.state === "blocked") && (
                <button onClick={e => { e.stopPropagation(); retryWf(wf.id); }} className="p-1 text-amber-400 hover:text-amber-300" title="Försök igen">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t border-slate-700/30">
                {/* State machine progress */}
                <div className="flex gap-0.5 mt-2 overflow-x-auto">
                  {["planning", "plan_review", "executing", "criticizing", "validating", "completed"].map(s => {
                    const visited = wf.stateHistory.some(h => h.to === s) || wf.state === s;
                    const current = wf.state === s;
                    return (
                      <div key={s} className={`px-1.5 py-0.5 text-[8px] rounded-md whitespace-nowrap ${
                        current ? "bg-indigo-600 text-white font-bold" : visited ? "bg-slate-700 text-slate-300" : "bg-slate-800 text-slate-600"
                      }`}>
                        {STATE_LABELS[s] || s}
                      </div>
                    );
                  })}
                </div>

                {/* Sub-sections */}
                <div className="flex gap-1">
                  {[
                    { id: "plan", label: "Plan", icon: Brain, count: wf.plan?.steps.length || 0 },
                    { id: "critic", label: "Critic", icon: Eye, count: wf.criticReviews.length },
                    { id: "history", label: "Historik", icon: Clock, count: wf.stateHistory.length },
                    { id: "output", label: "Resultat", icon: Zap, count: wf.finalOutput ? 1 : 0 },
                  ].map(s => (
                    <button key={s.id} onClick={() => toggleSection(wf.id, s.id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] rounded-lg transition-colors touch-manipulation ${
                        section === s.id ? "bg-indigo-600/30 text-indigo-300 border border-indigo-700/50" : "bg-slate-800/50 text-slate-500"
                      }`}>
                      <s.icon className="w-3 h-3" />
                      {s.label} {s.count > 0 && <span className="text-[8px]">({s.count})</span>}
                    </button>
                  ))}
                </div>

                {/* Plan steps */}
                {section === "plan" && wf.plan && (
                  <div className="space-y-1.5">
                    {wf.plan.reasoning && (
                      <div className="text-[10px] text-slate-500 italic p-2 bg-slate-900/50 rounded-lg">
                        {wf.plan.reasoning}
                      </div>
                    )}
                    {wf.plan.steps.map(step => (
                      <div key={step.id} className={`p-2 rounded-lg border ${
                        step.status === "completed" ? "bg-emerald-950/20 border-emerald-800/30" :
                        step.status === "in_progress" ? "bg-blue-950/20 border-blue-800/30" :
                        step.status === "failed" ? "bg-red-950/20 border-red-800/30" :
                        "bg-slate-900/30 border-slate-700/30"
                      }`}>
                        <div className="flex items-start gap-2">
                          <span className="text-xs">{STEP_ICONS[step.status] || "⏳"}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium text-white">{step.description}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[8px] px-1 py-0.5 rounded ${SPECIALTY_COLORS[step.specialty] || SPECIALTY_COLORS.general}`}>
                                {step.specialty}
                              </span>
                              {step.attempts > 0 && (
                                <span className="text-[8px] text-slate-600">Försök {step.attempts}/{step.maxAttempts}</span>
                              )}
                              {step.durationMs > 0 && (
                                <span className="text-[8px] text-slate-600">{(step.durationMs / 1000).toFixed(1)}s</span>
                              )}
                            </div>
                            {step.output && (
                              <pre className="mt-1 text-[9px] text-slate-400 bg-slate-900/50 rounded p-1.5 max-h-24 overflow-y-auto whitespace-pre-wrap break-words">
                                {step.output.slice(0, 500)}{step.output.length > 500 ? "..." : ""}
                              </pre>
                            )}
                            {step.validationResult && (
                              <div className="mt-1 flex items-center gap-1">
                                {step.validationResult.passed
                                  ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                                  : <XCircle className="w-3 h-3 text-red-400" />}
                                <span className="text-[9px] text-slate-500">
                                  {step.validationResult.checks.filter(c => c.passed).length}/{step.validationResult.checks.length} checks
                                </span>
                              </div>
                            )}
                            {step.criticFeedback && (
                              <div className="mt-1 text-[9px] text-amber-400/80 italic">
                                Critic: {step.criticFeedback}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Critic reviews */}
                {section === "critic" && (
                  <div className="space-y-1.5">
                    {wf.criticReviews.length === 0 && (
                      <div className="text-[10px] text-slate-600 text-center py-3">Inga granskningar ännu</div>
                    )}
                    {wf.criticReviews.map(review => (
                      <div key={review.id} className={`p-2 rounded-lg border ${
                        review.recommendation === "approve" ? "bg-emerald-950/20 border-emerald-800/30" :
                        review.recommendation === "reject" ? "bg-red-950/20 border-red-800/30" :
                        "bg-amber-950/20 border-amber-800/30"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-medium text-white">{review.targetType}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold ${
                              review.overallScore >= 7 ? "text-emerald-400" : review.overallScore >= 4 ? "text-amber-400" : "text-red-400"
                            }`}>{review.overallScore}/10</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                              review.recommendation === "approve" ? "bg-emerald-900/50 text-emerald-400" :
                              review.recommendation === "reject" ? "bg-red-900/50 text-red-400" :
                              "bg-amber-900/50 text-amber-400"
                            }`}>{review.recommendation}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-400">{review.reasoning.slice(0, 200)}</p>
                        {review.issues.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {review.issues.slice(0, 3).map((issue, i) => (
                              <div key={i} className="flex items-start gap-1">
                                <AlertTriangle className={`w-2.5 h-2.5 shrink-0 mt-0.5 ${
                                  issue.severity === "critical" ? "text-red-400" : issue.severity === "high" ? "text-amber-400" : "text-slate-500"
                                }`} />
                                <span className="text-[9px] text-slate-500">{issue.description}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* State history */}
                {section === "history" && (
                  <div className="space-y-0.5">
                    {wf.stateHistory.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <span className="text-[8px] text-slate-600 w-12 shrink-0">
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        <span className={`text-[9px] ${STATE_COLORS[h.from]}`}>{STATE_LABELS[h.from]}</span>
                        <span className="text-[9px] text-slate-600">→</span>
                        <span className={`text-[9px] font-medium ${STATE_COLORS[h.to]}`}>{STATE_LABELS[h.to]}</span>
                        <span className="text-[8px] text-slate-600 truncate flex-1">{h.reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final output */}
                {section === "output" && (
                  <div>
                    {wf.finalOutput ? (
                      <pre className="text-[10px] text-slate-300 bg-slate-900/50 rounded-lg p-2 max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
                        {wf.finalOutput.slice(0, 3000)}{wf.finalOutput.length > 3000 ? "\n\n..." : ""}
                      </pre>
                    ) : (
                      <div className="text-[10px] text-slate-600 text-center py-3">
                        {isActive ? "Väntar på resultat..." : "Inget resultat"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {workflows.length === 0 && (
        <div className="text-center py-8">
          <GitBranch className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-600">Inga arbetsflöden ännu</p>
          <p className="text-[10px] text-slate-700 mt-1">Ange ett komplext mål ovan för att starta</p>
        </div>
      )}
    </div>
  );
}
