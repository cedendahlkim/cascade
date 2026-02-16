/**
 * AI Agent Chains — Advanced workflow engine for Cascade Remote
 * 
 * Features beyond basic workflows:
 * - DAG-based node graph (not just sequential)
 * - Conditional branching (if/else based on AI output or values)
 * - Loop nodes (repeat N times or until condition)
 * - Retry with backoff on failure
 * - Sub-chain references
 * - Scheduled execution via scheduler integration
 * - Real-time execution status via Socket.IO
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHAINS_FILE = join(__dirname, "..", "data", "agent-chains.json");

// ─── Types ───────────────────────────────────────────────────

export type ChainNodeType =
  | "start"
  | "ai_prompt"
  | "command"
  | "http_request"
  | "condition"
  | "loop"
  | "delay"
  | "transform"
  | "notification"
  | "sub_chain"
  | "end";

export interface ChainNodePosition {
  x: number;
  y: number;
}

export interface ChainConnection {
  id: string;
  fromNodeId: string;
  fromPort: string; // "out", "true", "false", "loop_body", "loop_done"
  toNodeId: string;
  toPort: string;   // "in"
}

export interface ChainNode {
  id: string;
  type: ChainNodeType;
  name: string;
  position: ChainNodePosition;
  config: Record<string, unknown>;
}

export interface AgentChain {
  id: string;
  name: string;
  description: string;
  nodes: ChainNode[];
  connections: ChainConnection[];
  createdAt: string;
  updatedAt: string;
  runCount: number;
  lastRunAt: string | null;
  lastStatus: "completed" | "failed" | null;
  scheduleId: string | null; // Link to scheduler
  tags: string[];
}

export interface ChainNodeResult {
  nodeId: string;
  nodeName: string;
  nodeType: ChainNodeType;
  output: string;
  durationMs: number;
  error?: string;
  skipped?: boolean;
  iteration?: number;
}

export interface ChainRun {
  id: string;
  chainId: string;
  chainName: string;
  status: "running" | "completed" | "failed" | "cancelled";
  nodeResults: ChainNodeResult[];
  currentNodeId: string | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  variables: Record<string, string>; // Shared state between nodes
}

export type ChainStepExecutor = (
  type: ChainNodeType,
  config: Record<string, unknown>,
  variables: Record<string, string>,
) => Promise<string>;

export type ChainEventEmitter = (event: string, data: unknown) => void;

// ─── Storage ─────────────────────────────────────────────────

const chains: Map<string, AgentChain> = new Map();
const runs: ChainRun[] = [];
let stepExecutor: ChainStepExecutor | null = null;
let eventEmitter: ChainEventEmitter | null = null;
const activeRuns: Map<string, { cancelled: boolean }> = new Map();

function load(): void {
  try {
    if (existsSync(CHAINS_FILE)) {
      const data = JSON.parse(readFileSync(CHAINS_FILE, "utf-8"));
      for (const c of data.chains || []) chains.set(c.id, c);
      console.log(`[agent-chains] Loaded ${chains.size} chain(s)`);
    }
  } catch { /* fresh */ }
}

