/**
 * Dashboard & Analytics — Real-time metrics for Cascade Remote
 * 
 * Tracks token usage, costs, latency, uptime, and system health.
 * Features:
 * - Real-time system metrics (CPU, RAM, connections)
 * - Historical trends (daily/weekly, persisted to disk)
 * - Cost budget with alerts
 * - Model comparison (latency, quality, cost)
 * - CSV export of all metrics
 */
import os from "os";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface DashboardMetrics {
  uptime: number;
  system: {
    cpuUsage: number;
    memoryUsed: number;
    memoryTotal: number;
    memoryPercent: number;
    platform: string;
    hostname: string;
    cpuModel: string;
    cpuCores: number;
  };
  ai: {
    claude: AgentMetrics;
    gemini: AgentMetrics;
    orchestrator: { totalTasks: number; completedTasks: number; failedTasks: number };
  };
  connections: {
    mobileClients: number;
    computerAgents: number;
    totalConnections: number;
  };
  activity: {
    messagesTotal: number;
    messagesToday: number;
    schedulesActive: number;
    filesShared: number;
    pluginsLoaded: number;
    workflowsRun: number;
  };
  costs: {
    estimatedTotalUsd: number;
    claudeUsd: number;
    geminiUsd: number;
  };
  history: MetricSnapshot[];
}

export interface AgentMetrics {
  enabled: boolean;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
  avgLatencyMs: number;
  lastActiveAt: string | null;
}

export interface MetricSnapshot {
  timestamp: string;
  cpuPercent: number;
  memoryPercent: number;
  claudeTokens: number;
  geminiTokens: number;
  connections: number;
}

export interface DailyMetrics {
  date: string;
  claudeTokens: number;
  geminiTokens: number;
  claudeRequests: number;
  geminiRequests: number;
  claudeCostUsd: number;
  geminiCostUsd: number;
  totalCostUsd: number;
  messagesCount: number;
  avgCpuPercent: number;
  avgMemoryPercent: number;
  peakCpuPercent: number;
  peakMemoryPercent: number;
  claudeAvgLatencyMs: number;
  geminiAvgLatencyMs: number;
}

export interface CostBudget {
  dailyLimitUsd: number;
  weeklyLimitUsd: number;
  monthlyLimitUsd: number;
  alertThreshold: number; // 0-1, e.g. 0.8 = alert at 80%
  enabled: boolean;
}

export interface BudgetAlert {
  type: "daily" | "weekly" | "monthly";
  currentUsd: number;
  limitUsd: number;
  percent: number;
  timestamp: string;
}

export interface ModelComparison {
  model: string;
  provider: "claude" | "gemini";
  totalTokens: number;
  requestCount: number;
  avgLatencyMs: number;
  costPerRequest: number;
  costPer1kTokens: number;
  totalCostUsd: number;
  successRate: number;
  enabled: boolean;
}

const startTime = Date.now();
const snapshots: MetricSnapshot[] = [];
const MAX_SNAPSHOTS = 288; // 24h at 5min intervals

// --- Persistence ---
const DATA_DIR = join(
  process.env.CASCADE_REMOTE_WORKSPACE ||
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\/(src|dist)\/dashboard\.(ts|js)$/, ""),
  "data"
);
const TRENDS_FILE = join(DATA_DIR, "dashboard-trends.json");
const BUDGET_FILE = join(DATA_DIR, "dashboard-budget.json");

// --- Historical Trends ---
let dailyTrends: DailyMetrics[] = [];
let lastDailySnapshot: { date: string; cpuSamples: number[]; memSamples: number[] } = { date: "", cpuSamples: [], memSamples: [] };

function loadTrends(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (existsSync(TRENDS_FILE)) {
      const data = JSON.parse(readFileSync(TRENDS_FILE, "utf-8"));
      dailyTrends = data.daily || [];
    }
  } catch { /* fresh start */ }
}

function saveTrends(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(TRENDS_FILE, JSON.stringify({ daily: dailyTrends.slice(-90) }, null, 2), "utf-8");
  } catch { /* ignore */ }
}

// Previous day's token counts for delta calculation
let prevDayTokens = { claude: 0, gemini: 0, claudeReq: 0, geminiReq: 0, messages: 0 };

