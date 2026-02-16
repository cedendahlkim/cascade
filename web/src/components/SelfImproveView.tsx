import { useState, useEffect } from "react";
import { Brain, Sparkles, TrendingUp, Trash2, RefreshCw, Star, Lightbulb, Zap, MessageSquare } from "lucide-react";
import { BRIDGE_URL } from "../config";

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

interface Evaluation {
  id: string;
  userMessage: string;
  agentResponse: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
  userFeedback: string | null;
  userRating: number | null;
  timestamp: string;
}

interface Reflection {
  id: string;
  originalResponse: string;
  critique: string;
  improvedResponse: string;
  qualityDelta: number;
  applied: boolean;
  timestamp: string;
}

interface Stats {
  skills: { total: number; totalUses: number; avgScore: number; topSkills: Skill[] };
  evaluations: { total: number; avgScore: number; recentTrend: number; scoreDistribution: Record<number, number> };
  reflections: { total: number; applied: number; avgDelta: number; improvementRate: number };
  learnings: string[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ScoreStars({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${cls} ${i <= score ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
      ))}
    </div>
  );
}

export default function SelfImproveView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [patterns, setPatterns] = useState<{ goodPatterns: string[]; badPatterns: string[] }>({ goodPatterns: [], badPatterns: [] });
  const [subTab, setSubTab] = useState<"overview" | "skills" | "evaluations" | "reflections">("overview");

  const fetchAll = () => {
    fetch(`${BRIDGE_URL}/api/self-improve/stats`).then(r => r.json()).then(setStats).catch(() => {});
    fetch(`${BRIDGE_URL}/api/self-improve/skills`).then(r => r.json()).then(setSkills).catch(() => {});
    fetch(`${BRIDGE_URL}/api/self-improve/evaluations?limit=30`).then(r => r.json()).then(setEvaluations).catch(() => {});
    fetch(`${BRIDGE_URL}/api/self-improve/reflections?limit=15`).then(r => r.json()).then(setReflections).catch(() => {});
    fetch(`${BRIDGE_URL}/api/self-improve/patterns`).then(r => r.json()).then(setPatterns).catch(() => {});
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteSkillHandler = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/self-improve/skills/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const sendFeedback = async (evalId: string, rating: number) => {
    await fetch(`${BRIDGE_URL}/api/self-improve/evaluations/${evalId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback: `User rated ${rating}/5`, rating }),
    });
    fetchAll();
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Självförbättring
          </h2>
          <p className="text-[10px] text-slate-500">AI:n lär sig av sina egna svar</p>
        </div>
        <button onClick={fetchAll} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Uppdatera">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1">
        {([
          { id: "overview", label: "Översikt", icon: TrendingUp },
          { id: "skills", label: "Skills", icon: Zap },
          { id: "evaluations", label: "Utvärderingar", icon: Star },
          { id: "reflections", label: "Reflektioner", icon: Lightbulb },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              subTab === t.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
            }`}>
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {subTab === "overview" && stats && (
        <div className="space-y-3">
          {/* Score card */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-amber-300">{stats.evaluations.avgScore || "—"}</div>
              <div className="text-[10px] text-slate-500">Snittbetyg</div>
              <ScoreStars score={Math.round(stats.evaluations.avgScore)} />
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
              <div className={`text-lg font-bold ${stats.evaluations.recentTrend >= 0 ? "text-green-400" : "text-red-400"}`}>
                {stats.evaluations.recentTrend >= 0 ? "+" : ""}{stats.evaluations.recentTrend}
              </div>
              <div className="text-[10px] text-slate-500">Trend</div>
              <TrendingUp className={`w-4 h-4 mx-auto mt-0.5 ${stats.evaluations.recentTrend >= 0 ? "text-green-500" : "text-red-500 rotate-180"}`} />
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-blue-300">{stats.skills.total}</div>
              <div className="text-[10px] text-slate-500">Skills</div>
              <div className="text-[10px] text-slate-600">{stats.skills.totalUses} användningar</div>
            </div>
          </div>

          {/* Activity stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="text-xs font-medium text-slate-300 mb-1">Utvärderingar</div>
              <div className="text-sm font-bold text-white">{stats.evaluations.total}</div>
              <div className="flex gap-1 mt-1">
                {[5, 4, 3, 2, 1].map(s => (
                  <div key={s} className="flex-1 text-center">
                    <div className="text-[10px] text-slate-500">{s}★</div>
                    <div className="text-[10px] font-medium text-slate-400">{stats.evaluations.scoreDistribution[s] || 0}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="text-xs font-medium text-slate-300 mb-1">Reflektioner</div>
              <div className="text-sm font-bold text-white">{stats.reflections.total}</div>
              <div className="text-[10px] text-slate-500">
                {stats.reflections.applied} applicerade · {stats.reflections.improvementRate}% förbättringsgrad
              </div>
              {stats.reflections.avgDelta !== 0 && (
                <div className="text-[10px] text-green-400 mt-0.5">Snitt +{stats.reflections.avgDelta} kvalitet</div>
              )}
            </div>
          </div>

          {/* Learnings */}
          {stats.learnings.length > 0 && (
            <div className="bg-slate-800/60 border border-amber-800/30 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-300">Insikter</span>
              </div>
              <div className="space-y-1">
                {stats.learnings.map((l, i) => (
                  <p key={i} className="text-[11px] text-slate-300">{l}</p>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {(patterns.goodPatterns.length > 0 || patterns.badPatterns.length > 0) && (
            <div className="grid grid-cols-2 gap-2">
              {patterns.goodPatterns.length > 0 && (
                <div className="bg-green-950/30 border border-green-800/30 rounded-xl p-3">
                  <div className="text-[10px] text-green-400 font-semibold uppercase mb-1">Styrkor</div>
                  {patterns.goodPatterns.slice(0, 5).map((p, i) => (
                    <p key={i} className="text-[10px] text-green-300/80">✓ {p}</p>
                  ))}
                </div>
              )}
              {patterns.badPatterns.length > 0 && (
                <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-3">
                  <div className="text-[10px] text-red-400 font-semibold uppercase mb-1">Förbättra</div>
                  {patterns.badPatterns.slice(0, 5).map((p, i) => (
                    <p key={i} className="text-[10px] text-red-300/80">△ {p}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {stats.evaluations.total === 0 && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Ingen data ännu</p>
              <p className="text-xs text-slate-600">Skicka meddelanden till Claude så börjar AI:n utvärdera sig själv automatiskt</p>
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {subTab === "skills" && (
        <div className="space-y-2">
          {skills.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Inga skills ännu</p>
              <p className="text-xs text-slate-600">Skills extraheras automatiskt när AI:n använder verktyg framgångsrikt</p>
            </div>
          ) : (
            skills.map(s => (
              <div key={s.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreStars score={Math.round(s.avgScore)} />
                    <button onClick={() => deleteSkillHandler(s.id)} className="p-1 text-slate-600 hover:text-red-400" title="Ta bort">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mb-1">{s.description}</p>
                <div className="flex items-center gap-1 flex-wrap mb-1">
                  {s.toolChain.map((t, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-blue-300 font-mono">
                      {t.tool}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-600">
                  <span>Använd {s.useCount}x</span>
                  {s.tags.length > 0 && <span>{s.tags.join(", ")}</span>}
                  <span>{formatTime(s.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Evaluations */}
      {subTab === "evaluations" && (
        <div className="space-y-2">
          {evaluations.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Inga utvärderingar ännu</p>
              <p className="text-xs text-slate-600">AI:n utvärderar automatiskt varje svar den ger</p>
            </div>
          ) : (
            evaluations.slice().reverse().map(ev => (
              <div key={ev.id} className={`bg-slate-800/60 border rounded-xl p-3 ${
                ev.score >= 4 ? "border-green-800/30" : ev.score <= 2 ? "border-red-800/30" : "border-slate-700/50"
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <ScoreStars score={ev.score} size="lg" />
                  <span className="text-[10px] text-slate-600">{formatTime(ev.timestamp)}</span>
                </div>
                <div className="mb-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MessageSquare className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-slate-500">Fråga:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">{ev.userMessage}</p>
                </div>
                {ev.strengths.length > 0 && (
                  <div className="text-[10px] text-green-400/80 mb-0.5">
                    ✓ {ev.strengths.join(" · ")}
                  </div>
                )}
                {ev.weaknesses.length > 0 && (
                  <div className="text-[10px] text-red-400/80 mb-0.5">
                    △ {ev.weaknesses.join(" · ")}
                  </div>
                )}
                {ev.improvement && (
                  <div className="text-[10px] text-amber-400/80">
                    💡 {ev.improvement}
                  </div>
                )}
                {/* User feedback buttons */}
                <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-slate-700/30">
                  <span className="text-[10px] text-slate-600 mr-1">Din bedömning:</span>
                  {ev.userRating ? (
                    <ScoreStars score={ev.userRating} />
                  ) : (
                    [1, 2, 3, 4, 5].map(r => (
                      <button key={r} onClick={() => sendFeedback(ev.id, r)}
                        className="p-0.5 text-slate-600 hover:text-amber-400 transition-colors" title={`${r}/5`}>
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reflections */}
      {subTab === "reflections" && (
        <div className="space-y-2">
          {reflections.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Inga reflektioner ännu</p>
              <p className="text-xs text-slate-600">Reflektioner skapas när AI:n ger ett svar med låg kvalitet och kan göra bättre</p>
            </div>
          ) : (
            reflections.slice().reverse().map(r => (
              <div key={r.id} className={`bg-slate-800/60 border rounded-xl p-3 ${r.applied ? "border-green-800/30" : "border-slate-700/50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Lightbulb className={`w-4 h-4 ${r.applied ? "text-green-400" : "text-slate-500"}`} />
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      r.applied ? "bg-green-900/60 text-green-300" : "bg-slate-700/60 text-slate-400"
                    }`}>{r.applied ? "Applicerad" : "Sparad"}</span>
                    {r.qualityDelta > 0 && (
                      <span className="text-[10px] text-green-400">+{r.qualityDelta} kvalitet</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600">{formatTime(r.timestamp)}</span>
                </div>
                <div className="bg-red-950/20 rounded-lg px-2 py-1.5 mb-1.5">
                  <div className="text-[10px] text-red-400 font-medium mb-0.5">Kritik:</div>
                  <p className="text-[10px] text-slate-400">{r.critique}</p>
                </div>
                <div className="bg-green-950/20 rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-green-400 font-medium mb-0.5">Förbättrat svar:</div>
                  <p className="text-[10px] text-slate-400 line-clamp-3">{r.improvedResponse}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
