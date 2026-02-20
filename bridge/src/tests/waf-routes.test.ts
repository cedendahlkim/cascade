import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import express, { type Express } from "express";
import wafRoutes from "../routes/waf-routes.js";

type MockFetchCall = {
  url: string;
  init?: RequestInit;
};

function mockJsonResponse(body: unknown, status: number, url: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    headers: new Headers({ "content-type": "application/json" }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function mockTextResponse(body: string, status: number, url: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    url,
    headers: new Headers({ "content-type": "text/plain" }),
    json: async () => {
      throw new Error("Not JSON");
    },
    text: async () => body,
  } as unknown as Response;
}

async function startServer(app: Express): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const server = createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not start test server");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        (server as Server).close((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      }),
  };
}

function parseFormBody(body: BodyInit | null | undefined): URLSearchParams {
  if (typeof body !== "string") {
    return new URLSearchParams();
  }
  return new URLSearchParams(body);
}

test("WAF AI quick action: start command uses local control", async () => {
  process.env.WAF_HARDENING_URL = "http://waf.local";

  const calls: MockFetchCall[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("http://waf.local/")) {
      calls.push({ url, init });

      if (url === "http://waf.local/actions/waf/start") {
        return mockTextResponse("started", 200, url);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  const app = express();
  app.use(express.json());
  app.use("/api/waf", wafRoutes);

  const server = await startServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/waf/ai/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Starta WAF med pl2" }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { usage?: { action?: string }; response?: string };

    assert.equal(body.usage?.action, "start");
    assert.match(body.response || "", /pl2/i);

    assert.equal(calls.length, 1);
    const form = parseFormBody(calls[0].init?.body);
    assert.equal(form.get("profile"), "pl2");
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});

test("WAF AI quick action: run command clamps concurrency and returns run id", async () => {
  process.env.WAF_HARDENING_URL = "http://waf.local";

  const calls: MockFetchCall[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("http://waf.local/")) {
      calls.push({ url, init });

      if (url === "http://waf.local/actions/run") {
        return mockTextResponse("started", 200, "http://waf.local/runs/abc123");
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  const app = express();
  app.use(express.json());
  app.use("/api/waf", wafRoutes);

  const server = await startServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/waf/ai/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Kör test med tags:sqli,xss concurrency:99" }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { usage?: { action?: string; concurrency?: number; run_id?: string } };

    assert.equal(body.usage?.action, "run");
    assert.equal(body.usage?.concurrency, 64);
    assert.equal(body.usage?.run_id, "abc123");

    assert.equal(calls.length, 1);
    const form = parseFormBody(calls[0].init?.body);
    assert.equal(form.get("concurrency"), "64");
    assert.equal(form.get("tags"), "sqli,xss");
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});

test("WAF run endpoint clamps concurrency for quick test action", async () => {
  process.env.WAF_HARDENING_URL = "http://waf.local";

  const calls: MockFetchCall[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("http://waf.local/")) {
      calls.push({ url, init });

      if (url === "http://waf.local/actions/run") {
        return mockTextResponse("started", 200, "http://waf.local/runs/a55f00");
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  const app = express();
  app.use(express.json());
  app.use("/api/waf", wafRoutes);

  const server = await startServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/waf/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        base_url: "http://localhost:18080",
        tags: "owasp-a01",
        exclude_tags: "",
        ids: "",
        concurrency: 999,
      }),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { status?: string; concurrency?: number; run_id?: string };
    assert.equal(body.status, "running");
    assert.equal(body.concurrency, 64);
    assert.equal(body.run_id, "a55f00");

    const form = parseFormBody(calls[0].init?.body);
    assert.equal(form.get("concurrency"), "64");
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});

test("WAF results endpoint returns stalled status when step is still running", async () => {
  process.env.WAF_HARDENING_URL = "http://waf.local";

  const nowSeconds = Math.floor(Date.now() / 1000);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);

    if (url.startsWith("http://waf.local/")) {
      if (url === "http://waf.local/api/recent-runs") {
        return mockJsonResponse(
          {
            runs: [
              {
                run_id: "run-stuck-1",
                status: "running",
                started_at: nowSeconds - 1800,
                return_code: null,
              },
            ],
          },
          200,
          url,
        );
      }

      if (url === "http://waf.local/api/run/run-stuck-1/results") {
        return mockJsonResponse({ error: "results not ready" }, 404, url);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    }

    return originalFetch(input, _init);
  }) as typeof fetch;

  const app = express();
  app.use(express.json());
  app.use("/api/waf", wafRoutes);

  const server = await startServer(app);

  try {
    const response = await fetch(`${server.baseUrl}/api/waf/run/run-stuck-1/results`);

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      status?: string;
      stale?: boolean;
      running_seconds?: number;
      message?: string;
    };

    assert.equal(body.status, "stalled");
    assert.equal(body.stale, true);
    assert.ok((body.running_seconds || 0) >= 1790);
    assert.match(body.message || "", /Väntar på att resultatfilen ska bli klar/i);
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});