function recordDailyMetrics(): void {
  const today = new Date().toISOString().slice(0, 10);

  // Calculate deltas since last recording
  const claudeTokensDelta = metrics.claude.totalTokens - prevDayTokens.claude;
  const geminiTokensDelta = metrics.gemini.totalTokens - prevDayTokens.gemini;
  const claudeReqDelta = metrics.claude.requestCount - prevDayTokens.claudeReq;
  const geminiReqDelta = metrics.gemini.requestCount - prevDayTokens.geminiReq;
  const messagesDelta = metrics.activity.messagesTotal - prevDayTokens.messages;

  const claudeCost = (claudeTokensDelta > 0 ? claudeTokensDelta * 0.000009 : 0); // rough avg
  const geminiCost = (geminiTokensDelta > 0 ? geminiTokensDelta * 0.0000002 : 0);

  const avgCpu = lastDailySnapshot.cpuSamples.length > 0
    ? Math.round(lastDailySnapshot.cpuSamples.reduce((a, b) => a + b, 0) / lastDailySnapshot.cpuSamples.length)
    : 0;
  const avgMem = lastDailySnapshot.memSamples.length > 0
    ? Math.round(lastDailySnapshot.memSamples.reduce((a, b) => a + b, 0) / lastDailySnapshot.memSamples.length)
    : 0;
  const peakCpu = lastDailySnapshot.cpuSamples.length > 0 ? Math.max(...lastDailySnapshot.cpuSamples) : 0;
  const peakMem = lastDailySnapshot.memSamples.length > 0 ? Math.max(...lastDailySnapshot.memSamples) : 0;

  const existing = dailyTrends.find(d => d.date === today);
  if (existing) {
    // Update today's entry
    existing.claudeTokens += claudeTokensDelta;
    existing.geminiTokens += geminiTokensDelta;
    existing.claudeRequests += claudeReqDelta;
    existing.geminiRequests += geminiReqDelta;
    existing.claudeCostUsd += claudeCost;
    existing.geminiCostUsd += geminiCost;
    existing.totalCostUsd = existing.claudeCostUsd + existing.geminiCostUsd;
    existing.messagesCount += messagesDelta;
    existing.avgCpuPercent = avgCpu;
    existing.avgMemoryPercent = avgMem;
    existing.peakCpuPercent = Math.max(existing.peakCpuPercent, peakCpu);
    existing.peakMemoryPercent = Math.max(existing.peakMemoryPercent, peakMem);
    existing.claudeAvgLatencyMs = metrics.claude.avgLatencyMs;
    existing.geminiAvgLatencyMs = metrics.gemini.avgLatencyMs;
  } else {
    dailyTrends.push({
      date: today,
      claudeTokens: claudeTokensDelta,
      geminiTokens: geminiTokensDelta,
      claudeRequests: claudeReqDelta,
      geminiRequests: geminiReqDelta,
      claudeCostUsd: claudeCost,
      geminiCostUsd: geminiCost,
      totalCostUsd: claudeCost + geminiCost,
      messagesCount: messagesDelta,
      avgCpuPercent: avgCpu,
      avgMemoryPercent: avgMem,
      peakCpuPercent: peakCpu,
      peakMemoryPercent: peakMem,
      claudeAvgLatencyMs: metrics.claude.avgLatencyMs,
      geminiAvgLatencyMs: metrics.gemini.avgLatencyMs,
    });
  }

  // Update prev counters
  prevDayTokens = {
    claude: metrics.claude.totalTokens,
    gemini: metrics.gemini.totalTokens,
    claudeReq: metrics.claude.requestCount,
    geminiReq: metrics.gemini.requestCount,
    messages: metrics.activity.messagesTotal,
  };

  // Reset CPU/mem samples for new day
  if (lastDailySnapshot.date !== today) {
    lastDailySnapshot = { date: today, cpuSamples: [], memSamples: [] };
  }

  saveTrends();
}

// --- Cost Budget ---
let budget: CostBudget = {
  dailyLimitUsd: 5.0,
  weeklyLimitUsd: 25.0,
  monthlyLimitUsd: 100.0,
  alertThreshold: 0.8,
  enabled: false,
};
const budgetAlerts: BudgetAlert[] = [];

function loadBudget(): void {
  try {
    if (existsSync(BUDGET_FILE)) {
      budget = { ...budget, ...JSON.parse(readFileSync(BUDGET_FILE, "utf-8")) };
    }
  } catch { /* defaults */ }
}

function saveBudget(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(BUDGET_FILE, JSON.stringify(budget, null, 2), "utf-8");
  } catch { /* ignore */ }
}

