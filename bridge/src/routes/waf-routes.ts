import { type Response as ExpressResponse, Router } from "express";

const router = Router();
const DEFAULT_TARGET_BASE_URL = "http://localhost:18080";
const DEFAULT_WAF_SERVICE_URL = "http://127.0.0.1:8000";
const RUN_STUCK_THRESHOLD_SECONDS = 15 * 60;

function getWafServiceUrl(): string {
  return (process.env.WAF_HARDENING_URL || DEFAULT_WAF_SERVICE_URL).replace(/\/+$/, "");
}

interface WafProxyResult {
  ok: boolean;
  status: number;
  data: unknown;
  finalUrl: string;
}

interface ParsedWafCommand {
  action: "start" | "stop" | "status" | "run" | null;
  profile: string;
  baseUrl: string;
  tags: string;
  excludeTags: string;
  ids: string;
  concurrency: number;
}

interface WafRecentRun {
  run_id: string;
  status: string;
  started_at: number;
  return_code: number | null;
}

function parseWafCommand(message: string): ParsedWafCommand {
  const lower = message.toLowerCase();
  const profileMatch = lower.match(/\b(pl1|pl2|pl2-strict|pl3|pl3-tuned|pl4)\b/);
  const urlMatch = message.match(/https?:\/\/\S+/i);
  const tagsMatch = message.match(/tags?\s*[:=]\s*([a-z0-9,_-]+)/i);
  const excludeMatch = message.match(/exclude[_-]?tags?\s*[:=]\s*([a-z0-9,_-]+)/i);
  const idsMatch = message.match(/ids?\s*[:=]\s*([a-z0-9,_-]+)/i);
  const concurrencyMatch = message.match(/concurrency\s*[:=]\s*(\d{1,2})/i);

  const looksLikeRun = /\bkör\b|\brun\b|\btest\b|\btestsvit\b/i.test(lower);
  const looksLikeStart = /\bstart\b|\bstarta\b|\baktivera\b/i.test(lower);
  const looksLikeStop = /\bstop\b|\bstoppa\b|\bstäng\b|\bavsluta\b/i.test(lower);
  const looksLikeStatus = /\bstatus\b|\bhälsa\b|\bhealth\b|\bcheck\b/i.test(lower);

  let action: ParsedWafCommand["action"] = null;
  if (looksLikeRun) action = "run";
  else if (looksLikeStart) action = "start";
  else if (looksLikeStop) action = "stop";
  else if (looksLikeStatus) action = "status";

  const concurrencyRaw = concurrencyMatch ? Number(concurrencyMatch[1]) : 1;
  const concurrency = Number.isFinite(concurrencyRaw)
    ? Math.max(1, Math.min(64, Math.floor(concurrencyRaw)))
    : 1;

  return {
    action,
    profile: profileMatch?.[1] || "pl1",
    baseUrl: (urlMatch?.[0] || DEFAULT_TARGET_BASE_URL).trim(),
    tags: (tagsMatch?.[1] || "").trim(),
    excludeTags: (excludeMatch?.[1] || "").trim(),
    ids: (idsMatch?.[1] || "").trim(),
    concurrency,
  };
}

function extractRecentRuns(data: unknown): WafRecentRun[] {
  if (!data || typeof data !== "object") return [];
  const runs = (data as { runs?: unknown }).runs;
  if (!Array.isArray(runs)) return [];

  return runs
    .filter((run): run is WafRecentRun => {
      if (!run || typeof run !== "object") return false;
      const candidate = run as Partial<WafRecentRun>;
      return (
        typeof candidate.run_id === "string"
        && typeof candidate.status === "string"
        && typeof candidate.started_at === "number"
        && (typeof candidate.return_code === "number" || candidate.return_code === null)
      );
    })
    .map((run) => ({ ...run }));
}

function findRecentRun(data: unknown, runId: string): WafRecentRun | null {
  const runs = extractRecentRuns(data);
  const match = runs.find((run) => run.run_id === runId);
  return match || null;
}