function save(): void {
  try {
    const dir = dirname(CHAINS_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(
      CHAINS_FILE,
      JSON.stringify({ chains: Array.from(chains.values()) }, null, 2),
      "utf-8",
    );
  } catch (err) {
    console.error("[agent-chains] Save failed:", err);
  }
}

load();

// ─── Init ────────────────────────────────────────────────────

export function initAgentChains(
  executor: ChainStepExecutor,
  emitter?: ChainEventEmitter,
): void {
  stepExecutor = executor;
  eventEmitter = emitter || null;
}

// ─── CRUD ────────────────────────────────────────────────────

export function createChain(
  name: string,
  description: string,
  nodes: ChainNode[],
  connections: ChainConnection[],
  tags: string[] = [],
): AgentChain {
  const chain: AgentChain = {
    id: uuidv4(),
    name,
    description,
    nodes,
    connections,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    runCount: 0,
    lastRunAt: null,
    lastStatus: null,
    scheduleId: null,
    tags,
  };
  chains.set(chain.id, chain);
  save();
  return chain;
}

export function updateChain(
  id: string,
  updates: Partial<Pick<AgentChain, "name" | "description" | "nodes" | "connections" | "tags" | "scheduleId">>,
): AgentChain | null {
  const c = chains.get(id);
  if (!c) return null;
  Object.assign(c, updates, { updatedAt: new Date().toISOString() });
  save();
  return c;
}

export function deleteChain(id: string): boolean {
  const ok = chains.delete(id);
  if (ok) save();
  return ok;
}

export function getChain(id: string): AgentChain | undefined {
  return chains.get(id);
}

export function listChains(): AgentChain[] {
  return Array.from(chains.values());
}

// ─── Execution Engine ────────────────────────────────────────

function getOutgoingConnections(
  connections: ChainConnection[],
  nodeId: string,
  port?: string,
): ChainConnection[] {
  return connections.filter(
    (c) => c.fromNodeId === nodeId && (!port || c.fromPort === port),
  );
}

function getNextNodeId(
  connections: ChainConnection[],
  nodeId: string,
  port: string = "out",
): string | null {
  const conn = connections.find(
    (c) => c.fromNodeId === nodeId && c.fromPort === port,
  );
  return conn ? conn.toNodeId : null;
}

function resolveTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || "");
}

function resolveConfig(
  config: Record<string, unknown>,
  variables: Record<string, string>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(config)) {
    if (typeof val === "string") {
      resolved[key] = resolveTemplate(val, variables);
    } else {
      resolved[key] = val;
    }
  }
  return resolved;
}

export async function runChain(id: string): Promise<ChainRun> {
  const chain = chains.get(id);
  if (!chain) throw new Error("Chain not found");
  if (!stepExecutor) throw new Error("Chain executor not initialized");

  const run: ChainRun = {
    id: uuidv4(),
    chainId: id,
    chainName: chain.name,
    status: "running",
    nodeResults: [],
    currentNodeId: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    variables: {},
  };
  runs.push(run);
  if (runs.length > 200) runs.splice(0, runs.length - 200);

  const cancelToken = { cancelled: false };
  activeRuns.set(run.id, cancelToken);

  emit("chain_run_start", { runId: run.id, chainId: id, chainName: chain.name });

  try {
    // Find start node
    const startNode = chain.nodes.find((n) => n.type === "start");
    if (!startNode) throw new Error("No start node found");

    // Execute from start node
    await executeNode(chain, run, startNode.id, cancelToken);

    if (cancelToken.cancelled) {
      run.status = "cancelled";
    } else {
      run.status = "completed";
    }
  } catch (err) {
    run.status = "failed";
    run.error = err instanceof Error ? err.message : String(err);
  }

  run.completedAt = new Date().toISOString();
  activeRuns.delete(run.id);

  chain.lastRunAt = new Date().toISOString();
  chain.lastStatus = run.status === "completed" ? "completed" : "failed";
  chain.runCount++;
  save();

  emit("chain_run_end", {
    runId: run.id,
    chainId: id,
    status: run.status,
    error: run.error,
    nodeResults: run.nodeResults.length,
  });

  return run;
}

