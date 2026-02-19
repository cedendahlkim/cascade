/**
 * Conversation Analytics — Token usage trends, cost forecasting, quality heatmaps
 *
 * Tracks per-model analytics across all conversations:
 * - Token usage over time (hourly/daily/weekly)
 * - Cost breakdown and forecasting (linear regression)
 * - Response quality scores (user feedback aggregation)
 * - Activity heatmaps (hour-of-day × day-of-week)
 * - Model performance comparison over time
 * - Session duration and message count stats
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const ANALYTICS_FILE = join(DATA_DIR, "conversation-analytics.json");

try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); } catch { /* ok */ }

// ─── Types ───────────────────────────────────────────────────

export type ModelProvider = "claude" | "gemini" | "deepseek" | "grok" | "ollama" | "frankenstein";

export interface TokenEvent {
  timestamp: string;
  model: ModelProvider;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  quality?: number;        // 1-5 user rating (if feedback given)
  conversationId?: string;
  messageLength?: number;  // chars in user message
}

export interface HourlyBucket {
  hour: string;            // "2026-02-17T14" format
  model: ModelProvider;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
  avgLatencyMs: number;
  avgQuality: number;
  qualityCount: number;
}

export interface ActivityHeatmapCell {
  dayOfWeek: number;       // 0=Sunday, 6=Saturday
  hourOfDay: number;       // 0-23
  requests: number;
  tokens: number;
  costUsd: number;
}

export interface CostForecast {
  currentDailyAvg: number;
  projectedWeekly: number;
  projectedMonthly: number;
  trend: "increasing" | "decreasing" | "stable";
  trendPercent: number;    // % change per week
  confidence: number;      // 0-1
}

export interface ModelAnalytics {
  model: ModelProvider;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  avgQuality: number;
  qualityCount: number;
  avgTokensPerRequest: number;
  peakHour: number;        // hour of day with most usage
  firstUsed: string;
  lastUsed: string;
}

export interface SessionStats {
  totalSessions: number;
  avgSessionDurationMin: number;
  avgMessagesPerSession: number;
  longestSessionMin: number;
  mostActiveDay: string;
  mostActiveHour: number;
}

export interface AnalyticsOverview {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  avgQuality: number;
  models: ModelAnalytics[];
  heatmap: ActivityHeatmapCell[];
  forecast: CostForecast;
  sessions: SessionStats;
  hourlyTrend: HourlyBucket[];
  dailyCosts: { date: string; costUsd: number; model: ModelProvider }[];
}

// ─── State ───────────────────────────────────────────────────

const tokenEvents: TokenEvent[] = [];
const hourlyBuckets: Map<string, HourlyBucket> = new Map();
const MAX_EVENTS = 50_000;
const MAX_HOURLY = 2160; // 90 days × 24 hours

// Session tracking
interface SessionTracker {
  id: string;
  model: ModelProvider;
  startedAt: number;
  lastActivityAt: number;
  messageCount: number;
}
const activeSessions: Map<string, SessionTracker> = new Map();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min inactivity = new session
let completedSessionCount = 0;
let totalSessionDurationMs = 0;
let totalSessionMessages = 0;
let longestSessionMs = 0;

// ─── Cost Tables ─────────────────────────────────────────────

const COST_PER_INPUT_TOKEN: Record<ModelProvider, number> = {
  claude: 3.0 / 1_000_000,
  gemini: 0.075 / 1_000_000,
  deepseek: 0.14 / 1_000_000,
  grok: 5.0 / 1_000_000,
  ollama: 0,
  frankenstein: 0.075 / 1_000_000, // uses Gemini under the hood
};

const COST_PER_OUTPUT_TOKEN: Record<ModelProvider, number> = {
  claude: 15.0 / 1_000_000,
  gemini: 0.30 / 1_000_000,
  deepseek: 0.28 / 1_000_000,
  grok: 15.0 / 1_000_000,
  ollama: 0,
  frankenstein: 0.30 / 1_000_000,
};

