import { useState, useEffect, useCallback } from "react";
import { BRIDGE_URL } from "../config";
import {
  History, Plus, RotateCcw, Trash2, RefreshCw, Archive,
  Clock, HardDrive, GitCompare, Shield, Tag,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface Snapshot {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  fileCount: number;
  totalSizeBytes: number;
  auto: boolean;
  tags: string[];
}

interface SnapshotStats {
  total: number;
  totalSizeBytes: number;
  oldestDate: string;
  newestDate: string;
  autoCount: number;
}

interface SnapshotDiff {
  file: string;
  status: "added" | "removed" | "modified" | "unchanged";
  sizeA?: number;
  sizeB?: number;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE") + " " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

const DIFF_COLORS: Record<string, string> = {
  added: "text-green-400",
  removed: "text-red-400",
  modified: "text-yellow-400",
  unchanged: "text-slate-500",
};

// ─── Component ───────────────────────────────────────────────

export default function SnapshotsView() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [stats, setStats] = useState<SnapshotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTags, setFormTags] = useState("");
  const [diffResult, setDiffResult] = useState<{ idA: string; idB: string; diffs: SnapshotDiff[] } | null>(null);
  const [diffA, setDiffA] = useState<string>("");
  const [diffB, setDiffB] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [snapRes, statsRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/snapshots`),
        fetch(`${BRIDGE_URL}/api/snapshots/stats`),
      ]);
      if (snapRes.ok) setSnapshots(await snapRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!formName) return;
    setCreating(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setFormName("");
        setFormDesc("");
        setFormTags("");
        await fetchData();
      }
    } catch { /* ignore */ }
    finally { setCreating(false); }
  };

  const handleRestore = async (id: string) => {
    if (!confirm("Vill du återställa till denna snapshot? Nuvarande tillstånd sparas automatiskt först.")) return;
    setRestoring(id);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/snapshots/${id}/restore`, { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        alert(`Återställt ${result.restored.length} filer.${result.skipped.length > 0 ? ` Hoppade över: ${result.skipped.join(", ")}` : ""}`);
        await fetchData();
      }
    } catch { /* ignore */ }
    finally { setRestoring(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ta bort snapshot?")) return;
    await fetch(`${BRIDGE_URL}/api/snapshots/${id}`, { method: "DELETE" });
    await fetchData();
  };

  const handleDiff = async () => {
    if (!diffA || !diffB || diffA === diffB) return;
    try {
      const res = await fetch(`${BRIDGE_URL}/api/snapshots/diff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idA: diffA, idB: diffB }),
      });
      if (res.ok) {
        setDiffResult({ idA: diffA, idB: diffB, diffs: await res.json() });
      }
    } catch { /* ignore */ }
  };

  if (loading && snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Snapshots & Rollback</h2>
          <span className="text-xs text-slate-500">Version control för AI-tillstånd</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-1.5 rounded bg-slate-700 hover:bg-slate-600"
            title="Uppdatera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Ny snapshot
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Archive className="w-4 h-4" />} label="Snapshots" value={stats.total.toString()} color="text-amber-400" />
          <StatCard icon={<HardDrive className="w-4 h-4" />} label="Total storlek" value={formatBytes(stats.totalSizeBytes)} color="text-blue-400" />
          <StatCard icon={<Shield className="w-4 h-4" />} label="Auto-sparade" value={stats.autoCount.toString()} color="text-green-400" />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Äldsta" value={stats.oldestDate ? formatDate(stats.oldestDate).split(" ")[0] : "-"} color="text-slate-400" />
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-slate-800/50 border border-amber-500/30 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium">Skapa snapshot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Namn</label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="t.ex. Före stor ändring"
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Taggar (kommaseparerade)</label>
              <input
                value={formTags}
                onChange={e => setFormTags(e.target.value)}
                placeholder="backup, milestone"
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Beskrivning (valfritt)</label>
            <input
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Varför skapar du denna snapshot?"
              className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded">Avbryt</button>
            <button
              onClick={handleCreate}
              disabled={!formName || creating}
              className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 rounded disabled:opacity-40 flex items-center gap-1"
            >
              {creating && <RefreshCw className="w-3 h-3 animate-spin" />}
              Spara snapshot
            </button>
          </div>
        </div>
      )}

      {/* Diff tool */}
      {snapshots.length >= 2 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <h3 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
            <GitCompare className="w-3.5 h-3.5" /> Jämför snapshots
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={diffA}
              onChange={e => setDiffA(e.target.value)}
              className="bg-slate-700 text-xs rounded px-2 py-1.5 border border-slate-600 flex-1 min-w-[120px]"
              title="Snapshot A"
            >
              <option value="">Snapshot A...</option>
              {snapshots.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({formatDate(s.createdAt).split(" ")[0]})</option>
              ))}
            </select>
            <span className="text-slate-500 text-xs">vs</span>
            <select
              value={diffB}
              onChange={e => setDiffB(e.target.value)}
              className="bg-slate-700 text-xs rounded px-2 py-1.5 border border-slate-600 flex-1 min-w-[120px]"
              title="Snapshot B"
            >
              <option value="">Snapshot B...</option>
              {snapshots.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({formatDate(s.createdAt).split(" ")[0]})</option>
              ))}
            </select>
            <button
              onClick={handleDiff}
              disabled={!diffA || !diffB || diffA === diffB}
              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-xs disabled:opacity-40"
            >
              Jämför
            </button>
          </div>
          {diffResult && (
            <div className="mt-3 space-y-1">
              {diffResult.diffs.map(d => (
                <div key={d.file} className={`text-xs flex items-center gap-2 ${DIFF_COLORS[d.status]}`}>
                  <span className="w-16 text-right font-mono">{d.status}</span>
                  <span className="font-mono">{d.file}</span>
                  {d.sizeA !== undefined && d.sizeB !== undefined && d.status === "modified" && (
                    <span className="text-slate-500">({formatBytes(d.sizeA)} → {formatBytes(d.sizeB)})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Snapshot list */}
      {snapshots.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Inga snapshots ännu. Skapa en för att börja spåra AI-tillstånd.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map(snap => (
            <div
              key={snap.id}
              className={`bg-slate-800/50 border rounded-lg p-3 ${snap.auto ? "border-slate-700/50" : "border-slate-700"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className={`w-4 h-4 ${snap.auto ? "text-slate-500" : "text-amber-400"}`} />
                  <span className="font-medium text-sm">{snap.name}</span>
                  {snap.auto && <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">auto</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(snap.id)}
                    disabled={restoring === snap.id}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-600/80 hover:bg-amber-500 rounded text-xs disabled:opacity-40"
                    title="Återställ"
                  >
                    {restoring === snap.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Återställ
                  </button>
                  <button
                    onClick={() => handleDelete(snap.id)}
                    className="p-1 hover:text-red-400 text-slate-500"
                    title="Ta bort"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(snap.createdAt)}
                </span>
                <span>{snap.fileCount} filer</span>
                <span>{formatBytes(snap.totalSizeBytes)}</span>
              </div>
              {snap.description && <p className="text-xs text-slate-400 mt-1">{snap.description}</p>}
              {snap.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {snap.tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-300">
                      <Tag className="w-2.5 h-2.5" /> {tag}
                    </span>
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

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
      <div className={`flex items-center gap-1.5 text-xs ${color} mb-1`}>{icon}{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
