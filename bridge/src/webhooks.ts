/**
 * Webhook & API Gateway — Expose AI capabilities as webhooks
 *
 * Features:
 * - Register webhook endpoints with custom paths
 * - Map webhooks to AI agents (Claude, Gemini, DeepSeek, etc.)
 * - API key authentication per webhook
 * - Request/response logging with history
 * - Rate limiting per webhook
 * - Webhook templates (Slack, Discord, GitHub, custom)
 */
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Router, Request, Response, NextFunction } from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const WEBHOOKS_FILE = join(DATA_DIR, "webhooks.json");

try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); } catch { /* ok */ }

// ─── Types ───────────────────────────────────────────────────

export type WebhookModel = "claude" | "gemini" | "deepseek" | "grok" | "ollama";

export interface Webhook {
  id: string;
  name: string;
  description: string;
  path: string;            // e.g. "/hook/my-bot" → accessible at /api/webhooks/hook/my-bot
  apiKey: string;          // generated API key for auth
  model: WebhookModel;
  systemPrompt: string;
  enabled: boolean;
  createdAt: string;
  lastCalledAt?: string;
  callCount: number;
  maxCallsPerMinute: number;
  responseFormat: "text" | "json" | "markdown";
  template?: "slack" | "discord" | "github" | "custom";
}

export interface WebhookLog {
  webhookId: string;
  timestamp: string;
  method: string;
  body: unknown;
  response: string;
  latencyMs: number;
  status: number;
  ip: string;
}

// ─── State ───────────────────────────────────────────────────

let webhooks: Webhook[] = [];
const webhookLogs: WebhookLog[] = [];
const MAX_LOGS = 500;

// Rate limit tracking: webhookId → timestamps[]
const rateLimitMap: Map<string, number[]> = new Map();

// ─── Persistence ─────────────────────────────────────────────

function load(): void {
  try {
    if (existsSync(WEBHOOKS_FILE)) {
      webhooks = JSON.parse(readFileSync(WEBHOOKS_FILE, "utf-8"));
    }
  } catch { webhooks = []; }
}

function save(): void {
  try {
    writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2), "utf-8");
  } catch { /* ignore */ }
}

load();

// ─── Helpers ─────────────────────────────────────────────────

function generateApiKey(): string {
  return `gsk_${crypto.randomBytes(24).toString("hex")}`;
}

function checkRateLimit(webhookId: string, maxPerMin: number): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(webhookId) || [];
  const recent = timestamps.filter(t => now - t < 60_000);
  rateLimitMap.set(webhookId, recent);
  if (recent.length >= maxPerMin) return false;
  recent.push(now);
  return true;
}

// ─── CRUD ────────────────────────────────────────────────────

export function listWebhooks(): Webhook[] {
  return webhooks.map(w => ({ ...w, apiKey: w.apiKey.slice(0, 8) + "..." }));
}

export function getWebhook(id: string): Webhook | undefined {
  return webhooks.find(w => w.id === id);
}

export function createWebhook(data: {
  name: string;
  description?: string;
  path: string;
  model: WebhookModel;
  systemPrompt?: string;
  maxCallsPerMinute?: number;
  responseFormat?: "text" | "json" | "markdown";
  template?: "slack" | "discord" | "github" | "custom";
}): Webhook {
  // Validate path
  const cleanPath = data.path.replace(/[^a-zA-Z0-9\-_/]/g, "").replace(/^\/+/, "");
  if (!cleanPath) throw new Error("Invalid webhook path");

  // Check for duplicate paths
  if (webhooks.some(w => w.path === cleanPath)) {
    throw new Error(`Path already in use: ${cleanPath}`);
  }

  const webhook: Webhook = {
    id: uuidv4(),
    name: data.name,
    description: data.description || "",
    path: cleanPath,
    apiKey: generateApiKey(),
    model: data.model,
    systemPrompt: data.systemPrompt || "You are a helpful AI assistant responding to webhook requests. Be concise.",
    enabled: true,
    createdAt: new Date().toISOString(),
    callCount: 0,
    maxCallsPerMinute: data.maxCallsPerMinute || 10,
    responseFormat: data.responseFormat || "json",
    template: data.template,
  };

  webhooks.push(webhook);
  save();
  return webhook;
}

export function updateWebhook(id: string, data: Partial<Webhook>): Webhook | null {
  const webhook = webhooks.find(w => w.id === id);
  if (!webhook) return null;

  const { id: _id, apiKey: _key, createdAt: _date, ...safeData } = data as any;
  Object.assign(webhook, safeData);
  save();
  return webhook;
}

export function deleteWebhook(id: string): boolean {
  const idx = webhooks.findIndex(w => w.id === id);
  if (idx === -1) return false;
  webhooks.splice(idx, 1);
  save();
  return true;
}

export function regenerateApiKey(id: string): string | null {
  const webhook = webhooks.find(w => w.id === id);
  if (!webhook) return null;
  webhook.apiKey = generateApiKey();
  save();
  return webhook.apiKey;
}