// ─── Persistence ─────────────────────────────────────────────

interface AnalyticsPersistence {
  events: TokenEvent[];
  hourly: [string, HourlyBucket][];
  sessions: { count: number; totalDurationMs: number; totalMessages: number; longestMs: number };
}

function load(): void {
  try {
    if (existsSync(ANALYTICS_FILE)) {
      const data: AnalyticsPersistence = JSON.parse(readFileSync(ANALYTICS_FILE, "utf-8"));
      if (data.events) {
        tokenEvents.push(...data.events.slice(-MAX_EVENTS));
      }
      if (data.hourly) {
        for (const [key, bucket] of data.hourly) {
          hourlyBuckets.set(key, bucket);
        }
      }
      if (data.sessions) {
        completedSessionCount = data.sessions.count || 0;
        totalSessionDurationMs = data.sessions.totalDurationMs || 0;
        totalSessionMessages = data.sessions.totalMessages || 0;
        longestSessionMs = data.sessions.longestMs || 0;
      }
    }
  } catch { /* fresh start */ }
}

function save(): void {
  try {
    // Keep only recent hourly buckets
    const entries = [...hourlyBuckets.entries()].slice(-MAX_HOURLY);
    const data: AnalyticsPersistence = {
      events: tokenEvents.slice(-MAX_EVENTS),
      hourly: entries,
      sessions: {
        count: completedSessionCount,
        totalDurationMs: totalSessionDurationMs,
        totalMessages: totalSessionMessages,
        longestMs: longestSessionMs,
      },
    };
    writeFileSync(ANALYTICS_FILE, JSON.stringify(data), "utf-8");
  } catch { /* ignore */ }
}

load();
// Auto-save every 5 minutes
setInterval(save, 5 * 60 * 1000);

// ─── Recording ───────────────────────────────────────────────

export function recordTokenEvent(event: Omit<TokenEvent, "costUsd"> & { costUsd?: number }): void {
  const model = event.model;
  const costUsd = event.costUsd ?? (
    event.inputTokens * (COST_PER_INPUT_TOKEN[model] || 0) +
    event.outputTokens * (COST_PER_OUTPUT_TOKEN[model] || 0)
  );

  const fullEvent: TokenEvent = { ...event, costUsd };
  tokenEvents.push(fullEvent);
  if (tokenEvents.length > MAX_EVENTS) tokenEvents.splice(0, tokenEvents.length - MAX_EVENTS);

  // Update hourly bucket
  const hourKey = fullEvent.timestamp.slice(0, 13); // "2026-02-17T14"
  const bucketKey = `${hourKey}:${model}`;
  const existing = hourlyBuckets.get(bucketKey);

  if (existing) {
    existing.inputTokens += fullEvent.inputTokens;
    existing.outputTokens += fullEvent.outputTokens;
    existing.requests += 1;
    existing.costUsd += costUsd;
    existing.avgLatencyMs = Math.round(
      (existing.avgLatencyMs * (existing.requests - 1) + fullEvent.latencyMs) / existing.requests
    );
    if (fullEvent.quality) {
      existing.avgQuality = (existing.avgQuality * existing.qualityCount + fullEvent.quality) / (existing.qualityCount + 1);
      existing.qualityCount += 1;
    }
  } else {
    hourlyBuckets.set(bucketKey, {
      hour: hourKey,
      model,
      inputTokens: fullEvent.inputTokens,
      outputTokens: fullEvent.outputTokens,
      requests: 1,
      costUsd,
      avgLatencyMs: fullEvent.latencyMs,
      avgQuality: fullEvent.quality || 0,
      qualityCount: fullEvent.quality ? 1 : 0,
    });
  }

  // Trim old hourly buckets
  if (hourlyBuckets.size > MAX_HOURLY * 6) {
    const keys = [...hourlyBuckets.keys()].sort();
    const toRemove = keys.slice(0, keys.length - MAX_HOURLY * 6);
    for (const key of toRemove) hourlyBuckets.delete(key);
  }

  // Session tracking
  updateSession(model, fullEvent.conversationId);
}

