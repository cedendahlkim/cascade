/**
 * Task Scheduler — Cron-based task scheduling for Cascade Remote
 * 
 * Allows AI agents to schedule recurring or one-time tasks.
 * Results are sent as notifications to connected mobile/web clients.
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEDULES_FILE = join(__dirname, "..", "data", "schedules.json");

export interface ScheduleEntry {
  id: string;
  name: string;
  description: string;
  cron?: string;
  intervalMs?: number;
  runAt?: string;
  action: ScheduleAction;
  enabled: boolean;
  createdAt: string;
  lastRunAt: string | null;
  lastResult: string | null;
  lastError: string | null;
  runCount: number;
  errorCount: number;
  tags: string[];
}

export interface ScheduleAction {
  type: "ai_prompt" | "command" | "http_request" | "notification";
  /** For ai_prompt: the prompt to send to the AI */
  prompt?: string;
  /** For command: shell command to run */
  command?: string;
  /** For http_request: URL and method */
  url?: string;
  method?: string;
  body?: string;
  /** For notification: message to send */
  message?: string;
  /** Which AI agent to use (claude, gemini) */
  agent?: string;
  /** Target computer ID (for multi-computer) */
  computerId?: string;
}

export interface ScheduleResult {
  scheduleId: string;
  scheduleName: string;
  result: string;
  error: string | null;
  executedAt: string;
  durationMs: number;
}

export type ScheduleExecutor = (action: ScheduleAction) => Promise<string>;
export type ScheduleNotifier = (result: ScheduleResult) => void;

// --- Cron parser (simple subset) ---

interface CronFields {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}

function parseCronField(field: string, min: number, max: number): number[] {
  if (field === "*") {
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  const values: number[] = [];

  for (const part of field.split(",")) {
    // Handle step: */5 or 1-10/2
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    if (stepMatch) {
      const step = parseInt(stepMatch[2], 10);
      let range: number[];
      if (stepMatch[1] === "*") {
        range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      } else {
        const [start, end] = stepMatch[1].split("-").map(Number);
        range = Array.from({ length: (end || max) - start + 1 }, (_, i) => start + i);
      }
      for (let i = 0; i < range.length; i += step) {
        values.push(range[i]);
      }
      continue;
    }

    // Handle range: 1-5
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i++) {
        values.push(i);
      }
      continue;
    }

    // Single value
    const val = parseInt(part, 10);
    if (!isNaN(val) && val >= min && val <= max) {
      values.push(val);
    }
  }

  return values;
}

