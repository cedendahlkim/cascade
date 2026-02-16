/**
 * GitView — Git integration UI
 * Status, diff, log, branches, AI commit messages, stage/unstage/commit/push
 */
import { useState, useEffect, useCallback } from "react";
import {
  GitBranch, GitCommit, GitPullRequest, RefreshCw, Plus, Minus, Check,
  ChevronDown, ChevronUp, Upload, Download, Sparkles, Trash2, Eye,
  AlertCircle, FileText, ArrowUpRight, ArrowDownLeft, RotateCcw,
} from "lucide-react";
import { BRIDGE_URL } from "../config";

interface GitFile {
  path: string;
  status: string;
  state: string;
  staged: boolean;
}

interface GitStatus {
  branch: string;
  files: GitFile[];
  clean: boolean;
  ahead: number;
  behind: number;
  remote: string | null;
}

interface Commit {
  hash: string;
  short: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

interface Branch {
  name: string;
  hash: string;
  date: string;
  message: string;
  current: boolean;
  remote: boolean;
}

const STATE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  modified: { bg: "bg-amber-500/10", text: "text-amber-400", label: "M" },
  added: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "A" },
  deleted: { bg: "bg-red-500/10", text: "text-red-400", label: "D" },
  renamed: { bg: "bg-blue-500/10", text: "text-blue-400", label: "R" },
  untracked: { bg: "bg-slate-500/10", text: "text-slate-400", label: "?" },
};