function buildRunningResultsPayload(runId: string, run: WafRecentRun | null, message: string): Record<string, unknown> {
  const startedAt = run?.started_at;
  const runningSeconds = typeof startedAt === "number"
    ? Math.max(0, Math.floor(Date.now() / 1000 - startedAt))
    : 0;
  const stale = runningSeconds >= RUN_STUCK_THRESHOLD_SECONDS;

  return {
    total: 0,
    passed: 0,
    failed: 0,
    pass_rate: 0,
    by_category: {},
    tests: [],
    status: stale ? "stalled" : "running",
    run_id: runId,
    started_at: startedAt,
    running_seconds: runningSeconds,
    stale,
    message,
  };
}

function getErrorMessage(data: unknown, status: number): string {
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 500) : `HTTP ${status}`;
  }
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const candidate = record.error || record.message || record.detail;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return `HTTP ${status}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function wafRequest(path: string, init?: RequestInit): Promise<WafProxyResult> {
  const response = await fetch(`${getWafServiceUrl()}${path}`, {
    ...init,
    redirect: "follow",
  });
  const data = await parseResponseBody(response);
  return {
    ok: response.ok,
    status: response.status,
    data,
    finalUrl: response.url,
  };
}

function handleServiceError(res: ExpressResponse, err: unknown): void {
  const detail = err instanceof Error ? err.message : String(err);
  res.status(502).json({
    error: `Could not reach WAF Hardening service at ${getWafServiceUrl()}`,
    detail,
  });
}

router.get("/config", (_req, res) => {
  res.json({ service_url: getWafServiceUrl(), default_target_base_url: DEFAULT_TARGET_BASE_URL });
});

router.get("/profiles", async (_req, res) => {
  try {
    const result = await wafRequest("/api/profiles");
    if (!result.ok) {
      return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
    }
    return res.json(result.data);
  } catch (err) {
    return handleServiceError(res, err);
  }
});

router.get("/status", async (req, res) => {
  const baseUrl = typeof req.query.base_url === "string" && req.query.base_url.trim().length > 0
    ? req.query.base_url.trim()
    : DEFAULT_TARGET_BASE_URL;

  try {
    const formBody = new URLSearchParams({ base_url: baseUrl }).toString();
    const result = await wafRequest("/api/tools/waf_status", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
    }
    return res.json(result.data);
  } catch (err) {
    return handleServiceError(res, err);
  }
});

router.post("/start", async (req, res) => {
  const profile = typeof req.body?.profile === "string" && req.body.profile.trim().length > 0
    ? req.body.profile.trim()
    : "pl1";

  try {
    const formBody = new URLSearchParams({ profile }).toString();
    const result = await wafRequest("/actions/waf/start", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
    }
    return res.json({ status: "started", profile });
  } catch (err) {
    return handleServiceError(res, err);
  }
});

router.post("/stop", async (_req, res) => {
  try {
    const result = await wafRequest("/actions/waf/stop", {
      method: "POST",
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
    }
    return res.json({ status: "stopped" });
  } catch (err) {
    return handleServiceError(res, err);
  }
});

router.post("/run", async (req, res) => {
  const tags = typeof req.body?.tags === "string" ? req.body.tags.trim() : "";
  const excludeTags = typeof req.body?.exclude_tags === "string" ? req.body.exclude_tags.trim() : "";
  const ids = typeof req.body?.ids === "string" ? req.body.ids.trim() : "";
  const baseUrl = typeof req.body?.base_url === "string" && req.body.base_url.trim().length > 0
    ? req.body.base_url.trim()
    : DEFAULT_TARGET_BASE_URL;

  const concurrencyRaw = Number(req.body?.concurrency);
  const concurrency = Number.isFinite(concurrencyRaw)
    ? Math.max(1, Math.min(64, Math.floor(concurrencyRaw)))
    : 1;

  try {
    const formBody = new URLSearchParams({
      base_url: baseUrl,
      tags,
      exclude_tags: excludeTags,
      ids,
      concurrency: String(concurrency),
    }).toString();

    const result = await wafRequest("/actions/run", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
    }

    const runIdMatch = result.finalUrl.match(/\/runs\/([a-f0-9]+)/i);
    const runId = runIdMatch ? runIdMatch[1] : null;

    return res.json({
      status: "running",
      run_id: runId,
      final_url: result.finalUrl,
      concurrency,
    });
  } catch (err) {
    return handleServiceError(res, err);
  }
});

router.get("/recent-runs", async (_req, res) => {
  try {
    const result = await wafRequest("/api/recent-runs");
    if (!result.ok) {
      return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
    }
    return res.json(result.data);
  } catch (err) {
    return handleServiceError(res, err);
  }
});

router.get("/run/:runId/results", async (req, res) => {
  const runId = req.params.runId;
  if (!runId) {
    return res.status(400).json({ error: "runId is required" });
  }

  try {
    let recentRun: WafRecentRun | null = null;
    const recentRunsResult = await wafRequest("/api/recent-runs");
    if (recentRunsResult.ok) {
      recentRun = findRecentRun(recentRunsResult.data, runId);
    }

    const result = await wafRequest(`/api/run/${encodeURIComponent(runId)}/results`);
    if (!result.ok) {
      const waitingForResults = recentRun?.status === "running" && [404, 425, 500, 502, 503, 504].includes(result.status);
      if (waitingForResults) {
        return res.json(buildRunningResultsPayload(runId, recentRun, "Körning pågår fortfarande. Väntar på att resultatfilen ska bli klar."));
      }

      return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
    }

    if (recentRun?.status === "running") {
      const runningPayload = buildRunningResultsPayload(runId, recentRun, "Körning pågår fortfarande. Delresultat visas.");
      if (result.data && typeof result.data === "object") {
        return res.json({
          ...runningPayload,
          ...(result.data as Record<string, unknown>),
          status: runningPayload.status,
          run_id: runningPayload.run_id,
          started_at: runningPayload.started_at,
          running_seconds: runningPayload.running_seconds,
          stale: runningPayload.stale,
          message: runningPayload.message,
        });
      }
      return res.json(buildRunningResultsPayload(runId, recentRun, "Körning pågår fortfarande."));
    }

    return res.json(result.data);
  } catch (err) {
    return handleServiceError(res, err);
  }
});

router.post("/ai/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const command = parseWafCommand(message);

  try {
    if (command.action === "start") {
      const formBody = new URLSearchParams({ profile: command.profile }).toString();
      const result = await wafRequest("/actions/waf/start", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      });

      if (!result.ok) {
        return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
      }

      return res.json({
        response: `Startade WAF med profil ${command.profile}.`,
        usage: { mode: "local-control", action: "start" },
      });
    }

    if (command.action === "stop") {
      const result = await wafRequest("/actions/waf/stop", { method: "POST" });
      if (!result.ok) {
        return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
      }

      return res.json({
        response: "WAF stoppad.",
        usage: { mode: "local-control", action: "stop" },
      });
    }

    if (command.action === "status") {
      const formBody = new URLSearchParams({ base_url: command.baseUrl }).toString();
      const result = await wafRequest("/api/tools/waf_status", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      });

      if (!result.ok) {
        return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
      }

      const statusPayload = result.data as { result?: unknown; error?: unknown };
      const text = typeof statusPayload.result === "string"
        ? statusPayload.result
        : (typeof statusPayload.error === "string" ? statusPayload.error : "Status hämtad");
      return res.json({
        response: text,
        usage: { mode: "local-control", action: "status", base_url: command.baseUrl },
      });
    }

    if (command.action === "run") {
      const formBody = new URLSearchParams({
        base_url: command.baseUrl,
        tags: command.tags,
        exclude_tags: command.excludeTags,
        ids: command.ids,
        concurrency: String(command.concurrency),
      }).toString();

      const result = await wafRequest("/actions/run", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      });

      if (!result.ok) {
        return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
      }

      const runIdMatch = result.finalUrl.match(/\/runs\/([a-f0-9]+)/i);
      const runId = runIdMatch ? runIdMatch[1] : "okänt";
      return res.json({
        response: `Testkörning startad. Run ID: ${runId}`,
        usage: {
          mode: "local-control",
          action: "run",
          run_id: runId,
          tags: command.tags,
          exclude_tags: command.excludeTags,
          ids: command.ids,
          concurrency: command.concurrency,
        },
      });
    }

    const result = await wafRequest("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: getErrorMessage(result.data, result.status) });
    }

    return res.json(result.data);
  } catch (err) {
    return handleServiceError(res, err);
  }
});

router.post("/ai/clear", async (_req, res) => {
  try {
    const result = await wafRequest("/api/ai/clear", {
      method: "POST",
    });

    if (!result.ok) {
      return res.json({ status: "ok", note: "local-control state cleared" });
    }

    return res.json(result.data);
  } catch (err) {
    return res.json({ status: "ok", note: "local-control state cleared" });
  }
});

export default router;
