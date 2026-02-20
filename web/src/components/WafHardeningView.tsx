import { useCallback, useEffect, useMemo, useState } from "react";
import { BRIDGE_URL } from "../config";
import { Shield, Play, Square, RefreshCw, Activity, AlertTriangle, Brain, Trash2 } from "lucide-react";

interface WafProfile {
  name: string;
  paranoia: string;
}

interface WafProfilesResponse {
  profiles: WafProfile[];
}

interface WafStatusResponse {
  success?: boolean;
  result?: string;
  error?: string;
}

interface WafRecentRun {
  run_id: string;
  status: string;
  started_at: number;
  return_code: number | null;
}

interface WafRecentRunsResponse {
  runs: WafRecentRun[];
}

interface WafRunResult {
  id: string;
  passed: boolean;
  status_code?: number;
  actual_decision?: string;
  expected_decision?: string;
  error?: string;
}

interface WafRunResultsResponse {
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  by_category: Record<string, { passed: number; failed: number }>;
  tests: WafRunResult[];
  status?: string;
  run_id?: string;
  started_at?: number;
  running_seconds?: number;
  stale?: boolean;
  message?: string;
}

interface WafRunStartResponse {
  status: string;
  run_id: string | null;
  final_url?: string;
  concurrency?: number;
}

interface WafAiChatResponse {
  response?: string;
  usage?: Record<string, unknown>;
  error?: string;
}

type ToastLevel = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  level: ToastLevel;
  text: string;
}

const AUTO_REFRESH_INTERVAL_MS = 5000;
const TOAST_DURATION_MS = 4500;
const RUN_STUCK_THRESHOLD_SECONDS = 15 * 60;
const RUN_ESTIMATED_DURATION_SECONDS = 3 * 60;

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  if (minutes <= 0) {
    return `${remaining}s`;
  }
  return `${minutes}m ${remaining}s`;
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidate = record.error || record.message || record.detail;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }
  return fallback;
}