export default function GitView() {
  const [tab, setTab] = useState<"status" | "log" | "branches">("status");
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [branches, setBranches] = useState<{ current: string; branches: Branch[] }>({ current: "", branches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commitMsg, setCommitMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [diffView, setDiffView] = useState<{ file: string; diff: string } | null>(null);
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(`${BRIDGE_URL}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...opts?.headers },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await api("/api/git/status");
      setStatus(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);

  const fetchLog = useCallback(async () => {
    try {
      const data = await api("/api/git/log?count=50");
      setCommits(data.commits);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);

  const fetchBranches = useCallback(async () => {
    try {
      const data = await api("/api/git/branches");
      setBranches(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchLog(), fetchBranches()]);
    setLoading(false);
  }, [fetchStatus, fetchLog, fetchBranches]);

  useEffect(() => { refresh(); }, [refresh]);

  const stageFiles = async (files?: string[]) => {
    setActionLoading("stage");
    try {
      await api("/api/git/stage", { method: "POST", body: JSON.stringify({ files }) });
      await fetchStatus();
    } catch (e) { setError((e as Error).message); }
    setActionLoading(null);
  };

  const unstageFiles = async (files?: string[]) => {
    setActionLoading("unstage");
    try {
      await api("/api/git/unstage", { method: "POST", body: JSON.stringify({ files }) });
      await fetchStatus();
    } catch (e) { setError((e as Error).message); }
    setActionLoading(null);
  };

  const discardFiles = async (files: string[]) => {
    if (!confirm(`Återställ ${files.length} fil(er)? Ändringar förloras.`)) return;
    setActionLoading("discard");
    try {
      await api("/api/git/discard", { method: "POST", body: JSON.stringify({ files }) });
      await fetchStatus();
    } catch (e) { setError((e as Error).message); }
    setActionLoading(null);
  };

  const doCommit = async () => {
    if (!commitMsg.trim()) return;
    setActionLoading("commit");
    try {
      await api("/api/git/commit", { method: "POST", body: JSON.stringify({ message: commitMsg }) });
      setCommitMsg("");
      await refresh();
    } catch (e) { setError((e as Error).message); }
    setActionLoading(null);
  };

  const doPush = async () => {
    setActionLoading("push");
    try {
      await api("/api/git/push", { method: "POST" });
      await fetchStatus();
    } catch (e) { setError((e as Error).message); }
    setActionLoading(null);
  };

  const doPull = async () => {
    setActionLoading("pull");
    try {
      await api("/api/git/pull", { method: "POST" });
      await refresh();
    } catch (e) { setError((e as Error).message); }
    setActionLoading(null);
  };

  const doCheckout = async (branch: string) => {
    setActionLoading("checkout");
    try {
      await api("/api/git/checkout", { method: "POST", body: JSON.stringify({ branch }) });
      await refresh();
    } catch (e) { setError((e as Error).message); }
    setActionLoading(null);
  };

  const generateAiMessage = async () => {
    setAiLoading(true);
    setError(null);
    try {
      const data = await api("/api/git/ai-commit-message", { method: "POST" });
      setCommitMsg(data.message);
    } catch (e) { setError((e as Error).message); }
    setAiLoading(false);
  };

  const viewDiff = async (file: string) => {
    try {
      const data = await api(`/api/git/diff/${encodeURIComponent(file)}`);
      setDiffView({ file, diff: data.diff || "(ingen diff)" });
    } catch (e) { setError((e as Error).message); }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `${mins}m sedan`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h sedan`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d sedan`;
      return d.toLocaleDateString("sv-SE");
    } catch { return iso; }
  };

  const stagedFiles = status?.files.filter(f => f.staged) || [];
  const unstagedFiles = status?.files.filter(f => !f.staged) || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 shrink-0">
        {[
          { id: "status" as const, label: "Status", icon: GitBranch },
          { id: "log" as const, label: "Historik", icon: GitCommit },
          { id: "branches" as const, label: "Branches", icon: GitPullRequest },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                tab === t.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={refresh}
          disabled={loading}
          title="Uppdatera"
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mt-1 flex items-center gap-2 p-2.5 bg-red-950/40 border border-red-800/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-300 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
        </div>
      )}

      {/* Diff modal */}
      {diffView && (
        <div className="mx-3 mt-1 bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
            <span className="text-xs font-medium text-white">{diffView.file}</span>
            <button onClick={() => setDiffView(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
          </div>
          <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-auto max-h-64 leading-relaxed">
            {diffView.diff.split("\n").map((line, i) => {
              let cls = "text-slate-400";
              if (line.startsWith("+") && !line.startsWith("+++")) cls = "text-emerald-400";
              else if (line.startsWith("-") && !line.startsWith("---")) cls = "text-red-400";
              else if (line.startsWith("@@")) cls = "text-blue-400";
              return <div key={i} className={cls}>{line || " "}</div>;
            })}
          </pre>
        </div>
      )}

      <div className="flex-1 overflow-y-auto chat-scroll p-3 space-y-3">
        {/* ─── STATUS TAB ─── */}
        {tab === "status" && status && (
          <>
            {/* Branch info bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-950/40 border border-indigo-700/40 rounded-lg">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-300">{status.branch}</span>
              </div>
              {status.ahead > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-950/30 border border-emerald-800/30 rounded-lg">
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">{status.ahead} ahead</span>
                </div>
              )}
              {status.behind > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-950/30 border border-amber-800/30 rounded-lg">
                  <ArrowDownLeft className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-400">{status.behind} behind</span>
                </div>
              )}
              <div className="flex-1" />
              {/* Push / Pull */}
              <button
                onClick={doPull}
                disabled={!!actionLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-[11px] text-slate-300 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-40"
              >
                <Download className="w-3 h-3" /> Pull
              </button>
              <button
                onClick={doPush}
                disabled={!!actionLoading || status.ahead === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-[11px] text-indigo-300 hover:text-white hover:bg-indigo-600/30 transition-colors disabled:opacity-40"
              >
                <Upload className="w-3 h-3" /> Push
              </button>
            </div>

            {status.clean ? (
              <div className="text-center py-8">
                <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-emerald-300 font-medium">Working tree clean</p>
                <p className="text-xs text-slate-500 mt-1">Inga ändrade filer</p>
              </div>
            ) : (
              <>
                {/* Staged files */}
                {stagedFiles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                        Staged ({stagedFiles.length})
                      </span>
                      <button
                        onClick={() => unstageFiles()}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        Unstage alla
                      </button>
                    </div>
                    <div className="space-y-1">
                      {stagedFiles.map(f => {
                        const cfg = STATE_COLORS[f.state] || STATE_COLORS.modified;
                        return (
                          <div key={f.path} className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-950/20 border border-emerald-800/20 rounded-lg group">
                            <span className={`text-[10px] font-mono font-bold ${cfg.text} w-4 text-center`}>{cfg.label}</span>
                            <span className="text-xs text-slate-300 flex-1 truncate font-mono">{f.path}</span>
                            <button onClick={() => viewDiff(f.path)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white" title="Visa diff">
                              <Eye className="w-3 h-3" />
                            </button>
                            <button onClick={() => unstageFiles([f.path])} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-amber-400" title="Unstage">
                              <Minus className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unstaged files */}
                {unstagedFiles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Ej staged ({unstagedFiles.length})
                      </span>
                      <button
                        onClick={() => stageFiles()}
                        className="text-[10px] text-slate-500 hover:text-emerald-400"
                      >
                        Stage alla
                      </button>
                    </div>
                    <div className="space-y-1">
                      {unstagedFiles.map(f => {
                        const cfg = STATE_COLORS[f.state] || STATE_COLORS.modified;
                        return (
                          <div key={f.path} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/30 border border-slate-700/30 rounded-lg group">
                            <span className={`text-[10px] font-mono font-bold ${cfg.text} w-4 text-center`}>{cfg.label}</span>
                            <span className="text-xs text-slate-300 flex-1 truncate font-mono">{f.path}</span>
                            <button onClick={() => viewDiff(f.path)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-white" title="Visa diff">
                              <Eye className="w-3 h-3" />
                            </button>
                            <button onClick={() => stageFiles([f.path])} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-emerald-400" title="Stage">
                              <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={() => discardFiles([f.path])} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400" title="Återställ">
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Commit box */}
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-white">Commit</span>
                    <div className="flex-1" />
                    <button
                      onClick={generateAiMessage}
                      disabled={aiLoading}
                      className="flex items-center gap-1 px-2 py-1 bg-violet-600/20 border border-violet-500/30 rounded-lg text-[10px] text-violet-300 hover:text-white hover:bg-violet-600/30 transition-colors disabled:opacity-40"
                    >
                      <Sparkles className={`w-3 h-3 ${aiLoading ? "animate-spin" : ""}`} />
                      {aiLoading ? "Genererar..." : "AI Message"}
                    </button>
                  </div>
                  <textarea
                    value={commitMsg}
                    onChange={e => setCommitMsg(e.target.value)}
                    placeholder="Commit message..."
                    rows={3}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none font-mono"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {stagedFiles.length} staged fil{stagedFiles.length !== 1 ? "er" : ""}
                    </span>
                    <button
                      onClick={doCommit}
                      disabled={!commitMsg.trim() || stagedFiles.length === 0 || !!actionLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600/20 border border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-300 hover:text-white hover:bg-emerald-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Commit
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ─── LOG TAB ─── */}
        {tab === "log" && (
          <div className="space-y-1">
            {commits.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">Ingen historik</div>
            ) : (
              commits.map(c => (
                <div key={c.hash} className="group">
                  <button
                    onClick={() => setExpandedCommit(expandedCommit === c.hash ? null : c.hash)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-800/30 border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-colors text-left"
                  >
                    <span className="text-[10px] font-mono text-indigo-400 shrink-0">{c.short}</span>
                    <span className="text-xs text-slate-200 flex-1 truncate">{c.message}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">{formatDate(c.date)}</span>
                    {expandedCommit === c.hash ? (
                      <ChevronUp className="w-3 h-3 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                    )}
                  </button>
                  {expandedCommit === c.hash && (
                    <div className="ml-6 mt-1 mb-2 p-2.5 bg-slate-900/60 border border-slate-700/30 rounded-lg space-y-1">
                      <div className="text-[10px] text-slate-400">
                        <span className="text-slate-500">Hash:</span> <span className="font-mono text-slate-300">{c.hash}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        <span className="text-slate-500">Författare:</span> {c.author} &lt;{c.email}&gt;
                      </div>
                      <div className="text-[10px] text-slate-400">
                        <span className="text-slate-500">Datum:</span> {new Date(c.date).toLocaleString("sv-SE")}
                      </div>
                      <div className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{c.message}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── BRANCHES TAB ─── */}
        {tab === "branches" && (
          <div className="space-y-2">
            {/* Local branches */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lokala</span>
              <div className="mt-1.5 space-y-1">
                {branches.branches.filter(b => !b.remote).map(b => (
                  <div
                    key={b.name}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors ${
                      b.current
                        ? "bg-indigo-950/30 border-indigo-700/40"
                        : "bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50"
                    }`}
                  >
                    <GitBranch className={`w-3.5 h-3.5 ${b.current ? "text-indigo-400" : "text-slate-500"}`} />
                    <span className={`text-xs font-medium flex-1 ${b.current ? "text-indigo-300" : "text-slate-300"}`}>
                      {b.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{b.hash}</span>
                    {b.current && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-indigo-300">
                        aktuell
                      </span>
                    )}
                    {!b.current && (
                      <button
                        onClick={() => doCheckout(b.name)}
                        disabled={!!actionLoading}
                        className="text-[10px] px-2 py-0.5 bg-slate-700/50 border border-slate-600/50 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40"
                      >
                        Checkout
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Remote branches */}
            {branches.branches.filter(b => b.remote).length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Remote</span>
                <div className="mt-1.5 space-y-1">
                  {branches.branches.filter(b => b.remote).map(b => (
                    <div
                      key={b.name}
                      className="flex items-center gap-2.5 px-3 py-2 bg-slate-800/20 border border-slate-700/20 rounded-lg"
                    >
                      <GitBranch className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-xs text-slate-500 flex-1 font-mono">{b.name}</span>
                      <span className="text-[10px] font-mono text-slate-600">{b.hash}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {loading && !status && (
          <div className="text-center py-8 text-sm text-slate-500">Laddar git-status...</div>
        )}
      </div>
    </div>
  );
}
