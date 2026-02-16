/**
 * Multi-LLM Orchestrator - Adaptive Coordinator-Worker Architecture
 * 
 * Designed by Claude & Gemini in Research Lab session.
 * Implements:
 * - Coordinator that routes tasks to best available worker
 * - 4 worker slots (Claude, Gemini, + 2 extensible)
 * - Health monitoring per worker (latency, success rate, tokens, cost)
 * - Dynamic load balancing based on worker health
 * - Consensus engine for cross-validation
 * - Fallback mechanisms between workers
 * - Cross-worker learning (performance history per task type)
 * - Bias detection via consensus divergence analysis
 * - Wake-on-demand (only activate needed workers)
 * - Role-based access control (MCP-router concept)
 * - Security audit logging of all LLM interactions
 * - Evaluation metrics for system performance
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIT_FILE = join(__dirname, "..", "data", "orchestrator-audit.json");
const LEARNING_FILE = join(__dirname, "..", "data", "worker-learning.json");

// --- Types ---

export type WorkerRole = "analyst" | "researcher" | "verifier" | "generalist" | "innovator";
export type WorkerStatus = "online" | "offline" | "busy" | "error" | "rate_limited";
export type TaskStatus = "queued" | "assigned" | "in_progress" | "consensus" | "completed" | "failed";
export type TaskPriority = "low" | "normal" | "high" | "critical";

export interface WorkerHealth {
  avgLatencyMs: number;
  successRate: number;       // 0-1
  totalRequests: number;
  failedRequests: number;
  totalTokens: number;
  estimatedCostUsd: number;
  lastResponseMs: number;
  lastError: string | null;
  lastActiveAt: string | null;
  uptime: number;            // seconds since last restart
}

export interface Worker {
  id: string;
  name: string;
  model: string;
  provider: "anthropic" | "google" | "openai" | "ollama" | "custom";
  role: WorkerRole;
  status: WorkerStatus;
  enabled: boolean;
  health: WorkerHealth;
  capabilities: string[];    // e.g. ["code", "analysis", "web_search", "vision"]
  maxConcurrent: number;
  activeTasks: number;
}

export interface Task {
  id: string;
  type: "research" | "analysis" | "code" | "review" | "general" | "consensus";
  prompt: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedWorkers: string[];  // worker IDs
  results: TaskResult[];
  consensusResult: string | null;
  consensusScore: number | null;  // 0-1 agreement level
  createdAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface TaskResult {
  workerId: string;
  workerName: string;
  response: string;
  latencyMs: number;
  tokens: number;
  confidence: number;  // 0-1 self-reported confidence
  timestamp: string;
}

export interface OrchestratorStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgLatencyMs: number;
  totalTokens: number;
  estimatedCostUsd: number;
  consensusAccuracy: number;
  uptimeSeconds: number;
  biasAlerts: number;
  crossWorkerLearnings: number;
  evaluationScore: number;  // 0-100 overall system health
}

// Cross-worker learning: tracks which worker performs best per task type
export interface WorkerLearning {
  workerId: string;
  taskType: string;
  avgLatencyMs: number;
  avgConfidence: number;
  successCount: number;
  failCount: number;
  lastUpdated: string;
}

// Bias detection result
export interface BiasAlert {
  taskId: string;
  timestamp: string;
  divergenceScore: number;  // 0-1, higher = more disagreement
  workers: { id: string; name: string; keyDifference: string }[];
  resolved: boolean;
}

// Security audit entry for LLM interactions
export interface AuditEntry {
  timestamp: string;
  workerId: string;
  workerName: string;
  action: "task_assigned" | "task_completed" | "task_failed" | "access_denied" | "bias_detected" | "worker_toggled" | "consensus_run";
  taskId?: string;
  taskType?: string;
  latencyMs?: number;
  tokens?: number;
  details?: string;
}

// Role-based access: which task types each role can handle
const ROLE_PERMISSIONS: Record<string, string[]> = {
  analyst: ["analysis", "code", "review", "general", "consensus"],
  researcher: ["research", "general", "analysis", "consensus"],
  verifier: ["review", "consensus", "analysis"],
  generalist: ["general", "code", "research", "analysis", "review"],
};

// --- Callbacks ---
export type TaskUpdateCallback = (task: Task) => void;
export type WorkerUpdateCallback = (worker: Worker) => void;
export type RespondFn = (prompt: string) => Promise<string>;

// --- Orchestrator ---

export class LLMOrchestrator {
  private workers: Map<string, Worker> = new Map();
  private respondFns: Map<string, RespondFn> = new Map();
  private tasks: Task[] = [];
  private taskCallbacks: TaskUpdateCallback[] = [];
  private workerCallbacks: WorkerUpdateCallback[] = [];
  private startedAt: number = Date.now();
  private learnings: WorkerLearning[] = [];
  private biasAlerts: BiasAlert[] = [];
  private auditLog: AuditEntry[] = [];

  constructor() {
    this.loadLearnings();
  }

  private loadLearnings(): void {
    try {
      if (existsSync(LEARNING_FILE)) {
        const data = JSON.parse(readFileSync(LEARNING_FILE, "utf-8"));
        this.learnings = data.learnings || [];
        this.biasAlerts = data.biasAlerts || [];
      }
    } catch { /* fresh start */ }
  }

  private saveLearnings(): void {
    try {
      writeFileSync(LEARNING_FILE, JSON.stringify({
        learnings: this.learnings,
        biasAlerts: this.biasAlerts.slice(-100),
      }, null, 2), "utf-8");
    } catch (err) {
      console.error("[orchestrator] Failed to save learnings:", err);
    }
  }

  private audit(entry: Omit<AuditEntry, "timestamp">): void {
    const full: AuditEntry = { ...entry, timestamp: new Date().toISOString() };
    this.auditLog.push(full);
    if (this.auditLog.length > 500) this.auditLog = this.auditLog.slice(-500);
    // Persist periodically (every 10 entries)
    if (this.auditLog.length % 10 === 0) {
      try {
        writeFileSync(AUDIT_FILE, JSON.stringify(this.auditLog.slice(-200), null, 2), "utf-8");
      } catch { /* non-critical */ }
    }
  }

  // Cost estimates per 1M tokens (input+output avg)
  private costPer1MTokens: Record<string, number> = {
    anthropic: 6.0,   // Claude Sonnet ~$3 in + $15 out, avg ~$6
    google: 0.5,      // Gemini Flash very cheap
    openai: 5.0,      // GPT-4o ~$2.5 in + $10 out
    ollama: 0,        // Local = free
    custom: 1.0,
  };

  registerWorker(
    id: string,
    name: string,
    model: string,
    provider: Worker["provider"],
    role: WorkerRole,
    respondFn: RespondFn,
    capabilities: string[] = [],
    enabled = true,
  ): Worker {
    const worker: Worker = {
      id,
      name,
      model,
      provider,
      role,
      status: enabled ? "online" : "offline",
      enabled,
      health: {
        avgLatencyMs: 0,
        successRate: 1,
        totalRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        lastResponseMs: 0,
        lastError: null,
        lastActiveAt: null,
        uptime: 0,
      },
      capabilities,
      maxConcurrent: 1,
      activeTasks: 0,
    };
    this.workers.set(id, worker);
    this.respondFns.set(id, respondFn);
    console.log(`[orchestrator] Registered worker: ${name} (${model}) as ${role}`);
    return worker;
  }

  onTaskUpdate(cb: TaskUpdateCallback): void {
    this.taskCallbacks.push(cb);
  }

  onWorkerUpdate(cb: WorkerUpdateCallback): void {
    this.workerCallbacks.push(cb);
  }

  private emitTask(task: Task): void {
    for (const cb of this.taskCallbacks) cb(task);
  }

  private emitWorker(worker: Worker): void {
    for (const cb of this.workerCallbacks) cb(worker);
  }

  // --- Role-based Access Control (MCP-router concept) ---

  private canWorkerHandleTask(worker: Worker, taskType: string): boolean {
    const allowed = ROLE_PERMISSIONS[worker.role] || [];
    return allowed.includes(taskType);
  }

  // --- Dynamic Load Balancing with Cross-Worker Learning ---

  private selectBestWorker(taskType: string, excludeIds: string[] = []): Worker | null {
    const available = Array.from(this.workers.values()).filter(w =>
      w.enabled &&
      w.status === "online" &&
      w.activeTasks < w.maxConcurrent &&
      !excludeIds.includes(w.id) &&
      this.canWorkerHandleTask(w, taskType)  // Role-based access check
    );

    if (available.length === 0) {
      // Fallback: ignore role restrictions if no worker matches
      const fallback = Array.from(this.workers.values()).filter(w =>
        w.enabled && w.status === "online" && w.activeTasks < w.maxConcurrent && !excludeIds.includes(w.id)
      );
      if (fallback.length === 0) return null;
      return this.scoreWorkers(fallback, taskType);
    }

    return this.scoreWorkers(available, taskType);
  }

  private scoreWorkers(workers: Worker[], taskType: string): Worker | null {
    const scored = workers.map(w => {
      let score = 0;

      // Role match bonus
      if (taskType === "analysis" && w.role === "analyst") score += 30;
      if (taskType === "research" && w.role === "researcher") score += 30;
      if (taskType === "review" && w.role === "verifier") score += 30;
      if (taskType === "code" && w.capabilities.includes("code")) score += 20;

      // Health-based scoring
      score += w.health.successRate * 40;
      score += Math.max(0, 20 - (w.health.avgLatencyMs / 1000));
      score += (1 - (w.activeTasks / w.maxConcurrent)) * 10;

      // Cross-worker learning bonus: historical performance for this task type
      const learning = this.learnings.find(l => l.workerId === w.id && l.taskType === taskType);
      if (learning && learning.successCount > 0) {
        score += learning.avgConfidence * 15;  // Up to 15 pts for historical confidence
        score += (learning.successCount / (learning.successCount + learning.failCount)) * 10; // Up to 10 pts
      }

      return { worker: w, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.worker || null;
  }

  // --- Execute task on a single worker ---

  private async executeOnWorker(worker: Worker, prompt: string): Promise<TaskResult> {
    const respondFn = this.respondFns.get(worker.id);
    if (!respondFn) throw new Error(`No respond function for worker ${worker.id}`);

    worker.activeTasks++;
    worker.status = "busy";
    this.emitWorker(worker);

    const start = Date.now();
    try {
      const response = await respondFn(prompt);
      const latencyMs = Date.now() - start;
      const estimatedTokens = Math.ceil((prompt.length + response.length) / 4);

      // Update health
      worker.health.totalRequests++;
      worker.health.lastResponseMs = latencyMs;
      worker.health.avgLatencyMs = worker.health.totalRequests === 1
        ? latencyMs
        : (worker.health.avgLatencyMs * 0.8) + (latencyMs * 0.2); // Exponential moving average
      worker.health.successRate = (worker.health.totalRequests - worker.health.failedRequests) / worker.health.totalRequests;
      worker.health.totalTokens += estimatedTokens;
      worker.health.estimatedCostUsd += (estimatedTokens / 1_000_000) * (this.costPer1MTokens[worker.provider] || 1);
      worker.health.lastActiveAt = new Date().toISOString();
      worker.health.lastError = null;

      worker.activeTasks--;
      worker.status = "online";
      this.emitWorker(worker);

      // Extract confidence from response if present
      let confidence = 0.7; // default
      const confMatch = response.match(/\[CONFIDENCE:\s*([\d.]+)\]/i);
      if (confMatch) confidence = Math.min(1, Math.max(0, parseFloat(confMatch[1])));

      // Audit log
      this.audit({
        workerId: worker.id, workerName: worker.name,
        action: "task_completed", latencyMs, tokens: estimatedTokens,
      });

      return {
        workerId: worker.id,
        workerName: worker.name,
        response,
        latencyMs,
        tokens: estimatedTokens,
        confidence,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      worker.health.totalRequests++;
      worker.health.failedRequests++;
      worker.health.successRate = (worker.health.totalRequests - worker.health.failedRequests) / worker.health.totalRequests;
      worker.health.lastError = err instanceof Error ? err.message : String(err);
      worker.health.lastResponseMs = latencyMs;

      worker.activeTasks--;
      worker.status = worker.health.failedRequests > 3 ? "error" : "online";
      this.emitWorker(worker);

      this.audit({
        workerId: worker.id, workerName: worker.name,
        action: "task_failed", latencyMs,
        details: err instanceof Error ? err.message : String(err),
      });

      throw err;
    }
  }

  // --- Cross-Worker Learning ---

  private recordLearning(workerId: string, taskType: string, latencyMs: number, confidence: number, success: boolean): void {
    let learning = this.learnings.find(l => l.workerId === workerId && l.taskType === taskType);
    if (!learning) {
      learning = {
        workerId, taskType,
        avgLatencyMs: 0, avgConfidence: 0,
        successCount: 0, failCount: 0,
        lastUpdated: new Date().toISOString(),
      };
      this.learnings.push(learning);
    }

    if (success) {
      learning.successCount++;
      // Exponential moving average
      learning.avgLatencyMs = learning.successCount === 1
        ? latencyMs
        : learning.avgLatencyMs * 0.7 + latencyMs * 0.3;
      learning.avgConfidence = learning.successCount === 1
        ? confidence
        : learning.avgConfidence * 0.7 + confidence * 0.3;
    } else {
      learning.failCount++;
    }
    learning.lastUpdated = new Date().toISOString();
    this.saveLearnings();
  }

  // --- Bias Detection ---

  private detectBias(task: Task): BiasAlert | null {
    if (task.results.length < 2) return null;

    // Compare response lengths and confidence as proxy for divergence
    const lengths = task.results.map(r => r.response.length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const lenVariance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length;
    const lenStdDev = Math.sqrt(lenVariance);

    const confidences = task.results.map(r => r.confidence);
    const confRange = Math.max(...confidences) - Math.min(...confidences);

    // High divergence if responses differ significantly in length or confidence
    const divergenceScore = Math.min(1, (lenStdDev / Math.max(avgLen, 1)) * 0.6 + confRange * 0.4);

    if (divergenceScore > 0.4) {
      const alert: BiasAlert = {
        taskId: task.id,
        timestamp: new Date().toISOString(),
        divergenceScore,
        workers: task.results.map(r => ({
          id: r.workerId,
          name: r.workerName,
          keyDifference: `${r.response.length} chars, ${(r.confidence * 100).toFixed(0)}% conf`,
        })),
        resolved: false,
      };
      this.biasAlerts.push(alert);
      if (this.biasAlerts.length > 100) this.biasAlerts = this.biasAlerts.slice(-100);
      this.saveLearnings();

      this.audit({
        workerId: "coordinator", workerName: "Coordinator",
        action: "bias_detected", taskId: task.id,
        details: `Divergence: ${(divergenceScore * 100).toFixed(0)}% between ${task.results.length} workers`,
      });

      console.log(`[orchestrator] ⚠ Bias detected in task ${task.id}: divergence ${(divergenceScore * 100).toFixed(0)}%`);
      return alert;
    }
    return null;
  }

  // --- Submit a task ---

  async submitTask(
    type: Task["type"],
    prompt: string,
    options: {
      priority?: TaskPriority;
      requireConsensus?: boolean;
      specificWorkers?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      type,
      prompt,
      status: "queued",
      priority: options.priority || "normal",
      assignedWorkers: [],
      results: [],
      consensusResult: null,
      consensusScore: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      metadata: options.metadata || {},
    };

    this.tasks.push(task);
    if (this.tasks.length > 200) this.tasks = this.tasks.slice(-200);
    this.emitTask(task);

    this.audit({
      workerId: "coordinator", workerName: "Coordinator",
      action: "task_assigned", taskId: task.id, taskType: type,
      details: `Priority: ${task.priority}, consensus: ${!!options.requireConsensus}`,
    });

    // Route task
    if (options.requireConsensus) {
      await this.executeConsensusTask(task, options.specificWorkers);
    } else if (options.specificWorkers && options.specificWorkers.length > 0) {
      await this.executeOnSpecificWorkers(task, options.specificWorkers);
    } else {
      await this.executeWithLoadBalancing(task);
    }

    // Cross-worker learning: record results
    for (const result of task.results) {
      this.recordLearning(
        result.workerId, type, result.latencyMs, result.confidence,
        task.status === "completed"
      );
    }

    return task;
  }

  // --- Execution strategies ---

  private async executeWithLoadBalancing(task: Task): Promise<void> {
    const worker = this.selectBestWorker(task.type);
    if (!worker) {
      task.status = "failed";
      task.completedAt = new Date().toISOString();
      this.emitTask(task);
      return;
    }

    task.status = "assigned";
    task.assignedWorkers = [worker.id];
    this.emitTask(task);

    try {
      task.status = "in_progress";
      this.emitTask(task);

      const result = await this.executeOnWorker(worker, task.prompt);
      task.results.push(result);
      task.consensusResult = result.response;
      task.consensusScore = result.confidence;
      task.status = "completed";
      task.completedAt = new Date().toISOString();
    } catch (err) {
      // Fallback: try another worker
      const fallback = this.selectBestWorker(task.type, [worker.id]);
      if (fallback) {
        try {
          const result = await this.executeOnWorker(fallback, task.prompt);
          task.results.push(result);
          task.assignedWorkers.push(fallback.id);
          task.consensusResult = result.response;
          task.consensusScore = result.confidence;
          task.status = "completed";
          task.completedAt = new Date().toISOString();
        } catch {
          task.status = "failed";
          task.completedAt = new Date().toISOString();
        }
      } else {
        task.status = "failed";
        task.completedAt = new Date().toISOString();
      }
    }

    this.emitTask(task);
  }

  private async executeOnSpecificWorkers(task: Task, workerIds: string[]): Promise<void> {
    task.status = "in_progress";
    task.assignedWorkers = workerIds;
    this.emitTask(task);

    const results = await Promise.allSettled(
      workerIds.map(id => {
        const worker = this.workers.get(id);
        if (!worker || !worker.enabled) return Promise.reject(new Error(`Worker ${id} unavailable`));
        return this.executeOnWorker(worker, task.prompt);
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") task.results.push(r.value);
    }

    if (task.results.length > 0) {
      // Use highest confidence result
      const best = task.results.reduce((a, b) => a.confidence > b.confidence ? a : b);
      task.consensusResult = best.response;
      task.consensusScore = best.confidence;
      task.status = "completed";
    } else {
      task.status = "failed";
    }
    task.completedAt = new Date().toISOString();
    this.emitTask(task);
  }

  private async executeConsensusTask(task: Task, specificWorkers?: string[]): Promise<void> {
    task.status = "in_progress";
    this.emitTask(task);

    // Get all available workers or specific ones
    const workerIds = specificWorkers || Array.from(this.workers.values())
      .filter(w => w.enabled && w.status === "online")
      .map(w => w.id);

    task.assignedWorkers = workerIds;

    // Execute on all workers in parallel
    const results = await Promise.allSettled(
      workerIds.map(id => {
        const worker = this.workers.get(id);
        if (!worker) return Promise.reject(new Error(`Worker ${id} not found`));
        return this.executeOnWorker(worker, task.prompt);
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") task.results.push(r.value);
    }

    // Bias detection on multi-worker results
    if (task.results.length >= 2) {
      const biasAlert = this.detectBias(task);
      if (biasAlert) {
        task.metadata.biasAlert = biasAlert;
      }
    }

    if (task.results.length >= 2) {
      // Consensus: ask the coordinator (first available worker) to synthesize
      task.status = "consensus";
      this.emitTask(task);

      this.audit({
        workerId: "coordinator", workerName: "Coordinator",
        action: "consensus_run", taskId: task.id,
        details: `${task.results.length} results to synthesize`,
      });

      const synthesisPrompt = `Du är en konsensus-koordinator. Flera AI-workers har svarat på samma fråga. Syntetisera det bästa svaret.

ORIGINAL FRÅGA: "${task.prompt}"

SVAR FRÅN WORKERS:
${task.results.map((r, i) => `--- ${r.workerName} (confidence: ${(r.confidence * 100).toFixed(0)}%) ---\n${r.response}`).join("\n\n")}

Ge ett syntetiserat svar som kombinerar de bästa insikterna. Markera eventuella meningsskiljaktigheter. Avsluta med [CONSENSUS_SCORE: X.XX] där X.XX är 0-1 baserat på hur överens svaren är.`;

      const coordinator = this.selectBestWorker("analysis");
      if (coordinator) {
        try {
          const synthesis = await this.executeOnWorker(coordinator, synthesisPrompt);
          task.consensusResult = synthesis.response;

          // Extract consensus score
          const scoreMatch = synthesis.response.match(/\[CONSENSUS_SCORE:\s*([\d.]+)\]/i);
          task.consensusScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
          task.results.push(synthesis);
        } catch {
          // Fallback: use highest confidence result
          const best = task.results.reduce((a, b) => a.confidence > b.confidence ? a : b);
          task.consensusResult = best.response;
          task.consensusScore = best.confidence * 0.7; // Lower score since no consensus
        }
      } else {
        const best = task.results.reduce((a, b) => a.confidence > b.confidence ? a : b);
        task.consensusResult = best.response;
        task.consensusScore = best.confidence * 0.7;
      }
    } else if (task.results.length === 1) {
      task.consensusResult = task.results[0].response;
      task.consensusScore = task.results[0].confidence * 0.5; // Low score, no consensus possible
    }

    task.status = task.results.length > 0 ? "completed" : "failed";
    task.completedAt = new Date().toISOString();
    this.emitTask(task);
  }

  // --- Getters ---

  getWorkers(): Worker[] {
    return Array.from(this.workers.values()).map(w => ({
      ...w,
      health: {
        ...w.health,
        uptime: w.enabled ? (Date.now() - this.startedAt) / 1000 : 0,
      },
    }));
  }

  getWorker(id: string): Worker | undefined {
    return this.workers.get(id);
  }

  getTasks(limit = 50): Task[] {
    return [...this.tasks].reverse().slice(0, limit);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  getStats(): OrchestratorStats {
    const completed = this.tasks.filter(t => t.status === "completed");
    const failed = this.tasks.filter(t => t.status === "failed");
    const allLatencies = completed.flatMap(t => t.results.map(r => r.latencyMs));
    const allTokens = completed.flatMap(t => t.results.map(r => r.tokens));
    const workers = Array.from(this.workers.values());

    // Evaluation score: composite metric (0-100)
    const successRate = this.tasks.length > 0 ? completed.length / this.tasks.length : 1;
    const avgConsensus = completed.length > 0
      ? completed.reduce((sum, t) => sum + (t.consensusScore || 0), 0) / completed.length
      : 0;
    const activeWorkers = workers.filter(w => w.enabled && w.status !== "error").length;
    const workerHealth = workers.length > 0 ? activeWorkers / workers.length : 0;
    const evaluationScore = Math.round(
      successRate * 40 +       // 40% weight on task success
      avgConsensus * 30 +      // 30% weight on consensus quality
      workerHealth * 30         // 30% weight on worker availability
    );

    return {
      totalTasks: this.tasks.length,
      completedTasks: completed.length,
      failedTasks: failed.length,
      avgLatencyMs: allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0,
      totalTokens: allTokens.reduce((a, b) => a + b, 0),
      estimatedCostUsd: workers.reduce((sum, w) => sum + w.health.estimatedCostUsd, 0),
      consensusAccuracy: completed.filter(t => (t.consensusScore || 0) > 0.7).length / Math.max(1, completed.length),
      uptimeSeconds: (Date.now() - this.startedAt) / 1000,
      biasAlerts: this.biasAlerts.length,
      crossWorkerLearnings: this.learnings.length,
      evaluationScore,
    };
  }

  // --- New getters for research features ---

  getLearnings(): WorkerLearning[] {
    return [...this.learnings];
  }

  getBiasAlerts(limit = 20): BiasAlert[] {
    return [...this.biasAlerts].reverse().slice(0, limit);
  }

  getAuditLog(limit = 50): AuditEntry[] {
    return [...this.auditLog].reverse().slice(0, limit);
  }

  getWorkerLearning(workerId: string): WorkerLearning[] {
    return this.learnings.filter(l => l.workerId === workerId);
  }

  // Reset a worker's error state
  resetWorker(id: string): boolean {
    const worker = this.workers.get(id);
    if (!worker) return false;
    worker.status = worker.enabled ? "online" : "offline";
    worker.health.lastError = null;
    worker.health.failedRequests = 0;
    this.emitWorker(worker);
    return true;
  }

  setWorkerEnabled(id: string, enabled: boolean): boolean {
    const worker = this.workers.get(id);
    if (!worker) return false;
    worker.enabled = enabled;
    worker.status = enabled ? "online" : "offline";
    this.emitWorker(worker);

    this.audit({
      workerId: id, workerName: worker.name,
      action: "worker_toggled",
      details: enabled ? "enabled" : "disabled",
    });

    return true;
  }
}