// Initialize on load
loadTrends();
loadBudget();

// Mutable metrics updated by external modules
const metrics = {
  claude: { enabled: false, model: "", inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, avgLatencyMs: 0, lastActiveAt: null as string | null },
  gemini: { enabled: false, model: "", inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, avgLatencyMs: 0, lastActiveAt: null as string | null },
  orchestrator: { totalTasks: 0, completedTasks: 0, failedTasks: 0 },
  connections: { mobileClients: 0, computerAgents: 0, totalConnections: 0 },
  activity: { messagesTotal: 0, messagesToday: 0, schedulesActive: 0, filesShared: 0, pluginsLoaded: 0, workflowsRun: 0, chainsRun: 0 },
};

function getCpuUsage(): number {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  for (const cpu of cpus) {
    for (const type of Object.values(cpu.times)) totalTick += type;
    totalIdle += cpu.times.idle;
  }
  return Math.round((1 - totalIdle / totalTick) * 100);
}

function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return { memoryUsed: used, memoryTotal: total, memoryPercent: Math.round((used / total) * 100) };
}

export function updateAgentMetrics(agent: "claude" | "gemini", data: Partial<AgentMetrics>): void {
  Object.assign(metrics[agent], data);
}

export function updateOrchestratorMetrics(data: Partial<typeof metrics.orchestrator>): void {
  Object.assign(metrics.orchestrator, data);
}

export function updateConnectionMetrics(data: Partial<typeof metrics.connections>): void {
  Object.assign(metrics.connections, data);
}

export function updateActivityMetrics(data: Partial<typeof metrics.activity>): void {
  Object.assign(metrics.activity, data);
}

export function incrementActivity(key: keyof typeof metrics.activity, amount = 1): void {
  metrics.activity[key] += amount;
}

export function takeSnapshot(): void {
  const mem = getMemoryInfo();
  snapshots.push({
    timestamp: new Date().toISOString(),
    cpuPercent: getCpuUsage(),
    memoryPercent: mem.memoryPercent,
    claudeTokens: metrics.claude.totalTokens,
    geminiTokens: metrics.gemini.totalTokens,
    connections: metrics.connections.totalConnections,
  });
  if (snapshots.length > MAX_SNAPSHOTS) snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS);
}

// Take snapshot every 5 minutes
setInterval(() => {
  takeSnapshot();
  // Collect CPU/mem samples for daily averages
  const today = new Date().toISOString().slice(0, 10);
  if (lastDailySnapshot.date !== today) {
    lastDailySnapshot = { date: today, cpuSamples: [], memSamples: [] };
  }
  lastDailySnapshot.cpuSamples.push(getCpuUsage());
  lastDailySnapshot.memSamples.push(getMemoryInfo().memoryPercent);
}, 5 * 60 * 1000);
// Take initial snapshot
setTimeout(takeSnapshot, 5000);
// Record daily metrics every 15 minutes
setInterval(recordDailyMetrics, 15 * 60 * 1000);
setTimeout(recordDailyMetrics, 30000);

const CLAUDE_INPUT_COST = 3.0 / 1_000_000;
const CLAUDE_OUTPUT_COST = 15.0 / 1_000_000;
const GEMINI_INPUT_COST = 0.075 / 1_000_000;
const GEMINI_OUTPUT_COST = 0.30 / 1_000_000;

export function getDashboard(): DashboardMetrics {
  const mem = getMemoryInfo();
  const cpus = os.cpus();

  const claudeUsd = (metrics.claude.inputTokens * CLAUDE_INPUT_COST) + (metrics.claude.outputTokens * CLAUDE_OUTPUT_COST);
  const geminiUsd = (metrics.gemini.inputTokens * GEMINI_INPUT_COST) + (metrics.gemini.outputTokens * GEMINI_OUTPUT_COST);

  return {
    uptime: Math.floor((Date.now() - startTime) / 1000),
    system: {
      cpuUsage: getCpuUsage(),
      ...mem,
      platform: os.platform(),
      hostname: os.hostname(),
      cpuModel: cpus[0]?.model || "unknown",
      cpuCores: cpus.length,
    },
    ai: {
      claude: { ...metrics.claude },
      gemini: { ...metrics.gemini },
      orchestrator: { ...metrics.orchestrator },
    },
    connections: { ...metrics.connections },
    activity: { ...metrics.activity },
    costs: {
      estimatedTotalUsd: claudeUsd + geminiUsd,
      claudeUsd,
      geminiUsd,
    },
    history: snapshots.slice(-50),
  };
}

