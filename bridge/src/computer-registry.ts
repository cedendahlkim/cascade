/**
 * Computer Registry — Multi-computer support for Cascade Remote
 * 
 * Allows registering multiple computers that AI agents can use.
 * Each computer runs a lightweight agent that connects via Socket.IO.
 * The AI can route tasks to specific computers based on capabilities.
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_FILE = join(__dirname, "..", "data", "computers.json");

export interface ComputerCapabilities {
  os: string;           // "windows", "macos", "linux"
  arch: string;         // "x64", "arm64"
  hasGpu: boolean;
  gpuName?: string;
  ramGb: number;
  cpuCores: number;
  cpuModel?: string;
  hostname: string;
  username: string;
  tools: string[];      // available tools: "desktop", "filesystem", "command", "process"
}

export interface Computer {
  id: string;
  name: string;
  description: string;
  capabilities: ComputerCapabilities;
  status: "online" | "offline" | "busy" | "error";
  socketId: string | null;
  lastSeen: string;
  registeredAt: string;
  tags: string[];
  taskCount: number;
  errorCount: number;
  avgLatencyMs: number;
}

export interface ComputerTask {
  id: string;
  computerId: string;
  type: "command" | "screenshot" | "file_read" | "file_write" | "desktop_action" | "system_info" | "custom";
  payload: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed" | "timeout";
  result: string | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  timeoutMs: number;
}

// Pending task resolvers
interface PendingTask {
  task: ComputerTask;
  resolve: (result: string) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const computers: Map<string, Computer> = new Map();
const pendingTasks: Map<string, PendingTask> = new Map();
const taskHistory: ComputerTask[] = [];

// Load persisted registry
function loadRegistry(): void {
  try {
    if (existsSync(REGISTRY_FILE)) {
      const data = JSON.parse(readFileSync(REGISTRY_FILE, "utf-8"));
      for (const comp of data.computers || []) {
        comp.status = "offline";
        comp.socketId = null;
        computers.set(comp.id, comp);
      }
      console.log(`[computers] Loaded ${computers.size} registered computer(s)`);
    }
  } catch { /* fresh start */ }
}

function saveRegistry(): void {
  try {
    const dir = dirname(REGISTRY_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const data = {
      computers: Array.from(computers.values()).map(c => ({
        ...c,
        socketId: null, // Don't persist socket IDs
      })),
    };
    writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[computers] Failed to save registry:", err);
  }
}

loadRegistry();

// --- Public API ---

export function registerComputer(
  name: string,
  description: string,
  capabilities: ComputerCapabilities,
  tags: string[] = [],
): Computer {
  // Check if computer with same hostname already exists
  const existing = Array.from(computers.values()).find(
    c => c.capabilities.hostname === capabilities.hostname
  );
  if (existing) {
    // Update existing
    existing.name = name;
    existing.description = description;
    existing.capabilities = capabilities;
    existing.tags = tags;
    saveRegistry();
    console.log(`[computers] Updated computer: ${name} (${existing.id})`);
    return existing;
  }

  const computer: Computer = {
    id: uuidv4(),
    name,
    description,
    capabilities,
    status: "offline",
    socketId: null,
    lastSeen: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    tags,
    taskCount: 0,
    errorCount: 0,
    avgLatencyMs: 0,
  };
  computers.set(computer.id, computer);
  saveRegistry();
  console.log(`[computers] Registered new computer: ${name} (${computer.id})`);
  return computer;
}

export function unregisterComputer(id: string): boolean {
  const ok = computers.delete(id);
  if (ok) saveRegistry();
  return ok;
}

export function getComputer(id: string): Computer | undefined {
  return computers.get(id);
}

export function getComputerByName(name: string): Computer | undefined {
  return Array.from(computers.values()).find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
}

export function listComputers(): Computer[] {
  return Array.from(computers.values());
}

export function getOnlineComputers(): Computer[] {
  return Array.from(computers.values()).filter(c => c.status === "online");
}

export function setComputerOnline(id: string, socketId: string): Computer | undefined {
  const comp = computers.get(id);
  if (comp) {
    comp.status = "online";
    comp.socketId = socketId;
    comp.lastSeen = new Date().toISOString();
    saveRegistry();
  }
  return comp;
}

export function setComputerOffline(id: string): void {
  const comp = computers.get(id);
  if (comp) {
    comp.status = "offline";
    comp.socketId = null;
    comp.lastSeen = new Date().toISOString();
    saveRegistry();
  }
}

export function findComputerBySocket(socketId: string): Computer | undefined {
  return Array.from(computers.values()).find(c => c.socketId === socketId);
}

export function updateComputerCapabilities(id: string, capabilities: Partial<ComputerCapabilities>): Computer | undefined {
  const comp = computers.get(id);
  if (comp) {
    comp.capabilities = { ...comp.capabilities, ...capabilities };
    saveRegistry();
  }
  return comp;
}

// --- Task execution ---

export function createTask(
  computerId: string,
  type: ComputerTask["type"],
  payload: Record<string, unknown>,
  timeoutMs = 30000,
): ComputerTask {
  const task: ComputerTask = {
    id: uuidv4(),
    computerId,
    type,
    payload,
    status: "pending",
    result: null,
    error: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    timeoutMs,
  };
  taskHistory.push(task);
  if (taskHistory.length > 500) taskHistory.splice(0, taskHistory.length - 500);
  return task;
}

export function submitTask(task: ComputerTask): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      task.status = "timeout";
      task.error = "Task timed out";
      task.completedAt = new Date().toISOString();
      pendingTasks.delete(task.id);
      reject(new Error(`Task ${task.id} timed out after ${task.timeoutMs}ms`));
    }, task.timeoutMs);

    pendingTasks.set(task.id, { task, resolve, reject, timer });
  });
}