export function recordQualityFeedback(model: ModelProvider, quality: number, timestamp?: string): void {
  const ts = timestamp || new Date().toISOString();
  const hourKey = ts.slice(0, 13);
  const bucketKey = `${hourKey}:${model}`;
  const existing = hourlyBuckets.get(bucketKey);
  if (existing) {
    existing.avgQuality = (existing.avgQuality * existing.qualityCount + quality) / (existing.qualityCount + 1);
    existing.qualityCount += 1;
  }
}

function updateSession(model: ModelProvider, conversationId?: string): void {
  const key = conversationId || `default-${model}`;
  const now = Date.now();
  const existing = activeSessions.get(key);

  if (existing && (now - existing.lastActivityAt) < SESSION_TIMEOUT_MS) {
    existing.lastActivityAt = now;
    existing.messageCount += 1;
  } else {
    // Finalize old session
    if (existing) {
      const duration = existing.lastActivityAt - existing.startedAt;
      completedSessionCount += 1;
      totalSessionDurationMs += duration;
      totalSessionMessages += existing.messageCount;
      if (duration > longestSessionMs) longestSessionMs = duration;
    }
    // Start new session
    activeSessions.set(key, {
      id: key,
      model,
      startedAt: now,
      lastActivityAt: now,
      messageCount: 1,
    });
  }
}

// ─── Queries ─────────────────────────────────────────────────

export function getActivityHeatmap(days: number = 30): ActivityHeatmapCell[] {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const grid: ActivityHeatmapCell[][] = Array.from({ length: 7 }, (_, dow) =>
    Array.from({ length: 24 }, (_, hour) => ({
      dayOfWeek: dow,
      hourOfDay: hour,
      requests: 0,
      tokens: 0,
      costUsd: 0,
    }))
  );

  for (const event of tokenEvents) {
    if (event.timestamp < cutoff) continue;
    const d = new Date(event.timestamp);
    const dow = d.getDay();
    const hour = d.getHours();
    grid[dow][hour].requests += 1;
    grid[dow][hour].tokens += event.inputTokens + event.outputTokens;
    grid[dow][hour].costUsd += event.costUsd;
  }

  return grid.flat();
}

export function getCostForecast(): CostForecast {
  // Get daily costs for last 14 days
  const dailyCosts: Map<string, number> = new Map();
  const now = Date.now();

  for (const event of tokenEvents) {
    const day = event.timestamp.slice(0, 10);
    dailyCosts.set(day, (dailyCosts.get(day) || 0) + event.costUsd);
  }

  const sortedDays = [...dailyCosts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14);

  if (sortedDays.length < 2) {
    return {
      currentDailyAvg: sortedDays.length > 0 ? sortedDays[0][1] : 0,
      projectedWeekly: 0,
      projectedMonthly: 0,
      trend: "stable",
      trendPercent: 0,
      confidence: 0,
    };
  }

  // Simple linear regression on daily costs
  const n = sortedDays.length;
  const costs = sortedDays.map(d => d[1]);
  const xs = costs.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = costs.reduce((a, b) => a + b, 0) / n;

  let ssxy = 0, ssxx = 0;
  for (let i = 0; i < n; i++) {
    ssxy += (xs[i] - xMean) * (costs[i] - yMean);
    ssxx += (xs[i] - xMean) ** 2;
  }
  const slope = ssxx > 0 ? ssxy / ssxx : 0;

  // R² for confidence
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = yMean + slope * (xs[i] - xMean);
    ssTot += (costs[i] - yMean) ** 2;
    ssRes += (costs[i] - predicted) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  const currentDailyAvg = yMean;
  const weeklySlope = slope * 7;
  const trendPercent = currentDailyAvg > 0 ? (weeklySlope / (currentDailyAvg * 7)) * 100 : 0;

  return {
    currentDailyAvg: Math.round(currentDailyAvg * 10000) / 10000,
    projectedWeekly: Math.round(currentDailyAvg * 7 * 10000) / 10000,
    projectedMonthly: Math.round(currentDailyAvg * 30 * 10000) / 10000,
    trend: Math.abs(trendPercent) < 5 ? "stable" : trendPercent > 0 ? "increasing" : "decreasing",
    trendPercent: Math.round(trendPercent * 10) / 10,
    confidence: Math.round(Math.max(0, r2) * 100) / 100,
  };
}

