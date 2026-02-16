import { useState, useEffect } from "react";
import { Monitor, Wifi, WifiOff, Cpu, HardDrive, Play, RefreshCw, Trash2, Terminal } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface Computer {
  id: string;
  name: string;
  description: string;
  capabilities: {
    os: string;
    arch: string;
    hasGpu: boolean;
    gpuName?: string;
    ramGb: number;
    cpuCores: number;
    cpuModel?: string;
    hostname: string;
    username: string;
    tools: string[];
  };
  status: "online" | "offline" | "busy" | "error";
  lastSeen: string;
  registeredAt: string;
  tags: string[];
  taskCount: number;
  errorCount: number;
  avgLatencyMs: number;
}

interface ComputerTask {
  id: string;
  computerId: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  result: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-slate-600",
  busy: "bg-amber-500",
  error: "bg-red-500",
};

const OS_ICONS: Record<string, string> = {
  windows: "🪟",
  macos: "🍎",
  linux: "🐧",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ComputersView() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [selected, setSelected] = useState<Computer | null>(null);
  const [tasks, setTasks] = useState<ComputerTask[]>([]);
  const [command, setCommand] = useState("");
  const [taskType, setTaskType] = useState("command");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const fetchComputers = () => {
    fetch(`${BRIDGE_URL}/api/computers`)
      .then(r => r.json())
      .then(setComputers)
      .catch(() => {});
  };

  useEffect(() => {
    fetchComputers();
    const interval = setInterval(fetchComputers, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) {
      fetch(`${BRIDGE_URL}/api/computers/${selected.id}/tasks?limit=20`)
        .then(r => r.json())
        .then(setTasks)
        .catch(() => {});
    }
  }, [selected]);

  const executeTask = async () => {
    if (!selected || !command.trim()) return;
    setExecuting(true);
    setResult(null);
    try {
      const payload = taskType === "command"
        ? { command: command.trim() }
        : taskType === "file_read"
          ? { path: command.trim() }
          : { command: command.trim() };

      const res = await fetch(`${BRIDGE_URL}/api/computers/${selected.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: taskType, payload, timeout: 30000 }),
      });
      const data = await res.json();
      setResult(data.result || data.error || JSON.stringify(data));
      setCommand("");
      // Refresh tasks
      fetch(`${BRIDGE_URL}/api/computers/${selected.id}/tasks?limit=20`)
        .then(r => r.json())
        .then(setTasks)
        .catch(() => {});
    } catch (err) {
      setResult(`Error: ${err}`);
    }
    setExecuting(false);
  };

  const autoRoute = async () => {
    if (!command.trim()) return;
    setExecuting(true);
    setResult(null);
    try {
      const payload = taskType === "command"
        ? { command: command.trim() }
        : { path: command.trim() };

      const res = await fetch(`${BRIDGE_URL}/api/computers/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: taskType, payload, timeout: 30000 }),
      });
      const data = await res.json();
      const os = data.computerOs ? ` (${data.computerOs})` : "";
      setResult(`[${data.computerName}${os}] ${data.result || data.error || JSON.stringify(data)}`);
      setCommand("");
    } catch (err) {
      setResult(`Error: ${err}`);
    }
    setExecuting(false);
  };

  const removeComputer = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/computers/${id}`, { method: "DELETE" });
    fetchComputers();
    if (selected?.id === id) setSelected(null);
  };

  const online = computers.filter(c => c.status === "online").length;

  if (selected) {
    return (
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelected(null); setResult(null); }} className="text-slate-400 hover:text-white text-sm">&larr; Tillbaka</button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[selected.status]} ${selected.status === "busy" ? "animate-pulse" : ""}`} />
              <span className="text-sm font-semibold text-white">{selected.name}</span>
              <span className="text-[10px] text-slate-500">{selected.status}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-slate-500">OS:</span> <span className="text-slate-300">{OS_ICONS[selected.capabilities.os]} {selected.capabilities.os} ({selected.capabilities.arch})</span></div>
            <div><span className="text-slate-500">CPU:</span> <span className="text-slate-300">{selected.capabilities.cpuCores} kärnor</span></div>
            <div><span className="text-slate-500">RAM:</span> <span className="text-slate-300">{selected.capabilities.ramGb} GB</span></div>
            <div><span className="text-slate-500">GPU:</span> <span className="text-slate-300">{selected.capabilities.hasGpu ? selected.capabilities.gpuName || "Ja" : "Nej"}</span></div>
            <div><span className="text-slate-500">Host:</span> <span className="text-slate-300">{selected.capabilities.hostname}</span></div>
            <div><span className="text-slate-500">User:</span> <span className="text-slate-300">{selected.capabilities.username}</span></div>
            <div><span className="text-slate-500">Tasks:</span> <span className="text-slate-300">{selected.taskCount} ({selected.errorCount} fel)</span></div>
            <div><span className="text-slate-500">Latens:</span> <span className="text-slate-300">{selected.avgLatencyMs > 0 ? `${(selected.avgLatencyMs / 1000).toFixed(1)}s` : "—"}</span></div>
          </div>
          {selected.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selected.tags.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>
              ))}
            </div>
          )}
          <div className="flex gap-1 flex-wrap">
            {selected.capabilities.tools.map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300">{t}</span>
            ))}
          </div>
        </div>

        {/* Execute */}
        {selected.status === "online" && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={taskType}
                onChange={e => setTaskType(e.target.value)}
                title="Välj uppgiftstyp"
                className="text-[11px] bg-slate-800 text-slate-300 border border-slate-700 rounded-lg px-2 py-1"
              >
                <option value="command">Kommando</option>
                <option value="file_read">Läs fil</option>
                <option value="screenshot">Screenshot</option>
                <option value="system_info">Systeminfo</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") executeTask(); }}
                placeholder={taskType === "command" ? "dir C:\\" : taskType === "file_read" ? "C:\\path\\to\\file.txt" : "Kör..."}
                className="flex-1 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 font-mono"
              />
              <button
                onClick={executeTask}
                disabled={executing || !command.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {executing ? "..." : "Kör"}
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 max-h-60 overflow-y-auto">
            <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap break-all">{result}</pre>
          </div>
        )}

        {/* Task History */}
        {tasks.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senaste uppgifter</h3>
            <div className="space-y-1">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                  <span className={`text-[10px] ${t.status === "completed" ? "text-green-400" : t.status === "failed" ? "text-red-400" : "text-amber-400"}`}>
                    {t.status === "completed" ? "✓" : t.status === "failed" ? "✗" : "⏳"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex-1 truncate">{t.type}: {JSON.stringify(t.payload).slice(0, 60)}</span>
                  <span className="text-[10px] text-slate-600">{formatTime(t.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Datorer</h2>
          <p className="text-[10px] text-slate-500">{online} online av {computers.length} registrerade</p>
        </div>
        <button onClick={fetchComputers} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Uppdatera">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {computers.length === 0 ? (
        <div className="text-center py-12">
          <Monitor className="w-12 h-12 text-slate-600 mx-auto mb-3 empty-icon" />
          <p className="text-sm text-slate-400 mb-2">Inga datorer registrerade</p>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Kör <code className="text-blue-400 bg-slate-800 px-1 rounded">npm run agent</code> på varje dator du vill ansluta
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {computers.map(comp => (
            <button
              key={comp.id}
              onClick={() => setSelected(comp)}
              className="w-full text-left bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 card-hover stagger-item"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[comp.status]} ${comp.status === "busy" ? "animate-pulse" : ""}`} />
                  <span className="text-sm font-medium text-white">{comp.name}</span>
                  <span className="text-[10px] text-slate-500">{OS_ICONS[comp.capabilities.os]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {comp.taskCount > 0 && (
                    <span className="text-[10px] text-slate-500">{comp.taskCount} tasks</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeComputer(comp.id); }}
                    className="p-0.5 rounded hover:bg-slate-700/50 transition-colors"
                    title="Ta bort dator"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-600 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span>{comp.capabilities.cpuCores} CPU</span>
                <span>{comp.capabilities.ramGb}GB RAM</span>
                {comp.capabilities.hasGpu && <span>GPU</span>}
                <span className="ml-auto">Sedd {formatDate(comp.lastSeen)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Auto-route */}
      {online > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400">Smart routing</h3>
          <p className="text-[10px] text-slate-500">Skicka en uppgift — AI väljer bästa dator automatiskt</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") autoRoute(); }}
              placeholder="Kommando att köra..."
              className="flex-1 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 font-mono"
            />
            <button
              onClick={autoRoute}
              disabled={executing || !command.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {executing ? "..." : "Auto"}
            </button>
          </div>
          {result && (
            <pre className="text-xs text-green-300 font-mono bg-slate-900 rounded-lg p-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-all">{result}</pre>
          )}
        </div>
      )}
    </div>
  );
}