async function bridgeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BRIDGE_URL}${path}`, init);
  const data = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, `HTTP ${response.status}`));
  }
  return data as T;
}

export default function WafHardeningView() {
  const [profiles, setProfiles] = useState<WafProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("pl1");
  const [targetBaseUrl, setTargetBaseUrl] = useState("http://localhost:18080");
  const [tags, setTags] = useState("");
  const [excludeTags, setExcludeTags] = useState("");
  const [ids, setIds] = useState("");
  const [concurrency, setConcurrency] = useState(1);

  const [statusText, setStatusText] = useState("Ingen status ännu");
  const [statusOk, setStatusOk] = useState<boolean | null>(null);
  const [recentRuns, setRecentRuns] = useState<WafRecentRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<WafRunResultsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [busyStart, setBusyStart] = useState(false);
  const [busyStop, setBusyStop] = useState(false);
  const [busyRun, setBusyRun] = useState(false);
  const [busyRefresh, setBusyRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const [aiMessage, setAiMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiUsage, setAiUsage] = useState<Record<string, unknown> | null>(null);
  const [busyAi, setBusyAi] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const selectedRun = useMemo(
    () => recentRuns.find((run) => run.run_id === selectedRunId) || null,
    [recentRuns, selectedRunId],
  );

  const runningCount = useMemo(
    () => recentRuns.filter((run) => run.status === "running").length,
    [recentRuns],
  );
  const failedCount = useMemo(
    () => recentRuns.filter((run) => run.status !== "running" && run.return_code !== 0).length,
    [recentRuns],
  );

  const selectedRunIsActive = selectedRun?.status === "running";
  const selectedRunRunningSeconds = useMemo(() => {
    if (!selectedRun) return 0;
    if (typeof runResults?.running_seconds === "number") {
      return Math.max(0, Math.floor(runResults.running_seconds));
    }
    if (!selectedRunIsActive) return 0;
    return Math.max(0, Math.floor(nowMs / 1000 - selectedRun.started_at));
  }, [nowMs, runResults?.running_seconds, selectedRun, selectedRunIsActive]);

  const selectedRunProgressPercent = useMemo(() => {
    if (!selectedRunIsActive) return 0;
    const ratio = selectedRunRunningSeconds / RUN_ESTIMATED_DURATION_SECONDS;
    return Math.max(6, Math.min(95, Math.round(ratio * 100)));
  }, [selectedRunIsActive, selectedRunRunningSeconds]);

  const selectedRunEtaSeconds = useMemo(
    () => Math.max(0, RUN_ESTIMATED_DURATION_SECONDS - selectedRunRunningSeconds),
    [selectedRunRunningSeconds],
  );

  const selectedRunLooksStuck = useMemo(
    () => Boolean(runResults?.stale) || (selectedRunIsActive && selectedRunRunningSeconds >= RUN_STUCK_THRESHOLD_SECONDS),
    [runResults?.stale, selectedRunIsActive, selectedRunRunningSeconds],
  );

  const isSelectedRunRunning = selectedRunIsActive || runResults?.status === "running" || runResults?.status === "stalled";
  const hasActiveMutation = busyStart || busyStop || busyRun || busyAi;
  const disableMutatingControls = loading || busyRefresh || hasActiveMutation;

  const pushToast = useCallback((level: ToastLevel, text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, level, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const reportError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(message);
    pushToast("error", message);
  }, [pushToast]);

  const refreshProfiles = useCallback(async () => {
    const data = await bridgeRequest<WafProfilesResponse>("/api/waf/profiles");
    const list = data.profiles || [];
    setProfiles(list);
    if (list.length > 0 && !list.some((p) => p.name === selectedProfile)) {
      setSelectedProfile(list[0].name);
    }
  }, [selectedProfile]);

  const refreshStatus = useCallback(async () => {
    const encodedBaseUrl = encodeURIComponent(targetBaseUrl.trim() || "http://localhost:18080");
    const data = await bridgeRequest<WafStatusResponse>(`/api/waf/status?base_url=${encodedBaseUrl}`);
    if (data.success) {
      setStatusOk(true);
      setStatusText(data.result || "WAF svarar");
    } else {
      setStatusOk(false);
      setStatusText(data.error || "WAF svarar inte");
    }
  }, [targetBaseUrl]);

  const refreshRecentRuns = useCallback(async () => {
    const data = await bridgeRequest<WafRecentRunsResponse>("/api/waf/recent-runs");
    const runs = data.runs || [];
    setRecentRuns(runs);
    if (runs.length === 0) {
      setSelectedRunId(null);
      return;
    }

    if (!selectedRunId || !runs.some((run) => run.run_id === selectedRunId)) {
      setSelectedRunId(runs[0].run_id);
    }
  }, [selectedRunId]);

  const refreshRunResults = useCallback(async (runId: string) => {
    const data = await bridgeRequest<WafRunResultsResponse>(`/api/waf/run/${encodeURIComponent(runId)}/results`);
    setRunResults(data);
  }, []);

  const refreshAll = useCallback(async () => {
    setBusyRefresh(true);
    setError(null);
    try {
      await Promise.all([refreshProfiles(), refreshStatus(), refreshRecentRuns()]);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      reportError(err);
    } finally {
      setLoading(false);
      setBusyRefresh(false);
    }
  }, [refreshProfiles, refreshRecentRuns, refreshStatus, reportError]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!autoRefresh || runningCount === 0) return;

    const timer = window.setInterval(() => {
      void refreshAll();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [autoRefresh, refreshAll, runningCount]);

  useEffect(() => {
    if (!selectedRunId) {
      setRunResults(null);
      return;
    }

    void refreshRunResults(selectedRunId).catch((err) => {
      reportError(err);
      setRunResults(null);
    });

    if (!selectedRunIsActive) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshRunResults(selectedRunId).catch((err) => {
        reportError(err);
      });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [refreshRunResults, reportError, selectedRunId, selectedRunIsActive]);

  useEffect(() => {
    if (runningCount === 0) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [runningCount]);

  const startWaf = async () => {
    setBusyStart(true);
    setError(null);
    try {
      await bridgeRequest("/api/waf/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: selectedProfile }),
      });
      await refreshStatus();
      pushToast("success", `WAF startad med profil ${selectedProfile}.`);
    } catch (err) {
      reportError(err);
    } finally {
      setBusyStart(false);
    }
  };

  const stopWaf = async () => {
    setBusyStop(true);
    setError(null);
    try {
      await bridgeRequest("/api/waf/stop", { method: "POST" });
      await refreshStatus();
      pushToast("info", "WAF stoppad.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusyStop(false);
    }
  };

  const runTests = async () => {
    setBusyRun(true);
    setError(null);
    try {
      const payload = {
        base_url: targetBaseUrl.trim() || "http://localhost:18080",
        tags: tags.trim(),
        exclude_tags: excludeTags.trim(),
        ids: ids.trim(),
        concurrency,
      };
      const data = await bridgeRequest<WafRunStartResponse>("/api/waf/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await refreshRecentRuns();
      if (data.run_id) {
        setSelectedRunId(data.run_id);
        pushToast("success", `Testkörning startad (${data.run_id}).`);
      } else {
        pushToast("success", "Testkörning startad.");
      }
    } catch (err) {
      reportError(err);
    } finally {
      setBusyRun(false);
    }
  };

  const passRate = useMemo(() => {
    if (!runResults || runResults.total <= 0) return 0;
    return Math.round((runResults.passed / runResults.total) * 100);
  }, [runResults]);

  const applyTestPreset = (preset: "sqli" | "xss" | "smoke") => {
    if (preset === "sqli") {
      setTags("sqli");
      setExcludeTags("");
      setIds("");
      setConcurrency(2);
      return;
    }

    if (preset === "xss") {
      setTags("xss");
      setExcludeTags("");
      setIds("");
      setConcurrency(2);
      return;
    }

    setTags("owasp-a01,owasp-a03,owasp-a05");
    setExcludeTags("");
    setIds("");
    setConcurrency(3);
  };

  const runAiCommand = async (overrideMessage?: string) => {
    const message = (overrideMessage ?? aiMessage).trim();
    if (!message) return;

    setBusyAi(true);
    setError(null);

    try {
      const data = await bridgeRequest<WafAiChatResponse>("/api/waf/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      setAiResponse((data.response || data.error || "Inget svar").trim());
      setAiUsage(data.usage || null);
      if (!overrideMessage) {
        setAiMessage("");
      }
      await refreshAll();
      pushToast("info", "AI-kommando utfört.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusyAi(false);
    }
  };

  const clearAiChat = async () => {
    setBusyAi(true);
    setError(null);

    try {
      await bridgeRequest("/api/waf/ai/clear", { method: "POST" });
      setAiResponse("");
      setAiUsage(null);
      pushToast("info", "AI-kontext rensad.");
    } catch (err) {
      reportError(err);
    } finally {
      setBusyAi(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">WAF Hardening</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((value) => !value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs border ${autoRefresh ? "bg-emerald-900/30 border-emerald-700/60 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-300"}`}
          >
            Auto {autoRefresh ? "på" : "av"}
          </button>
          <button
            onClick={refreshAll}
            disabled={busyRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busyRefresh ? "animate-spin" : ""}`} />
            Uppdatera
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 -mt-2">
        {lastUpdatedAt ? `Senast uppdaterad: ${new Date(lastUpdatedAt).toLocaleTimeString("sv-SE")}` : "Ingen uppdatering ännu"}
      </div>

      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-30 space-y-2 w-[320px] max-w-[90vw]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`text-xs rounded-lg border px-3 py-2 shadow-lg ${toast.level === "success"
                ? "bg-emerald-900/90 border-emerald-700 text-emerald-100"
                : toast.level === "error"
                  ? "bg-rose-900/90 border-rose-700 text-rose-100"
                  : "bg-slate-900/95 border-slate-700 text-slate-200"
                }`}
            >
              {toast.text}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-300 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Activity className="w-4 h-4 text-emerald-400" />
          WAF-kontroll
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Profil</label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              disabled={disableMutatingControls}
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-2.5 py-2 text-sm"
              title="WAF-profil"
            >
              {profiles.map((p) => (
                <option key={p.name} value={p.name}>{p.name} (PL{p.paranoia})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] text-slate-400 block mb-1">Target base URL</label>
            <input
              value={targetBaseUrl}
              onChange={(e) => setTargetBaseUrl(e.target.value)}
              disabled={disableMutatingControls}
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-2.5 py-2 text-sm"
              placeholder="http://localhost:18080"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={startWaf}
            disabled={disableMutatingControls}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-xs text-white disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {busyStart ? "Startar..." : "Starta WAF"}
          </button>
          <button
            onClick={stopWaf}
            disabled={disableMutatingControls}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-xs text-white disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5" />
            {busyStop ? "Stoppar..." : "Stoppa WAF"}
          </button>
          <span className={`text-xs px-2 py-1 rounded-full border ${statusOk ? "text-emerald-300 border-emerald-800/60 bg-emerald-900/20" : statusOk === false ? "text-red-300 border-red-800/60 bg-red-900/20" : "text-slate-300 border-slate-700 bg-slate-800/40"}`}>
            {statusOk ? "Uppe" : statusOk === false ? "Nere" : "Okänd"}
          </span>
          <span className="text-xs px-2 py-1 rounded-full border border-amber-800/50 bg-amber-900/20 text-amber-300">
            Kör: {runningCount}
          </span>
          <span className="text-xs px-2 py-1 rounded-full border border-rose-800/50 bg-rose-900/20 text-rose-300">
            Fail: {failedCount}
          </span>
        </div>

        <pre className="text-[11px] text-slate-300 bg-slate-900/70 border border-slate-700 rounded-lg p-2 whitespace-pre-wrap">
          {statusText}
        </pre>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
        <div className="text-sm font-medium text-slate-200">Kör tester</div>

        <div className="flex flex-wrap gap-2">
          <button disabled={disableMutatingControls} onClick={() => applyTestPreset("sqli")} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200 disabled:opacity-50">SQLi preset</button>
          <button disabled={disableMutatingControls} onClick={() => applyTestPreset("xss")} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200 disabled:opacity-50">XSS preset</button>
          <button disabled={disableMutatingControls} onClick={() => applyTestPreset("smoke")} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200 disabled:opacity-50">OWASP smoke</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={disableMutatingControls}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-2.5 py-2 text-xs"
            placeholder="tags, t.ex: sqli,xss"
          />
          <input
            value={excludeTags}
            onChange={(e) => setExcludeTags(e.target.value)}
            disabled={disableMutatingControls}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-2.5 py-2 text-xs"
            placeholder="exclude_tags, t.ex: legitimate"
          />
          <input
            value={ids}
            onChange={(e) => setIds(e.target.value)}
            disabled={disableMutatingControls}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-2.5 py-2 text-xs"
            placeholder="ids, t.ex: sqli-union"
          />
          <input
            type="number"
            min={1}
            max={64}
            value={concurrency}
            onChange={(e) => setConcurrency(Math.max(1, Math.min(64, Number(e.target.value) || 1)))}
            disabled={disableMutatingControls}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-2.5 py-2 text-xs"
            placeholder="concurrency"
          />
        </div>

        <button
          onClick={runTests}
          disabled={disableMutatingControls}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-medium text-white disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5" />
          {busyRun ? "Startar test..." : "Kör testsvit"}
        </button>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <Brain className="w-4 h-4 text-indigo-300" />
            AI styrning av WAF
          </div>
          <button
            onClick={clearAiChat}
            disabled={busyAi}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200 disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Rensa
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          Exempel: "Starta WAF med pl2", "Kör test med tags sqli,xss", "Visa status för target".
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => void runAiCommand(`Visa status för ${targetBaseUrl}`)} disabled={disableMutatingControls} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200 disabled:opacity-50">Status</button>
          <button onClick={() => void runAiCommand(`Starta WAF med ${selectedProfile}`)} disabled={disableMutatingControls} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200 disabled:opacity-50">Starta</button>
          <button onClick={() => void runAiCommand(`Kör test med tags:sqli,xss concurrency:${concurrency}`)} disabled={disableMutatingControls} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] text-slate-200 disabled:opacity-50">Kör snabbtest</button>
        </div>

        <div className="flex gap-2">
          <input
            value={aiMessage}
            onChange={(e) => setAiMessage(e.target.value)}
            disabled={disableMutatingControls}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void runAiCommand();
              }
            }}
            placeholder="Skriv vad AI ska göra..."
            className="flex-1 bg-slate-900/70 border border-slate-700 rounded-lg px-2.5 py-2 text-xs"
          />
          <button
            onClick={() => { void runAiCommand(); }}
            disabled={disableMutatingControls || !aiMessage.trim()}
            className="px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-xs font-medium text-white disabled:opacity-50"
          >
            {busyAi ? "Kör..." : "Kör via AI"}
          </button>
        </div>

        {aiResponse && (
          <pre className="text-[11px] text-slate-200 bg-slate-900/70 border border-slate-700 rounded-lg p-2 whitespace-pre-wrap">
            {aiResponse}
          </pre>
        )}

        {aiUsage && (
          <div className="text-[10px] text-slate-500">
            Usage: {JSON.stringify(aiUsage)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-sm font-medium text-slate-200 mb-2">Senaste körningar</div>
          {recentRuns.length === 0 ? (
            <div className="text-xs text-slate-500">Inga körningar ännu.</div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {recentRuns.map((run) => (
                <button
                  key={run.run_id}
                  onClick={() => setSelectedRunId(run.run_id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${selectedRunId === run.run_id ? "border-cyan-600 bg-cyan-900/20 text-cyan-200" : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono">{run.run_id}</span>
                    <span className={`px-1.5 py-0.5 rounded ${run.status === "running" ? "bg-amber-900/40 text-amber-300" : run.return_code === 0 ? "bg-emerald-900/40 text-emerald-300" : "bg-rose-900/40 text-rose-300"}`}>
                      {run.status === "running" ? "kör" : run.return_code === 0 ? "ok" : "fail"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(run.started_at * 1000).toLocaleString("sv-SE")}
                    {run.status === "running" ? ` • pågår i ${formatDuration(Math.max(0, Math.floor(nowMs / 1000 - run.started_at)))}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-sm font-medium text-slate-200 mb-2">Resultat</div>
          {isSelectedRunRunning ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {runResults?.message || "Körning pågår. Resultat visas när körningen är klar."}
              </div>
              <div className="text-[11px] text-slate-400">
                Pågår i {formatDuration(selectedRunRunningSeconds)} • ETA ~{formatDuration(selectedRunEtaSeconds)}
              </div>
              <progress
                value={selectedRunProgressPercent}
                max={100}
                className={`w-full h-2 rounded-full overflow-hidden ${selectedRunLooksStuck ? "accent-amber-500" : "accent-cyan-500"}`}
              />
              {selectedRunLooksStuck && (
                <div className="text-[11px] text-amber-200 bg-amber-900/20 border border-amber-800/40 rounded-lg px-2.5 py-2">
                  Körningen har pågått ovanligt länge och kan vara fast. Uppdatera status eller stoppa/starta om WAF.
                  <div className="mt-2">
                    <button
                      onClick={() => { void refreshAll(); }}
                      disabled={busyRefresh}
                      className="px-2 py-1 rounded bg-amber-700/70 hover:bg-amber-600 text-[11px] text-white disabled:opacity-50"
                    >
                      Kontrollera igen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !runResults ? (
            <div className="text-xs text-slate-500">Välj en körning för att se resultat.</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500">Totalt</div>
                  <div className="text-sm font-bold text-white">{runResults.total}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500">Pass</div>
                  <div className="text-sm font-bold text-emerald-400">{runResults.passed}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500">Fail</div>
                  <div className="text-sm font-bold text-rose-400">{runResults.failed}</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2">
                  <div className="text-[10px] text-slate-500">Pass-rate</div>
                  <div className="text-sm font-bold text-cyan-300">{passRate}%</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-1">Per kategori</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(runResults.by_category || {}).map(([name, stat]) => (
                    <div key={name} className="flex items-center justify-between text-[11px] bg-slate-900/50 rounded px-2 py-1.5">
                      <span className="text-slate-300 font-mono">{name}</span>
                      <span className="text-slate-400">{stat.passed} pass / {stat.failed} fail</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-1">Senaste findings</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {(runResults.tests || []).filter((t) => !t.passed).slice(0, 10).map((test) => (
                    <div key={test.id} className="flex items-start gap-2 text-[11px] bg-rose-900/10 border border-rose-800/30 rounded px-2 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-rose-300 font-mono truncate">{test.id}</div>
                        <div className="text-slate-400 truncate">
                          {test.error || `${test.expected_decision || "?"} -> ${test.actual_decision || "?"} (HTTP ${test.status_code || "?"})`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(runResults.tests || []).filter((t) => !t.passed).length === 0 && (
                    <div className="text-[11px] text-emerald-400">Inga misslyckade tester i denna körning.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