async function executeNode(
  chain: AgentChain,
  run: ChainRun,
  nodeId: string,
  cancelToken: { cancelled: boolean },
): Promise<void> {
  if (cancelToken.cancelled) return;

  const node = chain.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  run.currentNodeId = nodeId;
  emit("chain_node_start", { runId: run.id, nodeId, nodeName: node.name, nodeType: node.type });

  const start = Date.now();

  try {
    switch (node.type) {
      case "start": {
        // Start node: just pass through
        const result: ChainNodeResult = {
          nodeId, nodeName: node.name, nodeType: node.type,
          output: "Chain started", durationMs: Date.now() - start,
        };
        run.nodeResults.push(result);
        // Follow "out" connection
        const nextId = getNextNodeId(chain.connections, nodeId, "out");
        if (nextId) await executeNode(chain, run, nextId, cancelToken);
        break;
      }

      case "end": {
        const result: ChainNodeResult = {
          nodeId, nodeName: node.name, nodeType: node.type,
          output: "Chain ended", durationMs: Date.now() - start,
        };
        run.nodeResults.push(result);
        break;
      }

      case "ai_prompt":
      case "command":
      case "http_request":
      case "notification":
      case "transform": {
        const config = resolveConfig(node.config, run.variables);

        // Retry logic
        const maxRetries = (node.config.retries as number) || 0;
        const retryDelayMs = (node.config.retryDelayMs as number) || 2000;
        let lastError: string | null = null;
        let output = "";

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          if (cancelToken.cancelled) return;
          try {
            output = await stepExecutor!(node.type, config, run.variables);
            lastError = null;
            break;
          } catch (err) {
            lastError = err instanceof Error ? err.message : String(err);
            if (attempt < maxRetries) {
              const delay = retryDelayMs * Math.pow(2, attempt);
              emit("chain_node_retry", {
                runId: run.id, nodeId, attempt: attempt + 1, maxRetries, delayMs: delay,
              });
              await sleep(delay);
            }
          }
        }

        if (lastError) throw new Error(`Node "${node.name}" failed after ${maxRetries + 1} attempts: ${lastError}`);

        // Store output in variables
        const varName = (node.config.outputVar as string) || node.id;
        run.variables[varName] = output;
        run.variables["prev"] = output;

        const result: ChainNodeResult = {
          nodeId, nodeName: node.name, nodeType: node.type,
          output: output.slice(0, 2000), durationMs: Date.now() - start,
        };
        run.nodeResults.push(result);
        emit("chain_node_end", { runId: run.id, nodeId, output: output.slice(0, 200), durationMs: result.durationMs });

        // Follow "out" connection
        const nextId = getNextNodeId(chain.connections, nodeId, "out");
        if (nextId) await executeNode(chain, run, nextId, cancelToken);
        break;
      }

      case "condition": {
        const config = resolveConfig(node.config, run.variables);
        const conditionType = (config.conditionType as string) || "contains";
        const conditionValue = (config.conditionValue as string) || "";
        const checkValue = (config.checkValue as string) || run.variables["prev"] || "";

        let conditionMet = false;

        switch (conditionType) {
          case "contains":
            conditionMet = checkValue.toLowerCase().includes(conditionValue.toLowerCase());
            break;
          case "not_contains":
            conditionMet = !checkValue.toLowerCase().includes(conditionValue.toLowerCase());
            break;
          case "equals":
            conditionMet = checkValue.trim() === conditionValue.trim();
            break;
          case "not_equals":
            conditionMet = checkValue.trim() !== conditionValue.trim();
            break;
          case "regex":
            try { conditionMet = new RegExp(conditionValue, "i").test(checkValue); } catch { conditionMet = false; }
            break;
          case "greater_than":
            conditionMet = parseFloat(checkValue) > parseFloat(conditionValue);
            break;
          case "less_than":
            conditionMet = parseFloat(checkValue) < parseFloat(conditionValue);
            break;
          case "is_empty":
            conditionMet = !checkValue.trim();
            break;
          case "is_not_empty":
            conditionMet = !!checkValue.trim();
            break;
          default:
            conditionMet = checkValue.toLowerCase().includes(conditionValue.toLowerCase());
        }

        const result: ChainNodeResult = {
          nodeId, nodeName: node.name, nodeType: node.type,
          output: conditionMet ? "true" : "false",
          durationMs: Date.now() - start,
        };
        run.nodeResults.push(result);
        emit("chain_node_end", { runId: run.id, nodeId, output: result.output, durationMs: result.durationMs });

        // Branch: follow "true" or "false" port
        const branchPort = conditionMet ? "true" : "false";
        const nextId = getNextNodeId(chain.connections, nodeId, branchPort);
        if (nextId) await executeNode(chain, run, nextId, cancelToken);
        break;
      }

      case "loop": {
        const config = resolveConfig(node.config, run.variables);
        const loopType = (config.loopType as string) || "count";
        const maxIterations = Math.min((config.iterations as number) || 3, 50); // Safety cap
        const untilCondition = (config.untilCondition as string) || "";

        const bodyNextId = getNextNodeId(chain.connections, nodeId, "loop_body");
        const doneNextId = getNextNodeId(chain.connections, nodeId, "loop_done");

        let iteration = 0;
        let shouldContinue = true;

        while (shouldContinue && iteration < maxIterations && !cancelToken.cancelled) {
          run.variables["loop_index"] = String(iteration);
          run.variables["loop_iteration"] = String(iteration + 1);

          const iterResult: ChainNodeResult = {
            nodeId, nodeName: node.name, nodeType: node.type,
            output: `Iteration ${iteration + 1}/${maxIterations}`,
            durationMs: 0, iteration,
          };
          run.nodeResults.push(iterResult);

          // Execute loop body
          if (bodyNextId) {
            await executeNode(chain, run, bodyNextId, cancelToken);
          }

          iteration++;

          // Check loop condition
          if (loopType === "count") {
            shouldContinue = iteration < maxIterations;
          } else if (loopType === "until") {
            const prevOutput = run.variables["prev"] || "";
            shouldContinue = !prevOutput.toLowerCase().includes(untilCondition.toLowerCase());
          }
        }

        const loopResult: ChainNodeResult = {
          nodeId, nodeName: node.name, nodeType: node.type,
          output: `Loop completed: ${iteration} iterations`,
          durationMs: Date.now() - start,
        };
        run.nodeResults.push(loopResult);

        // Follow "loop_done" connection
        if (doneNextId) await executeNode(chain, run, doneNextId, cancelToken);
        break;
      }

      case "delay": {
        const ms = (node.config.delayMs as number) || 1000;
        await sleep(Math.min(ms, 60000)); // Cap at 60s
        const result: ChainNodeResult = {
          nodeId, nodeName: node.name, nodeType: node.type,
          output: `Waited ${ms}ms`, durationMs: Date.now() - start,
        };
        run.nodeResults.push(result);
        const nextId = getNextNodeId(chain.connections, nodeId, "out");
        if (nextId) await executeNode(chain, run, nextId, cancelToken);
        break;
      }

      case "sub_chain": {
        const subChainId = node.config.chainId as string;
        if (!subChainId) throw new Error("Sub-chain node missing chainId");
        const subRun = await runChain(subChainId);
        const output = subRun.status === "completed"
          ? subRun.nodeResults.map((r) => r.output).join("\n").slice(0, 2000)
          : `Sub-chain failed: ${subRun.error}`;

        run.variables["prev"] = output;
        const result: ChainNodeResult = {
          nodeId, nodeName: node.name, nodeType: node.type,
          output, durationMs: Date.now() - start,
        };
        run.nodeResults.push(result);

        if (subRun.status !== "completed") throw new Error(output);

        const nextId = getNextNodeId(chain.connections, nodeId, "out");
        if (nextId) await executeNode(chain, run, nextId, cancelToken);
        break;
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    run.nodeResults.push({
      nodeId, nodeName: node.name, nodeType: node.type,
      output: "", durationMs: Date.now() - start, error: errMsg,
    });
    emit("chain_node_error", { runId: run.id, nodeId, error: errMsg });
    throw err;
  }
}

export function cancelChainRun(runId: string): boolean {
  const token = activeRuns.get(runId);
  if (!token) return false;
  token.cancelled = true;
  return true;
}

export function getChainRuns(chainId?: string, limit = 20): ChainRun[] {
  const filtered = chainId ? runs.filter((r) => r.chainId === chainId) : runs;
  return filtered.slice(-limit);
}

export function getChainRun(runId: string): ChainRun | undefined {
  return runs.find((r) => r.id === runId);
}

// ─── Helpers ─────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emit(event: string, data: unknown): void {
  if (eventEmitter) eventEmitter(event, data);
}

