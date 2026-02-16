/**
 * HTTP Client Plugin — GET/POST requests, API-testning
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "HTTP Client",
  version: "1.0.0",
  description: "Gör HTTP-anrop direkt: GET, POST, PUT, DELETE. Perfekt för API-testning och datahämtning.",
  author: "Gracestack",
  tools: [
    {
      name: "http_request",
      description: "Make an HTTP request (GET, POST, PUT, DELETE) to any URL. Returns status, headers, and body. Useful for API testing.",
      parameters: {
        url: { type: "string", description: "URL to request (required)" },
        method: { type: "string", description: "HTTP method: GET, POST, PUT, DELETE (default: GET)" },
        body: { type: "string", description: "Request body (for POST/PUT). JSON string or plain text." },
        headers: { type: "string", description: "Custom headers as JSON object string, e.g. '{\"Authorization\": \"Bearer xxx\"}'" },
        timeout: { type: "number", description: "Timeout in milliseconds (default: 10000)" },
      },
      handler: async (input) => {
        const url = input.url as string;
        if (!url) return "Error: URL is required";

        const method = ((input.method as string) || "GET").toUpperCase();
        const timeoutMs = (input.timeout as number) || 10000;

        const fetchOptions: RequestInit = { method };

        if (input.body && (method === "POST" || method === "PUT" || method === "PATCH")) {
          fetchOptions.body = input.body as string;
        }

        const customHeaders: Record<string, string> = {};
        if (input.headers) {
          try {
            Object.assign(customHeaders, JSON.parse(input.headers as string));
          } catch {
            return "Error: Invalid headers JSON";
          }
        }

        if (fetchOptions.body && !customHeaders["Content-Type"] && !customHeaders["content-type"]) {
          try {
            JSON.parse(fetchOptions.body as string);
            customHeaders["Content-Type"] = "application/json";
          } catch {
            customHeaders["Content-Type"] = "text/plain";
          }
        }

        fetchOptions.headers = customHeaders;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        fetchOptions.signal = controller.signal;

        try {
          const start = Date.now();
          const resp = await fetch(url, fetchOptions);
          const elapsed = Date.now() - start;
          clearTimeout(timer);

          const contentType = resp.headers.get("content-type") || "";
          let body: string;
          if (contentType.includes("json")) {
            const json = await resp.json();
            body = JSON.stringify(json, null, 2);
          } else {
            body = await resp.text();
          }

          // Truncate very large responses
          if (body.length > 5000) {
            body = body.slice(0, 5000) + `\n\n... [truncated, total ${body.length} chars]`;
          }

          const respHeaders: Record<string, string> = {};
          resp.headers.forEach((v, k) => { respHeaders[k] = v; });

          return JSON.stringify({
            status: resp.status,
            statusText: resp.statusText,
            elapsed: elapsed + "ms",
            headers: respHeaders,
            body,
          }, null, 2);
        } catch (err) {
          clearTimeout(timer);
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("abort")) return `Request timed out after ${timeoutMs}ms`;
          return `HTTP error: ${msg}`;
        }
      },
    },
    {
      name: "http_ping",
      description: "Check if a URL is reachable and measure response time. Returns status code and latency.",
      parameters: {
        url: { type: "string", description: "URL to ping" },
        count: { type: "number", description: "Number of pings (default: 3, max: 10)" },
      },
      handler: async (input) => {
        const url = input.url as string;
        if (!url) return "Error: URL is required";
        const count = Math.min(Math.max((input.count as number) || 3, 1), 10);

        const results: { attempt: number; status: number | string; latency: string }[] = [];

        for (let i = 0; i < count; i++) {
          const start = Date.now();
          try {
            const resp = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
            results.push({ attempt: i + 1, status: resp.status, latency: (Date.now() - start) + "ms" });
          } catch (err) {
            results.push({ attempt: i + 1, status: "error", latency: (Date.now() - start) + "ms" });
          }
        }

        const latencies = results
          .filter(r => typeof r.status === "number")
          .map(r => parseInt(r.latency));
        const avg = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0) : "N/A";

        return JSON.stringify({
          url,
          pings: count,
          results,
          averageLatency: avg + "ms",
          successRate: (latencies.length / count * 100).toFixed(0) + "%",
        }, null, 2);
      },
    },
  ],
};

export default plugin;
