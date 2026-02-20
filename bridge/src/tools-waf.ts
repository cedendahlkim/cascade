/**
 * WAF tool handler shared across agents.
 *
 * These tools proxy to the external WAF Hardening service (configured by WAF_HARDENING_URL).
 */

import { existsSync } from "fs";

const DEFAULT_WAF_SERVICE_URL = "http://127.0.0.1:8000";
const DEFAULT_WAF_SERVICE_URL_DOCKER = "http://host.docker.internal:8000";
const DEFAULT_WAF_TARGET_BASE_URL = "http://localhost:18080";

function isRunningInDocker(): boolean {
  // Standard marker file in many container runtimes.
  // On Windows this resolves to the drive root and should be false.
  return existsSync("/.dockerenv") || existsSync("/run/.containerenv") || process.env.DOCKER === "1";
}

function getDefaultWafServiceUrl(): string {
  return isRunningInDocker() ? DEFAULT_WAF_SERVICE_URL_DOCKER : DEFAULT_WAF_SERVICE_URL;
}

export function getWafServiceUrl(): string {
  return (process.env.WAF_HARDENING_URL || getDefaultWafServiceUrl()).replace(/\/+$/, "");
}

export function getDefaultWafTargetBaseUrl(): string {
  return DEFAULT_WAF_TARGET_BASE_URL;
}

function toWafString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

async function formatWafResponse(response: Response, label: string): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  let payload = "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    payload = JSON.stringify(data, null, 2);
  } else {
    payload = await response.text();
  }

  const maxLen = 12000;
  const finalPayload = payload.length > maxLen
    ? `${payload.slice(0, maxLen)}\n... (truncated ${payload.length - maxLen} chars)`
    : payload;

  return `[${label}] ${response.status} ${response.statusText}\n${finalPayload}`;
}

/**
 * Handles waf_* tools.
 *
 * Intentionally forwards parameters "as-is" (no bridge-side clamping) to preserve
 * unrestricted testing behavior.
 */
export async function handleWafTool(name: string, args: Record<string, unknown>): Promise<string> {
  const wafBase = getWafServiceUrl();

  try {
    if (name === "waf_start") {
      const profile = toWafString(args.profile, "pl1").trim() || "pl1";
      const body = new URLSearchParams({ profile }).toString();
      const response = await fetch(`${wafBase}/actions/waf/start`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(30000),
      });
      return formatWafResponse(response, `waf_start profile=${profile}`);
    }

    if (name === "waf_stop") {
      const response = await fetch(`${wafBase}/actions/waf/stop`, {
        method: "POST",
        signal: AbortSignal.timeout(30000),
      });
      return formatWafResponse(response, "waf_stop");
    }

    if (name === "waf_status") {
      const baseUrl = toWafString(args.base_url, DEFAULT_WAF_TARGET_BASE_URL).trim() || DEFAULT_WAF_TARGET_BASE_URL;
      const body = new URLSearchParams({ base_url: baseUrl }).toString();
      const response = await fetch(`${wafBase}/api/tools/waf_status`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(30000),
      });
      return formatWafResponse(response, `waf_status base_url=${baseUrl}`);
    }

    if (name === "waf_run") {
      const baseUrl = toWafString(args.base_url, DEFAULT_WAF_TARGET_BASE_URL).trim() || DEFAULT_WAF_TARGET_BASE_URL;
      const tags = toWafString(args.tags, "").trim();
      const excludeTags = toWafString(args.exclude_tags, "").trim();
      const ids = toWafString(args.ids, "").trim();
      const concurrency = toWafString(args.concurrency, "1").trim() || "1";

      const body = new URLSearchParams({
        base_url: baseUrl,
        tags,
        exclude_tags: excludeTags,
        ids,
        concurrency,
      }).toString();

      const response = await fetch(`${wafBase}/actions/run`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(30000),
      });

      const runMatch = response.url.match(/\/runs\/([^/?#]+)/i);
      const runInfo = runMatch ? ` run_id=${runMatch[1]}` : "";
      return formatWafResponse(response, `waf_run${runInfo}`);
    }

    if (name === "waf_recent_runs") {
      const response = await fetch(`${wafBase}/api/recent-runs`, {
        method: "GET",
        signal: AbortSignal.timeout(30000),
      });
      return formatWafResponse(response, "waf_recent_runs");
    }

    if (name === "waf_run_results") {
      const runId = toWafString(args.run_id, "").trim();
      if (!runId) return "waf_run_results requires run_id.";
      const response = await fetch(`${wafBase}/api/run/${encodeURIComponent(runId)}/results`, {
        method: "GET",
        signal: AbortSignal.timeout(30000),
      });
      return formatWafResponse(response, `waf_run_results run_id=${runId}`);
    }

    if (name === "waf_request") {
      const rawPath = toWafString(args.path, "").trim();
      if (!rawPath) return "waf_request requires path.";

      const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
      const method = toWafString(args.method, "GET").toUpperCase();
      const contentType = toWafString(args.content_type, "").trim();
      const body = toWafString(args.body, "");

      let parsedHeaders: Record<string, string> = {};
      if (typeof args.headers === "string" && args.headers.trim().length > 0) {
        try {
          const decoded = JSON.parse(args.headers) as unknown;
          if (decoded && typeof decoded === "object" && !Array.isArray(decoded)) {
            parsedHeaders = Object.fromEntries(
              Object.entries(decoded as Record<string, unknown>)
                .filter(([, val]) => typeof val === "string")
                .map(([key, val]) => [key, String(val)])
            );
          } else {
            return "waf_request headers must be valid JSON object string.";
          }
        } catch {
          return "waf_request headers must be valid JSON object string.";
        }
      }

      if (contentType && !parsedHeaders["Content-Type"]) {
        parsedHeaders["Content-Type"] = contentType;
      }

      const supportsBody = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
      const response = await fetch(`${wafBase}${path}`, {
        method,
        headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
        body: supportsBody ? body : undefined,
        signal: AbortSignal.timeout(30000),
      });

      return formatWafResponse(response, `waf_request ${method} ${path}`);
    }

    return `Unknown WAF tool: ${name}`;
  } catch (err) {
    return `WAF tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export const WAF_TOOL_NAMES = [
  "waf_start",
  "waf_stop",
  "waf_status",
  "waf_run",
  "waf_recent_runs",
  "waf_run_results",
  "waf_request",
] as const;