function parseCron(expression: string): CronFields {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: "${expression}" (expected 5 fields)`);
  }
  return {
    minute: parseCronField(parts[0], 0, 59),
    hour: parseCronField(parts[1], 0, 23),
    dayOfMonth: parseCronField(parts[2], 1, 31),
    month: parseCronField(parts[3], 1, 12),
    dayOfWeek: parseCronField(parts[4], 0, 6),
  };
}

function cronMatches(fields: CronFields, date: Date): boolean {
  return (
    fields.minute.includes(date.getMinutes()) &&
    fields.hour.includes(date.getHours()) &&
    fields.dayOfMonth.includes(date.getDate()) &&
    fields.month.includes(date.getMonth() + 1) &&
    fields.dayOfWeek.includes(date.getDay())
  );
}

// --- Scheduler ---

const schedules: Map<string, ScheduleEntry> = new Map();
const results: ScheduleResult[] = [];
let executor: ScheduleExecutor | null = null;
let notifier: ScheduleNotifier | null = null;
let tickInterval: ReturnType<typeof setInterval> | null = null;
const intervalTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
const oneTimeTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

function loadSchedules(): void {
  try {
    if (existsSync(SCHEDULES_FILE)) {
      const data = JSON.parse(readFileSync(SCHEDULES_FILE, "utf-8"));
      for (const entry of data.schedules || []) {
        schedules.set(entry.id, entry);
      }
      console.log(`[scheduler] Loaded ${schedules.size} schedule(s)`);
    }
  } catch { /* fresh start */ }
}

function saveSchedules(): void {
  try {
    const dir = dirname(SCHEDULES_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(SCHEDULES_FILE, JSON.stringify({
      schedules: Array.from(schedules.values()),
    }, null, 2), "utf-8");
  } catch (err) {
    console.error("[scheduler] Failed to save:", err);
  }
}

loadSchedules();

async function executeSchedule(entry: ScheduleEntry): Promise<void> {
  if (!executor) return;

  const start = Date.now();
  try {
    const result = await executor(entry.action);
    const duration = Date.now() - start;

    entry.lastRunAt = new Date().toISOString();
    entry.lastResult = result.slice(0, 2000);
    entry.lastError = null;
    entry.runCount++;
    saveSchedules();

    const schedResult: ScheduleResult = {
      scheduleId: entry.id,
      scheduleName: entry.name,
      result: result.slice(0, 2000),
      error: null,
      executedAt: entry.lastRunAt,
      durationMs: duration,
    };
    results.push(schedResult);
    if (results.length > 500) results.splice(0, results.length - 500);

    if (notifier) notifier(schedResult);
    console.log(`[scheduler] Executed "${entry.name}": ${result.slice(0, 100)}`);
  } catch (err) {
    const duration = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);

    entry.lastRunAt = new Date().toISOString();
    entry.lastError = errorMsg;
    entry.errorCount++;
    saveSchedules();

    const schedResult: ScheduleResult = {
      scheduleId: entry.id,
      scheduleName: entry.name,
      result: "",
      error: errorMsg,
      executedAt: entry.lastRunAt,
      durationMs: duration,
    };
    results.push(schedResult);
    if (notifier) notifier(schedResult);
    console.error(`[scheduler] Error in "${entry.name}":`, errorMsg);
  }
}

function setupIntervalTimer(entry: ScheduleEntry): void {
  if (!entry.intervalMs || entry.intervalMs < 5000) return;
  // Clear existing
  const existing = intervalTimers.get(entry.id);
  if (existing) clearInterval(existing);

  const timer = setInterval(() => {
    if (entry.enabled) executeSchedule(entry);
  }, entry.intervalMs);
  intervalTimers.set(entry.id, timer);
}

function setupOneTimeTimer(entry: ScheduleEntry): void {
  if (!entry.runAt) return;
  const existing = oneTimeTimers.get(entry.id);
  if (existing) clearTimeout(existing);

  const delay = new Date(entry.runAt).getTime() - Date.now();
  if (delay <= 0) return; // Already passed

  const timer = setTimeout(() => {
    if (entry.enabled) {
      executeSchedule(entry);
      entry.enabled = false; // One-time, disable after run
      saveSchedules();
    }
    oneTimeTimers.delete(entry.id);
  }, delay);
  oneTimeTimers.set(entry.id, timer);
}

// --- Public API ---

export function initScheduler(exec: ScheduleExecutor, notify: ScheduleNotifier): void {
  executor = exec;
  notifier = notify;

  // Cron tick: check every 60 seconds
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(() => {
    const now = new Date();
    for (const entry of schedules.values()) {
      if (!entry.enabled || !entry.cron) continue;
      try {
        const fields = parseCron(entry.cron);
        if (cronMatches(fields, now)) {
          executeSchedule(entry);
        }
      } catch (err) {
        console.error(`[scheduler] Invalid cron for "${entry.name}":`, err);
      }
    }
  }, 60_000);

  // Setup interval and one-time timers for existing schedules
  for (const entry of schedules.values()) {
    if (entry.enabled && entry.intervalMs) setupIntervalTimer(entry);
    if (entry.enabled && entry.runAt) setupOneTimeTimer(entry);
  }

  console.log(`[scheduler] Initialized with ${schedules.size} schedule(s)`);
}

export function createSchedule(
  name: string,
  description: string,
  action: ScheduleAction,
  options: {
    cron?: string;
    intervalMs?: number;
    runAt?: string;
    tags?: string[];
  } = {},
): ScheduleEntry {
  const entry: ScheduleEntry = {
    id: uuidv4(),
    name,
    description,
    cron: options.cron,
    intervalMs: options.intervalMs,
    runAt: options.runAt,
    action,
    enabled: true,
    createdAt: new Date().toISOString(),
    lastRunAt: null,
    lastResult: null,
    lastError: null,
    runCount: 0,
    errorCount: 0,
    tags: options.tags || [],
  };

  schedules.set(entry.id, entry);
  saveSchedules();

  if (entry.intervalMs) setupIntervalTimer(entry);
  if (entry.runAt) setupOneTimeTimer(entry);

  console.log(`[scheduler] Created schedule: "${name}" (${entry.id})`);
  return entry;
}

export function updateSchedule(
  id: string,
  updates: Partial<Pick<ScheduleEntry, "name" | "description" | "cron" | "intervalMs" | "runAt" | "action" | "enabled" | "tags">>,
): ScheduleEntry | null {
  const entry = schedules.get(id);
  if (!entry) return null;

  Object.assign(entry, updates);
  saveSchedules();

  // Re-setup timers if timing changed
  if (updates.intervalMs !== undefined || updates.enabled !== undefined) {
    const existing = intervalTimers.get(id);
    if (existing) clearInterval(existing);
    intervalTimers.delete(id);
    if (entry.enabled && entry.intervalMs) setupIntervalTimer(entry);
  }
  if (updates.runAt !== undefined || updates.enabled !== undefined) {
    const existing = oneTimeTimers.get(id);
    if (existing) clearTimeout(existing);
    oneTimeTimers.delete(id);
    if (entry.enabled && entry.runAt) setupOneTimeTimer(entry);
  }

  return entry;
}

export function deleteSchedule(id: string): boolean {
  const timer1 = intervalTimers.get(id);
  if (timer1) clearInterval(timer1);
  intervalTimers.delete(id);

  const timer2 = oneTimeTimers.get(id);
  if (timer2) clearTimeout(timer2);
  oneTimeTimers.delete(id);

  const ok = schedules.delete(id);
  if (ok) saveSchedules();
  return ok;
}

export function getSchedule(id: string): ScheduleEntry | undefined {
  return schedules.get(id);
}

export function listSchedules(): ScheduleEntry[] {
  return Array.from(schedules.values());
}

export function getScheduleResults(scheduleId?: string, limit = 50): ScheduleResult[] {
  const filtered = scheduleId
    ? results.filter(r => r.scheduleId === scheduleId)
    : results;
  return filtered.slice(-limit);
}

export function runScheduleNow(id: string): boolean {
  const entry = schedules.get(id);
  if (!entry) return false;
  executeSchedule(entry);
  return true;
}
