import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import express, { type Express } from "express";
import workspaceRoutes from "../workspace-routes.js";
import snapshotsRoutes from "../routes/snapshots-routes.js";
import webhooksRoutes from "../routes/webhooks-routes.js";
import { registerOperationalRoutes, requestIdLoggingMiddleware } from "../runtime-quality.js";

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

test("S1-4 auth/role guard smoke: requireRole(admin) returns 401/403/200", async () => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost";
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "anon-test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "service-test";

  const { requireRole } = await import("../auth-middleware.js");

  const app = express();
  app.use((req, _res, next) => {
    const userId = req.header("x-test-user-id");
    const role = req.header("x-test-role");
    if (userId) req.userId = userId;
    if (role) req.userRole = role;
    next();
  });

  app.get("/admin", requireRole("admin"), (_req, res) => {
    res.json({ ok: true });
  });

  const server = await startServer(app);

  try {
    const unauthRes = await fetch(`${server.baseUrl}/admin`);
    assert.equal(unauthRes.status, 401);

    const forbiddenRes = await fetch(`${server.baseUrl}/admin`, {
      headers: {
        "x-test-user-id": "user-1",
        "x-test-role": "user",
      },
    });
    assert.equal(forbiddenRes.status, 403);

    const okRes = await fetch(`${server.baseUrl}/admin`, {
      headers: {
        "x-test-user-id": "admin-1",
        "x-test-role": "admin",
      },
    });
    assert.equal(okRes.status, 200);
    assert.deepEqual(await okRes.json(), { ok: true });
  } finally {
    await server.close();
  }
});

test("S1-5 runtime quality smoke: /healthz, /readyz and request-id propagation", async () => {
  const app = express();
  app.use(express.json());
  app.use(requestIdLoggingMiddleware);
  registerOperationalRoutes(app, process.cwd());

  app.get("/echo-request-id", (req, res) => {
    res.json({ requestId: req.requestId || null });
  });

  const server = await startServer(app);

  try {
    const healthRes = await fetch(`${server.baseUrl}/healthz`);
    assert.equal(healthRes.status, 200);
    const healthBody = (await healthRes.json()) as { status?: string };
    assert.equal(healthBody.status, "ok");

    const readyRes = await fetch(`${server.baseUrl}/readyz`);
    assert.equal(readyRes.status, 200);
    const readyBody = (await readyRes.json()) as { status?: string };
    assert.equal(readyBody.status, "ready");

    const requestId = "test-request-id-123";
    const echoRes = await fetch(`${server.baseUrl}/echo-request-id`, {
      headers: { "x-request-id": requestId },
    });
    assert.equal(echoRes.status, 200);
    assert.equal(echoRes.headers.get("x-request-id"), requestId);
    const echoBody = (await echoRes.json()) as { requestId?: string | null };
    assert.equal(echoBody.requestId, requestId);
  } finally {
    await server.close();
  }
});

test("S1-4 workspace smoke: path traversal is blocked", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/workspace", workspaceRoutes);

  const server = await startServer(app);

  try {
    const res = await fetch(`${server.baseUrl}/api/workspace/file?path=../../../../windows/system32/drivers/etc/hosts`);
    assert.equal(res.status, 403);
    const body = (await res.json()) as { error?: string };
    assert.equal(body.error, "Path outside workspace");
  } finally {
    await server.close();
  }
});

test("S1-4 snapshots/webhooks smoke: list endpoints respond", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/snapshots", snapshotsRoutes);
  app.use("/api/webhooks", webhooksRoutes);

  const server = await startServer(app);

  try {
    const snapshotsRes = await fetch(`${server.baseUrl}/api/snapshots`);
    assert.equal(snapshotsRes.status, 200);
    const snapshotsBody = await snapshotsRes.json();
    assert.ok(Array.isArray(snapshotsBody));

    const statsRes = await fetch(`${server.baseUrl}/api/snapshots/stats`);
    assert.equal(statsRes.status, 200);
    const statsBody = (await statsRes.json()) as { total?: number };
    assert.equal(typeof statsBody.total, "number");

    const webhooksRes = await fetch(`${server.baseUrl}/api/webhooks`);
    assert.equal(webhooksRes.status, 200);
    const webhooksBody = await webhooksRes.json();
    assert.ok(Array.isArray(webhooksBody));
  } finally {
    await server.close();
  }
});