export function getWebhookLogs(webhookId?: string, limit: number = 50): WebhookLog[] {
  const logs = webhookId
    ? webhookLogs.filter(l => l.webhookId === webhookId)
    : webhookLogs;
  return logs.slice(-limit).reverse();
}

// ─── Router ──────────────────────────────────────────────────

type AIHandler = (
  model: WebhookModel,
  systemPrompt: string,
  userMessage: string
) => Promise<string>;

let aiHandler: AIHandler | null = null;

export function registerWebhookAIHandler(handler: AIHandler): void {
  aiHandler = handler;
}

export function createWebhookRouter(): Router {
  const router = Router();

  // Management routes
  router.get("/", (_req, res) => res.json(listWebhooks()));

  router.get("/:id", (req, res) => {
    const wh = getWebhook(req.params.id);
    if (!wh) return res.status(404).json({ error: "Not found" });
    res.json({ ...wh, apiKey: wh.apiKey.slice(0, 8) + "..." });
  });

  router.post("/", (req, res) => {
    try {
      const wh = createWebhook(req.body);
      res.json(wh); // Show full API key on creation
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : "Failed" });
    }
  });

  router.put("/:id", (req, res) => {
    const wh = updateWebhook(req.params.id, req.body);
    if (!wh) return res.status(404).json({ error: "Not found" });
    res.json({ ...wh, apiKey: wh.apiKey.slice(0, 8) + "..." });
  });

  router.delete("/:id", (req, res) => {
    const ok = deleteWebhook(req.params.id);
    res.json({ ok });
  });

  router.post("/:id/regenerate-key", (req, res) => {
    const key = regenerateApiKey(req.params.id);
    if (!key) return res.status(404).json({ error: "Not found" });
    res.json({ apiKey: key });
  });

  router.get("/:id/logs", (req, res) => {
    const limit = parseInt(String(req.query.limit) || "50", 10);
    res.json(getWebhookLogs(req.params.id, limit));
  });

  // Webhook execution endpoint: POST /api/webhooks/hook/:path
  router.post("/hook/*", async (req: Request, res: Response) => {
    const hookPath = req.params[0] || req.path.replace(/^\/hook\//, "");
    const webhook = webhooks.find(w => w.path === hookPath && w.enabled);

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found or disabled" });
    }

    // Auth check
    const providedKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    if (providedKey !== webhook.apiKey) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Rate limit
    if (!checkRateLimit(webhook.id, webhook.maxCallsPerMinute)) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    if (!aiHandler) {
      return res.status(503).json({ error: "AI handler not configured" });
    }

    const startTime = Date.now();

    try {
      // Extract user message based on template
      let userMessage = "";
      if (webhook.template === "slack") {
        userMessage = req.body.text || req.body.event?.text || JSON.stringify(req.body);
      } else if (webhook.template === "discord") {
        userMessage = req.body.content || JSON.stringify(req.body);
      } else if (webhook.template === "github") {
        userMessage = `GitHub ${req.body.action || "event"}: ${req.body.pull_request?.title || req.body.issue?.title || JSON.stringify(req.body).slice(0, 500)}`;
      } else {
        userMessage = req.body.message || req.body.text || req.body.prompt || req.body.query || JSON.stringify(req.body);
      }

      const aiResponse = await aiHandler(webhook.model, webhook.systemPrompt, userMessage);
      const latencyMs = Date.now() - startTime;

      // Update webhook stats
      webhook.callCount++;
      webhook.lastCalledAt = new Date().toISOString();
      save();

      // Log
      webhookLogs.push({
        webhookId: webhook.id,
        timestamp: new Date().toISOString(),
        method: req.method,
        body: req.body,
        response: aiResponse.slice(0, 2000),
        latencyMs,
        status: 200,
        ip: req.ip || "unknown",
      });
      if (webhookLogs.length > MAX_LOGS) webhookLogs.splice(0, webhookLogs.length - MAX_LOGS);

      // Format response
      if (webhook.responseFormat === "text") {
        res.setHeader("Content-Type", "text/plain");
        res.send(aiResponse);
      } else if (webhook.responseFormat === "markdown") {
        res.setHeader("Content-Type", "text/markdown");
        res.send(aiResponse);
      } else {
        // Slack-compatible JSON
        if (webhook.template === "slack") {
          res.json({ text: aiResponse });
        } else {
          res.json({ response: aiResponse, model: webhook.model, latencyMs });
        }
      }
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      webhookLogs.push({
        webhookId: webhook.id,
        timestamp: new Date().toISOString(),
        method: req.method,
        body: req.body,
        response: `ERROR: ${err instanceof Error ? err.message : String(err)}`,
        latencyMs,
        status: 500,
        ip: req.ip || "unknown",
      });
      res.status(500).json({ error: "AI processing failed" });
    }
  });

  return router;
}