// --- I1: Historical Trends API ---

export function getDailyTrends(days: number = 30): DailyMetrics[] {
  return dailyTrends.slice(-days);
}

export function getWeeklyTrends(weeks: number = 12): DailyMetrics[] {
  // Aggregate daily into weekly
  const weekly: DailyMetrics[] = [];
  const sorted = [...dailyTrends].sort((a, b) => a.date.localeCompare(b.date));

  for (let i = 0; i < sorted.length; i += 7) {
    const chunk = sorted.slice(i, i + 7);
    if (chunk.length === 0) continue;
    weekly.push({
      date: chunk[0].date, // week start
      claudeTokens: chunk.reduce((s, d) => s + d.claudeTokens, 0),
      geminiTokens: chunk.reduce((s, d) => s + d.geminiTokens, 0),
      claudeRequests: chunk.reduce((s, d) => s + d.claudeRequests, 0),
      geminiRequests: chunk.reduce((s, d) => s + d.geminiRequests, 0),
      claudeCostUsd: chunk.reduce((s, d) => s + d.claudeCostUsd, 0),
      geminiCostUsd: chunk.reduce((s, d) => s + d.geminiCostUsd, 0),
      totalCostUsd: chunk.reduce((s, d) => s + d.totalCostUsd, 0),
      messagesCount: chunk.reduce((s, d) => s + d.messagesCount, 0),
      avgCpuPercent: Math.round(chunk.reduce((s, d) => s + d.avgCpuPercent, 0) / chunk.length),
      avgMemoryPercent: Math.round(chunk.reduce((s, d) => s + d.avgMemoryPercent, 0) / chunk.length),
      peakCpuPercent: Math.max(...chunk.map(d => d.peakCpuPercent)),
      peakMemoryPercent: Math.max(...chunk.map(d => d.peakMemoryPercent)),
      claudeAvgLatencyMs: Math.round(chunk.reduce((s, d) => s + d.claudeAvgLatencyMs, 0) / chunk.length),
      geminiAvgLatencyMs: Math.round(chunk.reduce((s, d) => s + d.geminiAvgLatencyMs, 0) / chunk.length),
    });
  }

  return weekly.slice(-weeks);
}

// --- I2: Cost Budget ---

export function getBudget(): CostBudget & { alerts: BudgetAlert[] } {
  return { ...budget, alerts: budgetAlerts.slice(-20) };
}

export function setBudget(newBudget: Partial<CostBudget>): CostBudget {
  Object.assign(budget, newBudget);
  saveBudget();
  return budget;
}

export function checkBudgetAlerts(): BudgetAlert[] {
  if (!budget.enabled) return [];
  const newAlerts: BudgetAlert[] = [];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Current session costs
  const claudeUsd = (metrics.claude.inputTokens * CLAUDE_INPUT_COST) + (metrics.claude.outputTokens * CLAUDE_OUTPUT_COST);
  const geminiUsd = (metrics.gemini.inputTokens * GEMINI_INPUT_COST) + (metrics.gemini.outputTokens * GEMINI_OUTPUT_COST);
  const sessionCost = claudeUsd + geminiUsd;

  // Daily: today's trend + current session
  const todayTrend = dailyTrends.find(d => d.date === today);
  const dailyCost = (todayTrend?.totalCostUsd || 0) + sessionCost;
  if (dailyCost >= budget.dailyLimitUsd * budget.alertThreshold) {
    newAlerts.push({ type: "daily", currentUsd: dailyCost, limitUsd: budget.dailyLimitUsd, percent: dailyCost / budget.dailyLimitUsd, timestamp: now.toISOString() });
  }

  // Weekly: last 7 days
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const weeklyCost = dailyTrends.filter(d => d.date >= weekAgo).reduce((s, d) => s + d.totalCostUsd, 0) + sessionCost;
  if (weeklyCost >= budget.weeklyLimitUsd * budget.alertThreshold) {
    newAlerts.push({ type: "weekly", currentUsd: weeklyCost, limitUsd: budget.weeklyLimitUsd, percent: weeklyCost / budget.weeklyLimitUsd, timestamp: now.toISOString() });
  }

  // Monthly: last 30 days
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const monthlyCost = dailyTrends.filter(d => d.date >= monthAgo).reduce((s, d) => s + d.totalCostUsd, 0) + sessionCost;
  if (monthlyCost >= budget.monthlyLimitUsd * budget.alertThreshold) {
    newAlerts.push({ type: "monthly", currentUsd: monthlyCost, limitUsd: budget.monthlyLimitUsd, percent: monthlyCost / budget.monthlyLimitUsd, timestamp: now.toISOString() });
  }

  // Store alerts (dedup by type within 1 hour)
  for (const alert of newAlerts) {
    const recent = budgetAlerts.find(a => a.type === alert.type && new Date(a.timestamp).getTime() > now.getTime() - 3600000);
    if (!recent) budgetAlerts.push(alert);
  }
  if (budgetAlerts.length > 100) budgetAlerts.splice(0, budgetAlerts.length - 100);

  return newAlerts;
}