// ─── Template Chains ─────────────────────────────────────────

export function getChainTemplates(): Array<{ name: string; description: string; nodes: ChainNode[]; connections: ChainConnection[] }> {
  return [
    {
      name: "Enkel AI-kedja",
      description: "Start → AI Prompt → End",
      nodes: [
        { id: "n1", type: "start", name: "Start", position: { x: 50, y: 200 }, config: {} },
        { id: "n2", type: "ai_prompt", name: "AI Fråga", position: { x: 250, y: 200 }, config: { prompt: "Beskriv vädret idag" } },
        { id: "n3", type: "end", name: "Slut", position: { x: 450, y: 200 }, config: {} },
      ],
      connections: [
        { id: "c1", fromNodeId: "n1", fromPort: "out", toNodeId: "n2", toPort: "in" },
        { id: "c2", fromNodeId: "n2", fromPort: "out", toNodeId: "n3", toPort: "in" },
      ],
    },
    {
      name: "Villkorlig kedja",
      description: "AI Prompt → Villkor → Ja/Nej-grenar",
      nodes: [
        { id: "n1", type: "start", name: "Start", position: { x: 50, y: 200 }, config: {} },
        { id: "n2", type: "ai_prompt", name: "Analysera", position: { x: 220, y: 200 }, config: { prompt: "Analysera: {{input}}" } },
        { id: "n3", type: "condition", name: "Positivt?", position: { x: 420, y: 200 }, config: { conditionType: "contains", conditionValue: "positivt", checkValue: "{{prev}}" } },
        { id: "n4", type: "notification", name: "Bra!", position: { x: 620, y: 100 }, config: { message: "Positivt resultat: {{prev}}" } },
        { id: "n5", type: "ai_prompt", name: "Förbättra", position: { x: 620, y: 300 }, config: { prompt: "Föreslå förbättringar för: {{prev}}" } },
        { id: "n6", type: "end", name: "Slut", position: { x: 820, y: 200 }, config: {} },
      ],
      connections: [
        { id: "c1", fromNodeId: "n1", fromPort: "out", toNodeId: "n2", toPort: "in" },
        { id: "c2", fromNodeId: "n2", fromPort: "out", toNodeId: "n3", toPort: "in" },
        { id: "c3", fromNodeId: "n3", fromPort: "true", toNodeId: "n4", toPort: "in" },
        { id: "c4", fromNodeId: "n3", fromPort: "false", toNodeId: "n5", toPort: "in" },
        { id: "c5", fromNodeId: "n4", fromPort: "out", toNodeId: "n6", toPort: "in" },
        { id: "c6", fromNodeId: "n5", fromPort: "out", toNodeId: "n6", toPort: "in" },
      ],
    },
    {
      name: "Loop med retry",
      description: "Upprepa AI-anrop tills villkor uppfylls",
      nodes: [
        { id: "n1", type: "start", name: "Start", position: { x: 50, y: 200 }, config: {} },
        { id: "n2", type: "loop", name: "Upprepa 3x", position: { x: 250, y: 200 }, config: { loopType: "count", iterations: 3 } },
        { id: "n3", type: "ai_prompt", name: "Generera idé", position: { x: 250, y: 380 }, config: { prompt: "Generera en kreativ idé #{{loop_iteration}}", retries: 2, retryDelayMs: 3000 } },
        { id: "n4", type: "notification", name: "Klar", position: { x: 500, y: 200 }, config: { message: "Alla idéer genererade!" } },
        { id: "n5", type: "end", name: "Slut", position: { x: 700, y: 200 }, config: {} },
      ],
      connections: [
        { id: "c1", fromNodeId: "n1", fromPort: "out", toNodeId: "n2", toPort: "in" },
        { id: "c2", fromNodeId: "n2", fromPort: "loop_body", toNodeId: "n3", toPort: "in" },
        { id: "c3", fromNodeId: "n2", fromPort: "loop_done", toNodeId: "n4", toPort: "in" },
        { id: "c4", fromNodeId: "n4", fromPort: "out", toNodeId: "n5", toPort: "in" },
      ],
    },
  ];
}