export function getModelAnalytics(days: number = 30): ModelAnalytics[] {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const byModel: Map<ModelProvider, ModelAnalytics> = new Map();
  const hourCounts: Map<ModelProvider, Map<number, number>> = new Map();

  for (const event of tokenEvents) {
    if (event.timestamp < cutoff) continue;

    let m = byModel.get(event.model);
    if (!m) {
      m = {
        model: event.model,
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
        avgLatencyMs: 0,
        avgQuality: 0,
        qualityCount: 0,
        avgTokensPerRequest: 0,
        peakHour: 0,
        firstUsed: event.timestamp,
        lastUsed: event.timestamp,
      };
      byModel.set(event.model, m);
    }

    m.totalRequests += 1;
    m.totalInputTokens += event.inputTokens;
    m.totalOutputTokens += event.outputTokens;
    m.totalCostUsd += event.costUsd;
    m.avgLatencyMs = Math.round(
      (m.avgLatencyMs * (m.totalRequests - 1) + event.latencyMs) / m.totalRequests
    );
    if (event.quality) {
      m.avgQuality = (m.avgQuality * m.qualityCount + event.quality) / (m.qualityCount + 1);
      m.qualityCount += 1;
    }
    if (event.timestamp > m.lastUsed) m.lastUsed = event.timestamp;
    if (event.timestamp < m.firstUsed) m.firstUsed = event.timestamp;

    // Track hour counts for peak hour
    if (!hourCounts.has(event.model)) hourCounts.set(event.model, new Map());
    const hc = hourCounts.get(event.model)!;
    const hour = new Date(event.timestamp).getHours();
    hc.set(hour, (hc.get(hour) || 0) + 1);
  }

  // Calculate derived stats
  for (const [model, m] of byModel) {
    m.avgTokensPerRequest = m.totalRequests > 0
      ? Math.round((m.totalInputTokens + m.totalOutputTokens) / m.totalRequests)
      : 0;
    m.avgQuality = Math.round(m.avgQuality * 10) / 10;
    m.totalCostUsd = Math.round(m.totalCostUsd * 10000) / 10000;

    const hc = hourCounts.get(model);
    if (hc) {
      let maxCount = 0;
      for (const [hour, count] of hc) {
        if (count > maxCount) { maxCount = count; m.peakHour = hour; }
      }
    }
  }

  return [...byModel.values()].sort((a, b) => b.totalRequests - a.totalRequests);
}