// --- I3: Model Comparison ---

export function getModelComparison(): ModelComparison[] {
  const claudeUsd = (metrics.claude.inputTokens * CLAUDE_INPUT_COST) + (metrics.claude.outputTokens * CLAUDE_OUTPUT_COST);
  const geminiUsd = (metrics.gemini.inputTokens * GEMINI_INPUT_COST) + (metrics.gemini.outputTokens * GEMINI_OUTPUT_COST);

  const models: ModelComparison[] = [];

  if (metrics.claude.enabled || metrics.claude.requestCount > 0) {
    models.push({
      model: metrics.claude.model || "claude-sonnet-4-20250514",
      provider: "claude",
      totalTokens: metrics.claude.totalTokens,
      requestCount: metrics.claude.requestCount,
      avgLatencyMs: metrics.claude.avgLatencyMs,
      costPerRequest: metrics.claude.requestCount > 0 ? claudeUsd / metrics.claude.requestCount : 0,
      costPer1kTokens: metrics.claude.totalTokens > 0 ? (claudeUsd / metrics.claude.totalTokens) * 1000 : 0,
      totalCostUsd: claudeUsd,
      successRate: metrics.orchestrator.totalTasks > 0 ? metrics.orchestrator.completedTasks / metrics.orchestrator.totalTasks : 1,
      enabled: metrics.claude.enabled,
    });
  }

  if (metrics.gemini.enabled || metrics.gemini.requestCount > 0) {
    models.push({
      model: metrics.gemini.model || "gemini-2.0-flash",
      provider: "gemini",
      totalTokens: metrics.gemini.totalTokens,
      requestCount: metrics.gemini.requestCount,
      avgLatencyMs: metrics.gemini.avgLatencyMs,
      costPerRequest: metrics.gemini.requestCount > 0 ? geminiUsd / metrics.gemini.requestCount : 0,
      costPer1kTokens: metrics.gemini.totalTokens > 0 ? (geminiUsd / metrics.gemini.totalTokens) * 1000 : 0,
      totalCostUsd: geminiUsd,
      successRate: 1,
      enabled: metrics.gemini.enabled,
    });
  }

  return models;
}

// --- I4: CSV Export ---

export function exportMetricsCsv(): string {
  const lines: string[] = [];

  // Header
  lines.push("date,claude_tokens,gemini_tokens,claude_requests,gemini_requests,claude_cost_usd,gemini_cost_usd,total_cost_usd,messages,avg_cpu_pct,avg_mem_pct,peak_cpu_pct,peak_mem_pct,claude_latency_ms,gemini_latency_ms");

  // Daily data
  for (const d of dailyTrends) {
    lines.push([
      d.date,
      d.claudeTokens,
      d.geminiTokens,
      d.claudeRequests,
      d.geminiRequests,
      d.claudeCostUsd.toFixed(6),
      d.geminiCostUsd.toFixed(6),
      d.totalCostUsd.toFixed(6),
      d.messagesCount,
      d.avgCpuPercent,
      d.avgMemoryPercent,
      d.peakCpuPercent,
      d.peakMemoryPercent,
      d.claudeAvgLatencyMs,
      d.geminiAvgLatencyMs,
    ].join(","));
  }

  return lines.join("\n");
}

export function exportSnapshotsCsv(): string {
  const lines: string[] = [];
  lines.push("timestamp,cpu_pct,memory_pct,claude_tokens,gemini_tokens,connections");
  for (const s of snapshots) {
    lines.push([s.timestamp, s.cpuPercent, s.memoryPercent, s.claudeTokens, s.geminiTokens, s.connections].join(","));
  }
  return lines.join("\n");
}
