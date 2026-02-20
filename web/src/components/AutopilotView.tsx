import { useMemo, useState } from "react";
import { BRIDGE_URL } from "../config";
import { authFetch } from "../lib/api";
import { Play, Rocket, Copy, CheckCircle2, XCircle } from "lucide-react";

interface MissionVerifyResult {
  command: string;
  success: boolean;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

interface MissionResult {
  action: string;
  success?: boolean;
  path?: string;
  command?: string;
  text?: string;
  error?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
}

interface MissionIteration {
  iteration: number;
  ok: boolean;
  actions?: any[];
  results?: MissionResult[];
  verify?: MissionVerifyResult[];
  error?: string;
  raw?: string;
}

interface MissionResponse {
  goal: string;
  ok: boolean;
  cwd: string;
  verify_cwd: string;
  iterations: MissionIteration[];
}

type VerifyPresetId = "none" | "web_build" | "bridge_test" | "all";

const DEFAULT_MAX_ITERS = 3;

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export default function AutopilotView() {
  const [goal, setGoal] = useState<string>(
    "",
  );
  const [maxIterations, setMaxIterations] = useState<number>(DEFAULT_MAX_ITERS);
  const [verifyPreset, setVerifyPreset] = useState<VerifyPresetId>("all");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<MissionResponse | null>(null);

  const presets = useMemo(() => {
    return {
      none: { label: "Ingen verifiering", verify: undefined as undefined | { commands: string[]; cwd?: string } },
      web_build: {
        label: "Web: npm run build",
        verify: { commands: ["npm --prefix web run build"], cwd: "." },
      },
      bridge_test: {
        label: "Bridge: npm run test",
        verify: { commands: ["npm --prefix bridge run test"], cwd: "." },
      },
      all: {
        label: "All: bridge test + web build",
        verify: {
          commands: ["npm --prefix bridge run test", "npm --prefix web run build"],
          cwd: ".",
        },
      },
    } satisfies Record<VerifyPresetId, { label: string; verify: undefined | { commands: string[]; cwd?: string } }>;
  }, []);

  const runMission = async () => {
    if (!goal.trim()) return;
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const preset = presets[verifyPreset];
      const response = await authFetch(`${BRIDGE_URL}/api/workspace/ai/mission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          maxIterations,
          verify: preset.verify,
        }),
      });

      const data = (await readJsonSafely(response)) as any;
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

      setResult(data as MissionResponse);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setRunning(false);
    }
  };

  const copyJson = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 p-4 border-b border-slate-800/60 glass-subtle">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-orange-300" />
            <div>
              <div className="text-sm font-semibold text-slate-100">Autopilot</div>
              <div className="text-[11px] text-slate-400">Plan → Execute → Verify → Repeat</div>
            </div>
          </div>

          <button
            onClick={runMission}
            disabled={running || !goal.trim()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/90 hover:bg-orange-500 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run mission"
          >
            <Play className="w-4 h-4" />
            {running ? "Kör..." : "Run mission"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="md:col-span-2">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Skriv ett mål. Ex: ‘Gör en Mission View som kan köra build+test och auto-fixa tills grönt’."
              className="w-full h-[84px] p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="autopilot-verify" className="text-[11px] text-slate-400">Verifiering</label>
            <select
              id="autopilot-verify"
              aria-label="Verifiering"
              value={verifyPreset}
              onChange={(e) => setVerifyPreset(e.target.value as VerifyPresetId)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-100"
            >
              {(Object.keys(presets) as VerifyPresetId[]).map((id) => (
                <option key={id} value={id}>
                  {presets[id].label}
                </option>
              ))}
            </select>

            <label htmlFor="autopilot-max-iterations" className="text-[11px] text-slate-400">Max iterations</label>
            <input
              id="autopilot-max-iterations"
              aria-label="Max iterations"
              type="number"
              min={1}
              max={10}
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value || DEFAULT_MAX_ITERS))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-100"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {!result && !running && !error && (
          <div className="text-sm text-slate-400">
            Autopilot kör en loop i backend och får lov att skriva filer + köra kommandon.
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                {result.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-300" />
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    {result.ok ? "OK" : "FAILED"}
                  </div>
                  <div className="text-[11px] text-slate-400">cwd: {result.cwd}</div>
                </div>
              </div>

              <button
                onClick={copyJson}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-100 text-xs font-semibold"
                title="Copy JSON"
              >
                <Copy className="w-4 h-4" />
                Copy JSON
              </button>
            </div>

            {result.iterations.map((it) => (
              <div
                key={it.iteration}
                className="p-3 rounded-xl border border-slate-800 bg-slate-950/40"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-100">
                    Iteration {it.iteration}
                    <span className={"ml-2 text-xs " + (it.ok ? "text-emerald-300" : "text-red-300")}>
                      {it.ok ? "OK" : "NOT OK"}
                    </span>
                  </div>
                </div>

                {it.error && (
                  <div className="mt-2 text-xs text-red-300">{it.error}</div>
                )}

                {it.raw && (
                  <pre className="mt-2 text-[11px] whitespace-pre-wrap text-slate-300 bg-black/30 border border-slate-800 rounded-lg p-2 overflow-auto">
                    {it.raw}
                  </pre>
                )}

                {it.results?.length ? (
                  <div className="mt-3 space-y-2">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Results</div>
                    {it.results.map((r, idx) => (
                      <details
                        key={idx}
                        className="rounded-lg border border-slate-800 bg-black/20"
                      >
                        <summary className="cursor-pointer select-none px-3 py-2 text-xs text-slate-200 flex items-center justify-between">
                          <span>
                            <span className="text-slate-400">{r.action}</span>
                            {r.path ? <span className="ml-2 text-slate-100">{r.path}</span> : null}
                            {r.command ? <span className="ml-2 text-slate-100">{r.command}</span> : null}
                          </span>
                          <span className={r.success === false ? "text-red-300" : "text-emerald-300"}>
                            {r.success === false ? "FAIL" : "OK"}
                          </span>
                        </summary>
                        <div className="px-3 pb-3">
                          {r.error && (
                            <div className="text-xs text-red-300">{r.error}</div>
                          )}
                          {(r.stdout || r.stderr) && (
                            <pre className="mt-2 text-[11px] whitespace-pre-wrap text-slate-300 bg-black/40 border border-slate-800 rounded-lg p-2 overflow-auto">
                              {r.stdout ? `stdout:\n${r.stdout}\n\n` : ""}
                              {r.stderr ? `stderr:\n${r.stderr}` : ""}
                            </pre>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : null}

                {it.verify?.length ? (
                  <div className="mt-3 space-y-2">
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">Verify</div>
                    {it.verify.map((v, idx) => (
                      <details key={idx} className="rounded-lg border border-slate-800 bg-black/20">
                        <summary className="cursor-pointer select-none px-3 py-2 text-xs text-slate-200 flex items-center justify-between">
                          <span className="text-slate-100">{v.command}</span>
                          <span className={v.success ? "text-emerald-300" : "text-red-300"}>
                            {v.success ? "PASS" : "FAIL"}
                          </span>
                        </summary>
                        <div className="px-3 pb-3">
                          <pre className="mt-2 text-[11px] whitespace-pre-wrap text-slate-300 bg-black/40 border border-slate-800 rounded-lg p-2 overflow-auto">
                            {v.stdout ? `stdout:\n${v.stdout}\n\n` : ""}
                            {v.stderr ? `stderr:\n${v.stderr}` : ""}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
