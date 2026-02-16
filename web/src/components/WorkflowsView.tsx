import { useState, useEffect } from "react";
import { GitBranch, Play, Trash2, Plus, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  template?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  runCount: number;
  lastRunAt: string | null;
  lastError: string | null;
  tags: string[];
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  currentStep: number;
  totalSteps: number;
  stepResults: Array<{ stepId: string; stepName: string; result: string; durationMs: number; error?: string }>;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STEP_TYPES = [
  { value: "ai_prompt", label: "AI-prompt" },
  { value: "command", label: "Kommando" },
  { value: "http_request", label: "HTTP-förfrågan" },
  { value: "notification", label: "Notifikation" },
  { value: "delay", label: "Fördröjning" },
  { value: "condition", label: "Villkor" },
];

export default function WorkflowsView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<WorkflowRun | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<Array<{ type: string; name: string; value: string }>>([
    { type: "ai_prompt", name: "Steg 1", value: "" },
  ]);

  const fetchData = () => {
    fetch(`${BRIDGE_URL}/api/workflows`).then(r => r.json()).then(setWorkflows).catch(() => {});
    fetch(`${BRIDGE_URL}/api/workflow-runs?limit=10`).then(r => r.json()).then(setRuns).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const addStep = () => {
    setSteps([...steps, { type: "ai_prompt", name: `Steg ${steps.length + 1}`, value: "" }]);
  };

  const removeStep = (i: number) => {
    setSteps(steps.filter((_, idx) => idx !== i));
  };

  const updateStep = (i: number, field: string, val: string) => {
    const next = [...steps];
    (next[i] as any)[field] = val;
    setSteps(next);
  };

  const createWorkflow = async () => {
    if (!name.trim() || steps.length === 0) return;

    const workflowSteps: WorkflowStep[] = steps.map((s, i) => {
      const config: Record<string, unknown> = {};
      if (s.type === "ai_prompt") config.prompt = s.value;
      else if (s.type === "command") config.command = s.value;
      else if (s.type === "http_request") { config.url = s.value; config.method = "GET"; }
      else if (s.type === "notification") config.message = s.value;
      else if (s.type === "delay") config.delayMs = parseInt(s.value) || 1000;
      else if (s.type === "condition") config.condition = s.value;

      return {
        id: `step-${i}`,
        type: s.type as WorkflowStep["type"],
        name: s.name,
        config,
        template: s.value.includes("{{prev}}") ? s.value : undefined,
      };
    });

    await fetch(`${BRIDGE_URL}/api/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, steps: workflowSteps }),
    });

    setName(""); setDescription("");
    setSteps([{ type: "ai_prompt", name: "Steg 1", value: "" }]);
    setShowCreate(false);
    fetchData();
  };

  const runWorkflow = async (id: string) => {
    setRunning(id);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/workflows/${id}/run`, { method: "POST" });
      const run = await res.json();
      setActiveRun(run);
      fetchData();
    } catch { /* ignore */ }
    setRunning(null);
  };

  const deleteWorkflow = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/workflows/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Workflows</h2>
          <p className="text-[10px] text-slate-500">{workflows.length} workflows</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Uppdatera">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors" title="Ny workflow">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300">Ny workflow</h3>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Namn"
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Beskrivning (valfritt)"
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase">Steg ({steps.length})</span>
              <button onClick={addStep} className="text-[10px] text-blue-400 hover:text-blue-300">+ Lägg till steg</button>
            </div>
            {steps.map((s, i) => (
              <div key={i} className="bg-slate-900/60 rounded-lg p-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-4">{i + 1}.</span>
                  <input type="text" value={s.name} onChange={e => updateStep(i, "name", e.target.value)}
                    placeholder="Stegnamn"
                    className="flex-1 bg-slate-800 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-600" />
                  <select value={s.type} onChange={e => updateStep(i, "type", e.target.value)} title="Stegtyp"
                    className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 rounded px-1.5 py-1">
                    {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="text-slate-600 hover:text-red-400 text-[10px]" title="Ta bort steg">✕</button>
                  )}
                </div>
                <input type="text" value={s.value} onChange={e => updateStep(i, "value", e.target.value)}
                  placeholder={s.type === "ai_prompt" ? "Prompt... (använd {{prev}} för förra stegets resultat)" : s.type === "command" ? "Kommando..." : s.type === "delay" ? "Millisekunder" : "Värde..."}
                  className="w-full bg-slate-800 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 font-mono" />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={createWorkflow} disabled={!name.trim() || steps.some(s => !s.value.trim())}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              Skapa
            </button>
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Active Run */}
      {activeRun && (
        <div className={`bg-slate-800/60 border rounded-xl p-3 ${activeRun.status === "completed" ? "border-green-800/40" : activeRun.status === "failed" ? "border-red-800/40" : "border-amber-800/40"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                activeRun.status === "completed" ? "bg-green-900/60 text-green-300" :
                activeRun.status === "failed" ? "bg-red-900/60 text-red-300" :
                "bg-amber-900/60 text-amber-300"
              }`}>{activeRun.status}</span>
              <span className="text-xs text-white font-medium">{activeRun.workflowName}</span>
            </div>
            <button onClick={() => setActiveRun(null)} className="text-[10px] text-slate-500 hover:text-white">✕</button>
          </div>
          <div className="space-y-1">
            {activeRun.stepResults.map((sr, i) => (
              <div key={i} className={`px-2 py-1.5 rounded-lg text-[10px] ${sr.error ? "bg-red-950/30 border border-red-800/30" : "bg-green-950/30 border border-green-800/30"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">{sr.stepName}</span>
                  <span className="text-slate-500">{sr.durationMs}ms</span>
                </div>
                <p className="text-slate-400 mt-0.5 line-clamp-2">{sr.error || sr.result}</p>
              </div>
            ))}
          </div>
          {activeRun.error && <p className="text-[10px] text-red-400 mt-1">⚠ {activeRun.error}</p>}
        </div>
      )}

      {/* Workflow List */}
      {workflows.length === 0 && !showCreate ? (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">Inga workflows</p>
          <p className="text-xs text-slate-600">Skapa en workflow för att kedja AI-uppgifter</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map(w => (
            <div key={w.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">{w.name}</span>
                  <span className="text-[10px] text-slate-500">{w.steps.length} steg</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => runWorkflow(w.id)} disabled={running === w.id}
                    className="p-1 rounded text-slate-500 hover:text-green-400 transition-colors disabled:opacity-50" title="Kör">
                    {running === w.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteWorkflow(w.id)} className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors" title="Ta bort">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {w.description && <p className="text-[10px] text-slate-500 mb-1">{w.description}</p>}
              <div className="flex items-center gap-1 mb-1 flex-wrap">
                {w.steps.map((s, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">
                    {i + 1}. {s.name} ({s.type})
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-600">
                <span>Körningar: {w.runCount}</span>
                {w.lastRunAt && (
                  <span>
                    Senast: {formatTime(w.lastRunAt)}
                    {w.lastError ? <XCircle className="w-3 h-3 inline ml-1 text-red-400" /> : <CheckCircle className="w-3 h-3 inline ml-1 text-green-400" />}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Runs */}
      {runs.length > 0 && !activeRun && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senaste körningar</h3>
          <div className="space-y-1">
            {runs.map(r => (
              <button key={r.id} onClick={() => setActiveRun(r)}
                className="w-full text-left px-2 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">{r.workflowName}</span>
                  <span className={`text-[10px] ${r.status === "completed" ? "text-green-400" : r.status === "failed" ? "text-red-400" : "text-amber-400"}`}>
                    {r.status === "completed" ? "✓" : r.status === "failed" ? "✗" : "⏳"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600">{r.stepResults.length}/{r.totalSteps} steg · {formatTime(r.startedAt)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