export function getSessionStats(): SessionStats {
  // Flush active sessions older than timeout
  const now = Date.now();
  for (const [key, session] of activeSessions) {
    if (now - session.lastActivityAt > SESSION_TIMEOUT_MS) {
      const duration = session.lastActivityAt - session.startedAt;
      completedSessionCount += 1;
      totalSessionDurationMs += duration;
      totalSessionMessages += session.messageCount;
      if (duration > longestSessionMs) longestSessionMs = duration;
      activeSessions.delete(key);
    }
  }

  // Find most active day and hour
  const dayCounts: Map<string, number> = new Map();
  const hourCounts: Map<number, number> = new Map();
  for (const event of tokenEvents) {
    const day = event.timestamp.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    const hour = new Date(event.timestamp).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }

  let mostActiveDay = "";
  let maxDayCount = 0;
  for (const [day, count] of dayCounts) {
    if (count > maxDayCount) { maxDayCount = count; mostActiveDay = day; }
  }

  let mostActiveHour = 0;
  let maxHourCount = 0;
  for (const [hour, count] of hourCounts) {
    if (count > maxHourCount) { maxHourCount = count; mostActiveHour = hour; }
  }

  const totalSessions = completedSessionCount + activeSessions.size;

  return {
    totalSessions,
    avgSessionDurationMin: totalSessions > 0
      ? Math.round(totalSessionDurationMs / totalSessions / 60000)
      : 0,
    avgMessagesPerSession: totalSessions > 0
      ? Math.round(totalSessionMessages / totalSessions)
      : 0,
    longestSessionMin: Math.round(longestSessionMs / 60000),
    mostActiveDay,
    mostActiveHour,
  };
}

export function getDailyCosts(days: number = 30): { date: string; costUsd: number; model: ModelProvider }[] {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const daily: Map<string, { date: string; costUsd: number; model: ModelProvider }> = new Map();

  for (const event of tokenEvents) {
    const day = event.timestamp.slice(0, 10);
    if (day < cutoff) continue;
    const key = `${day}:${event.model}`;
    const existing = daily.get(key);
    if (existing) {
      existing.costUsd += event.costUsd;
    } else {
      daily.set(key, { date: day, costUsd: event.costUsd, model: event.model });
    }
  }

  return [...daily.values()]
    .map(d => ({ ...d, costUsd: Math.round(d.costUsd * 10000) / 10000 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getHourlyTrend(hours: number = 48): HourlyBucket[] {
  const cutoff = new Date(Date.now() - hours * 3600000).toISOString().slice(0, 13);
  return [...hourlyBuckets.values()]
    .filter(b => b.hour >= cutoff)
    .sort((a, b) => a.hour.localeCompare(b.hour));
}

export function getAnalyticsOverview(days: number = 30): AnalyticsOverview {
  const models = getModelAnalytics(days);
  const totalRequests = models.reduce((s, m) => s + m.totalRequests, 0);
  const totalTokens = models.reduce((s, m) => s + m.totalInputTokens + m.totalOutputTokens, 0);
  const totalCostUsd = models.reduce((s, m) => s + m.totalCostUsd, 0);
  const avgLatencyMs = totalRequests > 0
    ? Math.round(models.reduce((s, m) => s + m.avgLatencyMs * m.totalRequests, 0) / totalRequests)
    : 0;
  const qualityModels = models.filter(m => m.qualityCount > 0);
  const avgQuality = qualityModels.length > 0
    ? Math.round(qualityModels.reduce((s, m) => s + m.avgQuality * m.qualityCount, 0) /
        qualityModels.reduce((s, m) => s + m.qualityCount, 0) * 10) / 10
    : 0;

  return {
    totalRequests,
    totalTokens,
    totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
    avgLatencyMs,
    avgQuality,
    models,
    heatmap: getActivityHeatmap(days),
    forecast: getCostForecast(),
    sessions: getSessionStats(),
    hourlyTrend: getHourlyTrend(48),
    dailyCosts: getDailyCosts(days),
  };
}

// ─── Export CSV ──────────────────────────────────────────────

export function exportAnalyticsCsv(): string {
  const lines: string[] = [];
  lines.push("timestamp,model,input_tokens,output_tokens,latency_ms,cost_usd,quality");
  for (const e of tokenEvents) {
    lines.push([
      e.timestamp,
      e.model,
      e.inputTokens,
      e.outputTokens,
      e.latencyMs,
      e.costUsd.toFixed(6),
      e.quality || "",
    ].join(","));
  }
  return lines.join("\n");
}