export function resolveTask(taskId: string, result: string): boolean {
  const pending = pendingTasks.get(taskId);
  if (!pending) return false;

  clearTimeout(pending.timer);
  pending.task.status = "completed";
  pending.task.result = result;
  pending.task.completedAt = new Date().toISOString();
  pendingTasks.delete(taskId);

  // Update computer stats
  const comp = computers.get(pending.task.computerId);
  if (comp) {
    comp.taskCount++;
    const latency = Date.now() - new Date(pending.task.createdAt).getTime();
    comp.avgLatencyMs = comp.taskCount === 1
      ? latency
      : comp.avgLatencyMs * 0.8 + latency * 0.2;
    comp.lastSeen = new Date().toISOString();
  }

  pending.resolve(result);
  return true;
}

export function rejectTask(taskId: string, error: string): boolean {
  const pending = pendingTasks.get(taskId);
  if (!pending) return false;

  clearTimeout(pending.timer);
  pending.task.status = "failed";
  pending.task.error = error;
  pending.task.completedAt = new Date().toISOString();
  pendingTasks.delete(taskId);

  // Update computer stats
  const comp = computers.get(pending.task.computerId);
  if (comp) {
    comp.taskCount++;
    comp.errorCount++;
  }

  pending.reject(new Error(error));
  return true;
}

export function getTaskHistory(computerId?: string, limit = 50): ComputerTask[] {
  const filtered = computerId
    ? taskHistory.filter(t => t.computerId === computerId)
    : taskHistory;
  return filtered.slice(-limit);
}

// --- Smart routing ---

export function selectBestComputer(
  taskType: ComputerTask["type"],
  preferredTags?: string[],
): Computer | null {
  const online = getOnlineComputers();
  if (online.length === 0) return null;

  const scored = online.map(comp => {
    let score = 50; // base

    // Tool availability
    if (taskType === "screenshot" && comp.capabilities.tools.includes("desktop")) score += 20;
    if (taskType === "command" && comp.capabilities.tools.includes("command")) score += 20;
    if (taskType === "file_read" && comp.capabilities.tools.includes("filesystem")) score += 20;
    if (taskType === "file_write" && comp.capabilities.tools.includes("filesystem")) score += 20;
    if (taskType === "desktop_action" && comp.capabilities.tools.includes("desktop")) score += 20;

    // Performance
    if (comp.avgLatencyMs > 0) score += Math.max(0, 15 - comp.avgLatencyMs / 1000);
    if (comp.taskCount > 0) {
      const successRate = 1 - (comp.errorCount / comp.taskCount);
      score += successRate * 15;
    }

    // Tag matching
    if (preferredTags) {
      const matchCount = preferredTags.filter(t => comp.tags.includes(t)).length;
      score += matchCount * 10;
    }

    // Busy penalty
    if (comp.status === "busy") score -= 30;

    // Hardware bonuses
    if (comp.capabilities.hasGpu) score += 5;
    if (comp.capabilities.ramGb >= 16) score += 5;

    return { computer: comp, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.computer || null;
}
