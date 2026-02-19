import { useState, useEffect, useCallback } from "react";
import { BRIDGE_URL } from "../config";
import {
  FlaskConical, Plus, Play, Trash2, Star, Trophy, Clock,
  DollarSign, Zap, RefreshCw, ChevronDown, ChevronRight, X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface PromptVariant {
  id: string;
  label: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

interface VariantResult {
  variantId: string;
  model: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  quality?: number;
  autoScore?: number;
}

interface VariantStats {
  variantId: string;
  label: string;
  avgLatencyMs: number;
  avgCostUsd: number;
  avgTokens: number;
  avgQuality: number;
  avgAutoScore: number;
  resultCount: number;
  modelBreakdown: {
    model: string;
    avgLatencyMs: number;
    avgCostUsd: number;
    avgQuality: number;
    avgAutoScore: number;
    count: number;
  }[];
}

interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: PromptVariant[];
  models: string[];
  results: VariantResult[];
  status: string;
  createdAt: string;
  completedAt?: string;
  winner?: { variantId: string; reason: string; criteria: string };
  runs: number;
  judgePrompt?: string;
  stats?: VariantStats[];
}

interface ExperimentSummary {
  id: string;
  name: string;
  status: string;
  variantCount: number;
  modelCount: number;
  resultCount: number;
  createdAt: string;
  winner?: string;
}

// ─── Constants ───────────────────────────────────────────────

const AVAILABLE_MODELS = ["gemini", "claude", "deepseek", "grok", "ollama"];

const MODEL_COLORS: Record<string, string> = {
  claude: "#D97706",
  gemini: "#2563EB",
  deepseek: "#059669",
  grok: "#DC2626",
  ollama: "#7C3AED",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-600",
  running: "bg-blue-600 animate-pulse",
  completed: "bg-green-600",
  failed: "bg-red-600",
};

// ─── Component ───────────────────────────────────────────────

export default function PromptLabView() {
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formModels, setFormModels] = useState<string[]>(["gemini"]);
  const [formRuns, setFormRuns] = useState(1);
  const [formVariants, setFormVariants] = useState<
    { label: string; systemPrompt: string; userPrompt: string; temperature: number }[]
  >([
    { label: "Variant A", systemPrompt: "Du är en hjälpsam AI-assistent.", userPrompt: "", temperature: 0.7 },
    { label: "Variant B", systemPrompt: "Du är en expert AI-assistent. Var koncis och exakt.", userPrompt: "", temperature: 0.3 },
  ]);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/prompt-lab/experiments`);
      if (res.ok) setExperiments(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchExperiment = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${BRIDGE_URL}/api/prompt-lab/experiments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelected(data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    if (selectedId) fetchExperiment(selectedId);
  }, [selectedId, fetchExperiment]);

  const handleCreate = async () => {
    if (!formName || formVariants.some(v => !v.userPrompt)) return;

    try {
      const res = await fetch(`${BRIDGE_URL}/api/prompt-lab/experiments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          variants: formVariants,
          models: formModels,
          runs: formRuns,
        }),
      });
      if (res.ok) {
        const experiment = await res.json();
        setShowCreate(false);
        setFormName("");
        setFormDesc("");
        await fetchList();
        setSelectedId(experiment.id);
      }
    } catch { /* ignore */ }
  };

  const handleRun = async () => {
    if (!selectedId) return;
    setRunning(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/prompt-lab/experiments/${selectedId}/run`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setSelected(data);
        await fetchList();
      }
    } catch { /* ignore */ }
    finally { setRunning(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ta bort experiment?")) return;
    await fetch(`${BRIDGE_URL}/api/prompt-lab/experiments/${id}`, { method: "DELETE" });
    if (selectedId === id) { setSelectedId(null); setSelected(null); }
    await fetchList();
  };

  const handleRate = async (variantId: string, model: string, quality: number) => {
    if (!selectedId) return;
    await fetch(`${BRIDGE_URL}/api/prompt-lab/experiments/${selectedId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, model, quality }),
    });
    await fetchExperiment(selectedId);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold">Prompt Lab</h2>
          <span className="text-xs text-slate-500">A/B-testa prompts mot flera LLM:er</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Nytt experiment
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nytt Experiment</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Namn</label>
                <input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="t.ex. Kodgenerering - ton & stil"
                  className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Beskrivning (valfritt)</label>
                <input
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Vad testar vi?"
                  className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Modeller</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_MODELS.map(m => (
                    <button
                      key={m}
                      onClick={() => setFormModels(prev =>
                        prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
                      )}
                      className={`px-3 py-1 rounded text-xs capitalize border ${
                        formModels.includes(m)
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-slate-600 bg-slate-700 text-slate-400"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Antal körningar per variant</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formRuns}
                  onChange={e => setFormRuns(parseInt(e.target.value) || 1)}
                  className="w-20 bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600"
                />
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400">Varianter</label>
                  <button
                    onClick={() => setFormVariants(prev => [
                      ...prev,
                      {
                        label: `Variant ${String.fromCharCode(65 + prev.length)}`,
                        systemPrompt: "",
                        userPrompt: prev[0]?.userPrompt || "",
                        temperature: 0.7,
                      },
                    ])}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    + Lägg till variant
                  </button>
                </div>
                <div className="space-y-3">
                  {formVariants.map((v, i) => (
                    <div key={i} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <input
                          value={v.label}
                          onChange={e => {
                            const next = [...formVariants];
                            next[i] = { ...next[i], label: e.target.value };
                            setFormVariants(next);
                          }}
                          className="bg-transparent font-medium text-sm w-40"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-500">Temp:</label>
                          <input
                            type="number"
                            step={0.1}
                            min={0}
                            max={2}
                            value={v.temperature}
                            onChange={e => {
                              const next = [...formVariants];
                              next[i] = { ...next[i], temperature: parseFloat(e.target.value) || 0.7 };
                              setFormVariants(next);
                            }}
                            className="w-16 bg-slate-600 rounded px-2 py-0.5 text-xs border border-slate-500"
                          />
                          {formVariants.length > 2 && (
                            <button
                              onClick={() => setFormVariants(prev => prev.filter((_, j) => j !== i))}
                              className="text-red-400 hover:text-red-300 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <textarea
                        value={v.systemPrompt}
                        onChange={e => {
                          const next = [...formVariants];
                          next[i] = { ...next[i], systemPrompt: e.target.value };
                          setFormVariants(next);
                        }}
                        placeholder="System prompt..."
                        rows={2}
                        className="w-full bg-slate-600 rounded px-3 py-1.5 text-xs mb-2 border border-slate-500 resize-none"
                      />
                      <textarea
                        value={v.userPrompt}
                        onChange={e => {
                          const next = [...formVariants];
                          next[i] = { ...next[i], userPrompt: e.target.value };
                          setFormVariants(next);
                        }}
                        placeholder="User prompt (samma för alla varianter)"
                        rows={2}
                        className="w-full bg-slate-600 rounded px-3 py-1.5 text-xs border border-slate-500 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formName || formVariants.some(v => !v.userPrompt)}
                  className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 rounded disabled:opacity-40"
                >
                  Skapa experiment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experiment List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left: List */}
        <div className="space-y-2">
          {experiments.length === 0 && (
            <div className="text-center text-slate-500 py-8 text-sm">
              Inga experiment ännu. Skapa ett!
            </div>
          )}
          {experiments.map(exp => (
            <button
              key={exp.id}
              onClick={() => setSelectedId(exp.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedId === exp.id
                  ? "bg-purple-500/10 border-purple-500/50"
                  : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{exp.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[exp.status] || "bg-slate-500"}`} />
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(exp.id); }}
                    className="p-0.5 hover:text-red-400 text-slate-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {exp.variantCount} varianter · {exp.modelCount} modeller · {exp.resultCount} resultat
              </div>
            </button>
          ))}
        </div>

        {/* Right: Detail */}
        <div className="md:col-span-2">
          {!selected && (
            <div className="text-center text-slate-500 py-16">
              <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Välj eller skapa ett experiment</p>
            </div>
          )}

          {selected && (
            <div className="space-y-4">
              {/* Experiment header */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selected.name}</h3>
                    {selected.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{selected.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[selected.status] || "bg-slate-600"}`}>
                      {selected.status}
                    </span>
                    {selected.status === "draft" && (
                      <button
                        onClick={handleRun}
                        disabled={running}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm disabled:opacity-50"
                      >
                        {running ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Kör
                      </button>
                    )}
                    {selected.status === "completed" && (
                      <button
                        onClick={handleRun}
                        disabled={running}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
                        Kör igen
                      </button>
                    )}
                  </div>
                </div>

                {/* Winner banner */}
                {selected.winner && (
                  <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded p-2.5 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">
                      <strong className="text-yellow-300">
                        {selected.variants.find(v => v.id === selected.winner?.variantId)?.label || "?"}
                      </strong>
                      {" "}vann — {selected.winner.reason}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats comparison */}
              {selected.stats && selected.stats.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Jämförelse</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 text-xs">
                          <th className="text-left py-1.5 px-2">Variant</th>
                          <th className="text-right py-1.5 px-2">Latens</th>
                          <th className="text-right py-1.5 px-2">Kostnad</th>
                          <th className="text-right py-1.5 px-2">Tokens</th>
                          <th className="text-right py-1.5 px-2">AI Score</th>
                          <th className="text-right py-1.5 px-2">Betyg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.stats.map(stat => {
                          const isWinner = stat.variantId === selected.winner?.variantId;
                          return (
                            <tr
                              key={stat.variantId}
                              className={`border-t border-slate-700/50 ${isWinner ? "bg-yellow-500/5" : ""}`}
                            >
                              <td className="py-2 px-2 flex items-center gap-1.5">
                                {isWinner && <Trophy className="w-3 h-3 text-yellow-400" />}
                                <span className={isWinner ? "font-semibold text-yellow-300" : ""}>{stat.label}</span>
                              </td>
                              <td className="text-right py-2 px-2">{stat.avgLatencyMs}ms</td>
                              <td className="text-right py-2 px-2">${stat.avgCostUsd.toFixed(4)}</td>
                              <td className="text-right py-2 px-2">{stat.avgTokens}</td>
                              <td className="text-right py-2 px-2">
                                {stat.avgAutoScore > 0 ? `${stat.avgAutoScore.toFixed(0)}/100` : "-"}
                              </td>
                              <td className="text-right py-2 px-2">
                                {stat.avgQuality > 0 ? `${stat.avgQuality.toFixed(1)}/5` : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Results */}
              {selected.results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Resultat ({selected.results.length})</h4>
                  {selected.variants.map(variant => (
                    <ResultGroup
                      key={variant.id}
                      variant={variant}
                      results={selected.results.filter(r => r.variantId === variant.id)}
                      isWinner={variant.id === selected.winner?.variantId}
                      onRate={(model, q) => handleRate(variant.id, model, q)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function ResultGroup({
  variant,
  results,
  isWinner,
  onRate,
}: {
  variant: PromptVariant;
  results: VariantResult[];
  isWinner: boolean;
  onRate: (model: string, quality: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-slate-800/50 border rounded-lg ${isWinner ? "border-yellow-500/40" : "border-slate-700"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <span className="font-medium text-sm">{variant.label}</span>
          {isWinner && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
          <span className="text-xs text-slate-500">({results.length} svar)</span>
        </div>
        <span className="text-xs text-slate-500">temp: {variant.temperature}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-700/50 p-3 space-y-3">
          <div className="text-xs text-slate-400 bg-slate-700/30 rounded p-2">
            <strong>System:</strong> {variant.systemPrompt.slice(0, 100)}
            {variant.systemPrompt.length > 100 ? "..." : ""}
          </div>
          {results.map((result, i) => (
            <div key={i} className="border border-slate-700/50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: MODEL_COLORS[result.model] || "#64748b" }}
                  />
                  <span className="text-sm font-medium capitalize">{result.model}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {result.latencyMs}ms
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {result.inputTokens + result.outputTokens} tok
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> ${result.costUsd.toFixed(4)}
                  </span>
                  {result.autoScore !== undefined && (
                    <span className={`font-medium ${result.autoScore >= 70 ? "text-green-400" : result.autoScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                      AI: {result.autoScore}/100
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-300 bg-slate-900/50 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">
                {result.response.slice(0, 500)}
                {result.response.length > 500 ? "..." : ""}
              </div>
              {/* Rating */}
              {!result.quality && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[10px] text-slate-500 mr-1">Betyg:</span>
                  {[1, 2, 3, 4, 5].map(q => (
                    <button
                      key={q}
                      onClick={() => onRate(result.model, q)}
                      className="p-0.5 hover:text-yellow-400 text-slate-600 transition-colors"
                      title={`Betyg ${q}/5`}
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}
              {result.quality && (
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map(q => (
                    <Star
                      key={q}
                      className={`w-3 h-3 ${q <= result.quality! ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
