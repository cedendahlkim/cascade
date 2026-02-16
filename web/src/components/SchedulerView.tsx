import { useState, useEffect } from "react";
import { Clock, Play, Pause, Trash2, Plus, RefreshCw, CheckCircle, XCircle, Brain, Terminal, Globe, Bell, Zap, Timer } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface Schedule {
  id: string;
  name: string;
  description: string;
  cron?: string;
  intervalMs?: number;
  runAt?: string;
  action: {
    type: string;
    prompt?: string;
    command?: string;
    url?: string;
    method?: string;
    message?: string;
    agent?: string;
  };
  enabled: boolean;
  createdAt: string;
  lastRunAt: string | null;
  lastResult: string | null;
  lastError: string | null;
  runCount: number;
  errorCount: number;
  tags: string[];
}

interface ScheduleResult {
  scheduleId: string;
  scheduleName: string;
  result: string;
  error: string | null;
  executedAt: string;
  durationMs: number;
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  ai_prompt: { icon: Brain, color: "text-blue-400", bg: "bg-blue-900/30 border-blue-800/30", label: "AI-prompt" },
  command: { icon: Terminal, color: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-800/30", label: "Kommando" },
  http_request: { icon: Globe, color: "text-amber-400", bg: "bg-amber-900/30 border-amber-800/30", label: "HTTP" },
  notification: { icon: Bell, color: "text-violet-400", bg: "bg-violet-900/30 border-violet-800/30", label: "Notis" },
};

const QUICK_TEMPLATES = [
  { name: "Systemkoll", desc: "Kolla systemstatus var 30 min", action: "ai_prompt", value: "Ge en kort systemstatus-rapport: CPU, RAM, disk", interval: 30 },
  { name: "Health check", desc: "Pinga en URL var 5 min", action: "http_request", value: "https://example.com/health", interval: 5 },
  { name: "Daglig sammanfattning", desc: "AI-sammanfattning kl 18:00", action: "ai_prompt", value: "Sammanfatta dagens aktivitet och konversationer", cron: "0 18 * * *" },
  { name: "Backup-påminnelse", desc: "Påminnelse varje söndag", action: "notification", value: "Dags att köra backup!", cron: "0 10 * * 0" },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getNextRun(s: Schedule): string | null {
  if (!s.enabled) return null;
  if (s.runAt) {
    const d = new Date(s.runAt);
    if (d.getTime() < Date.now()) return null;
    const diff = d.getTime() - Date.now();
    if (diff < 60000) return `${Math.round(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m`;
    return `${Math.round(diff / 3600000)}h`;
  }
  if (s.intervalMs && s.lastRunAt) {
    const next = new Date(s.lastRunAt).getTime() + s.intervalMs;
    const diff = next - Date.now();
    if (diff < 0) return "snart";
    if (diff < 60000) return `${Math.round(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m`;
    return `${Math.round(diff / 3600000)}h`;
  }
  if (s.intervalMs && !s.lastRunAt) return "snart";
  return null;
}

export default function SchedulerView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [results, setResults] = useState<ScheduleResult[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState("ai_prompt");
  const [actionValue, setActionValue] = useState("");
  const [scheduleType, setScheduleType] = useState<"cron" | "interval" | "once">("interval");
  const [cronExpr, setCronExpr] = useState("0 * * * *");
  const [intervalMin, setIntervalMin] = useState(30);
  const [runAtDate, setRunAtDate] = useState("");
  const [, setTick] = useState(0);

  const fetchSchedules = () => {
    fetch(`${BRIDGE_URL}/api/schedules`).then(r => r.json()).then(setSchedules).catch(() => {});
    fetch(`${BRIDGE_URL}/api/schedule-results?limit=20`).then(r => r.json()).then(setResults).catch(() => {});
  };

  useEffect(() => {
    fetchSchedules();
    const dataInterval = setInterval(fetchSchedules, 10000);
    const tickInterval = setInterval(() => setTick(t => t + 1), 10000);
    return () => { clearInterval(dataInterval); clearInterval(tickInterval); };
  }, []);

  const createSchedule = async () => {
    if (!name.trim() || !actionValue.trim()) return;

    const action: Record<string, string> = { type: actionType };
    if (actionType === "ai_prompt") action.prompt = actionValue;
    else if (actionType === "command") action.command = actionValue;
    else if (actionType === "http_request") { action.url = actionValue; action.method = "GET"; }
    else if (actionType === "notification") action.message = actionValue;

    const body: Record<string, unknown> = { name, description, action };
    if (scheduleType === "cron") body.cron = cronExpr;
    else if (scheduleType === "interval") body.intervalMs = intervalMin * 60 * 1000;
    else if (scheduleType === "once") body.runAt = new Date(runAtDate).toISOString();

    await fetch(`${BRIDGE_URL}/api/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setName(""); setDescription(""); setActionValue("");
    setShowCreate(false);
    fetchSchedules();
  };

  const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setName(t.name);
    setDescription(t.desc);
    setActionType(t.action);
    setActionValue(t.value);
    if (t.cron) { setScheduleType("cron"); setCronExpr(t.cron); }
    else if (t.interval) { setScheduleType("interval"); setIntervalMin(t.interval); }
    setShowTemplates(false);
    setShowCreate(true);
  };

  const toggleSchedule = async (id: string, enabled: boolean) => {
    await fetch(`${BRIDGE_URL}/api/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    fetchSchedules();
  };

  const deleteSchedule = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/schedules/${id}`, { method: "DELETE" });
    fetchSchedules();
  };

  const runNow = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/schedules/${id}/run`, { method: "POST" });
    setTimeout(fetchSchedules, 2000);
  };

  const active = schedules.filter(s => s.enabled).length;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Schemalagda uppgifter</h2>
          <p className="text-[10px] text-slate-500">{active} aktiva av {schedules.length}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowResults(!showResults)} className={`p-2 rounded-lg transition-colors ${showResults ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} title="Visa resultat">
            <Clock className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowTemplates(!showTemplates); setShowCreate(false); }} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Snabbmallar">
            <Zap className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowCreate(!showCreate); setShowTemplates(false); }} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors" title="Nytt schema">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Templates */}
      {showTemplates && (
        <div className="grid grid-cols-2 gap-2">
          {QUICK_TEMPLATES.map(t => {
            const cfg = ACTION_CONFIG[t.action];
            const Icon = cfg?.icon || Clock;
            return (
              <button key={t.name} onClick={() => applyTemplate(t)}
                className={`text-left p-3 rounded-xl border transition-colors active:scale-[0.98] ${cfg?.bg || "bg-slate-800/60 border-slate-700/50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${cfg?.color || "text-slate-400"}`} />
                  <span className="text-xs font-medium text-white">{t.name}</span>
                </div>
                <p className="text-[10px] text-slate-500">{t.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300">Nytt schema</h3>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Namn (t.ex. 'Daglig backup')"
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />
          <input
            type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Beskrivning (valfritt)"
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />

          {/* Action type */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase mb-1 block">Åtgärd</label>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={key} onClick={() => setActionType(key)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-medium transition-colors ${actionType === key ? `${cfg.bg} ${cfg.color}` : "border-slate-700/50 text-slate-500 hover:text-slate-300"}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <input
            type="text" value={actionValue} onChange={e => setActionValue(e.target.value)}
            placeholder={actionType === "ai_prompt" ? "Prompt till AI..." : actionType === "command" ? "dir C:\\" : actionType === "http_request" ? "https://api.example.com/health" : "Meddelande..."}
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 font-mono"
          />

          {/* Schedule type */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase mb-1 block">Tidpunkt</label>
            <div className="flex gap-1 bg-slate-800/40 rounded-lg p-0.5 mb-2">
              {([["interval", "Intervall"], ["cron", "Cron"], ["once", "Engång"]] as const).map(([id, label]) => (
                <button key={id} onClick={() => setScheduleType(id)}
                  className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors ${scheduleType === id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>
                  {label}
                </button>
              ))}
            </div>
            {scheduleType === "interval" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Var</span>
                <input type="number" value={intervalMin} onChange={e => setIntervalMin(Number(e.target.value))} min={1}
                  title="Intervall i minuter"
                  className="w-20 bg-slate-800 text-white rounded-lg px-2 py-1.5 text-sm border border-slate-700 focus:outline-none focus:border-blue-500" />
                <span className="text-xs text-slate-400">minut(er)</span>
              </div>
            )}
            {scheduleType === "cron" && (
              <div className="space-y-1">
                <input type="text" value={cronExpr} onChange={e => setCronExpr(e.target.value)}
                  placeholder="0 * * * *"
                  className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 font-mono placeholder:text-slate-500" />
                <p className="text-[10px] text-slate-600">min tim dag mån veckodag (t.ex. &quot;0 9 * * 1-5&quot; = 09:00 vardagar)</p>
              </div>
            )}
            {scheduleType === "once" && (
              <input type="datetime-local" value={runAtDate} onChange={e => setRunAtDate(e.target.value)}
                title="Välj datum och tid"
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500" />
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={createSchedule} disabled={!name.trim() || !actionValue.trim()}
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

      {/* Results */}
      {showResults && results.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senaste resultat</h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className={`px-2.5 py-2 rounded-lg border ${r.error ? "bg-red-950/30 border-red-800/40" : "bg-green-950/30 border-green-800/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-300">{r.scheduleName}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{r.durationMs}ms</span>
                    <span>{formatTime(r.executedAt)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{r.error || r.result}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule List */}
      {schedules.length === 0 && !showCreate && !showTemplates ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">Inga scheman</p>
          <p className="text-xs text-slate-600 mb-4">Skapa ett schema för att köra uppgifter automatiskt</p>
          <button onClick={() => setShowTemplates(true)}
            className="text-[11px] px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/30 text-blue-400 hover:text-blue-300 transition-colors">
            <Zap className="w-3.5 h-3.5 inline mr-1 -mt-0.5" /> Visa snabbmallar
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => {
            const cfg = ACTION_CONFIG[s.action.type];
            const ActionIcon = cfg?.icon || Clock;
            const nextRun = getNextRun(s);
            return (
              <div key={s.id} className={`border rounded-xl p-3 transition-all ${s.enabled ? cfg?.bg || "bg-slate-800/60 border-slate-700/50" : "bg-slate-800/30 border-slate-800/30 opacity-60"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleSchedule(s.id, !s.enabled)} title={s.enabled ? "Pausa" : "Aktivera"}
                      className={`p-1 rounded transition-colors ${s.enabled ? "text-green-400 hover:text-green-300" : "text-slate-600 hover:text-slate-400"}`}>
                      {s.enabled ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <span className="text-sm font-medium text-white">{s.name}</span>
                      {nextRun && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-800/30">
                          <Timer className="w-2.5 h-2.5 inline -mt-0.5 mr-0.5" />{nextRun}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => runNow(s.id)} className="p-1 rounded text-slate-500 hover:text-blue-400 transition-colors" title="Kör nu">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteSchedule(s.id)} className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors" title="Ta bort">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${cfg?.bg || "bg-slate-700/60"}`}>
                    <ActionIcon className={`w-3 h-3 ${cfg?.color || "text-slate-400"}`} />
                    {cfg?.label || s.action.type}
                  </span>
                  {s.cron && <span className="font-mono">{s.cron}</span>}
                  {s.intervalMs && <span>var {Math.round(s.intervalMs / 60000)} min</span>}
                  {s.runAt && <span>vid {formatTime(s.runAt)}</span>}
                </div>
                {s.description && <p className="text-[10px] text-slate-500 mb-1">{s.description}</p>}
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-slate-500">{s.runCount} körningar</span>
                  {s.errorCount > 0 && <span className="text-red-400">{s.errorCount} fel</span>}
                  {s.lastRunAt && (
                    <span className="text-slate-600 ml-auto flex items-center gap-1">
                      {formatTime(s.lastRunAt)}
                      {s.lastError ? <XCircle className="w-3 h-3 text-red-400" /> : <CheckCircle className="w-3 h-3 text-green-400" />}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
