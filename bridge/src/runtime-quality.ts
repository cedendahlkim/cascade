import type { Express, NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";

export type AllowedOrigins = "*" | string[];

export interface RuntimeConfig {
  port: number;
  workspaceRoot: string;
  allowedOrigins: AllowedOrigins;
  rateLimitMax: number;
  tokenBudget: number;
  noTunnel: boolean;
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

function parseIntegerEnv(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
  options: { min: number; max?: number },
): number {
  const raw = env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer (received: ${raw})`);
  }
  if (parsed < options.min) {
    throw new Error(`${name} must be >= ${options.min} (received: ${parsed})`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new Error(`${name} must be <= ${options.max} (received: ${parsed})`);
  }

  return parsed;
}

function parseAllowedOrigins(raw: string | undefined): AllowedOrigins {
  if (!raw || raw.trim() === "") {
    return "*";
  }
  if (raw.trim() === "*") {
    return "*";
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error("ALLOWED_ORIGINS must contain at least one origin or '*'");
  }

  return origins;
}

function validateSupabaseEnv(env: NodeJS.ProcessEnv): void {
  const values = [env.SUPABASE_URL, env.SUPABASE_ANON_KEY, env.SUPABASE_SERVICE_ROLE_KEY];
  const setCount = values.filter((value) => !!value && value.trim().length > 0).length;

  if (setCount > 0 && setCount < values.length) {
    throw new Error(
      "SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY must either all be set or all be unset",
    );
  }
}

export function resolveRuntimeConfig(env: NodeJS.ProcessEnv, defaultWorkspaceRoot: string): RuntimeConfig {
  validateSupabaseEnv(env);

  const port = parseIntegerEnv(env, "PORT", 3031, { min: 1, max: 65535 });
  const rateLimitMax = parseIntegerEnv(env, "RATE_LIMIT_MAX", 30, { min: 1 });
  const tokenBudget = parseIntegerEnv(env, "TOKEN_BUDGET", 0, { min: 0 });

  const noTunnelRaw = env.NO_TUNNEL;
  if (noTunnelRaw !== undefined && noTunnelRaw !== "0" && noTunnelRaw !== "1") {
    throw new Error(`NO_TUNNEL must be '0' or '1' (received: ${noTunnelRaw})`);
  }

  const workspaceRoot = env.CASCADE_REMOTE_WORKSPACE || defaultWorkspaceRoot;
  if (!existsSync(workspaceRoot)) {
    throw new Error(`CASCADE_REMOTE_WORKSPACE does not exist: ${workspaceRoot}`);
  }

  return {
    port,
    workspaceRoot,
    allowedOrigins: parseAllowedOrigins(env.ALLOWED_ORIGINS),
    rateLimitMax,
    tokenBudget,
    noTunnel: noTunnelRaw === "1",
  };
}

export function requestIdLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingRequestId = req.header("x-request-id");
  const requestId = incomingRequestId && incomingRequestId.trim() ? incomingRequestId.trim() : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[http] req_id=${requestId} method=${req.method} path=${req.originalUrl} status=${res.statusCode} duration_ms=${durationMs}`,
    );
  });

  next();
}

export function registerOperationalRoutes(app: Express, workspaceRoot: string): void {
  app.get("/healthz", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      pid: process.pid,
    });
  });

  app.get("/readyz", (_req, res) => {
    const checks = {
      workspaceRootExists: existsSync(workspaceRoot),
    };

    const ready = Object.values(checks).every(Boolean);
    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      checks,
      timestamp: new Date().toISOString(),
    });
  });
}
