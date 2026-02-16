/**
 * AI Workflows — Automation builder for Cascade Remote
 * 
 * Chain multiple AI actions into reusable workflows.
 * Each workflow is a sequence of steps that execute in order.
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOWS_FILE = join(__dirname, "..", "data", "workflows.json");

export interface WorkflowStep {
  id: string;
  type: "ai_prompt" | "command" | "http_request" | "condition" | "delay" | "notification";
  name: string;
  config: Record<string, unknown>;
  /** Use {{prev}} to reference previous step's output */
  template?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  runCount: number;
  lastRunAt: string | null;
  lastError: string | null;
  tags: string[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "failed" | "cancelled";
  currentStep: number;
  totalSteps: number;
  stepResults: Array<{ stepId: string; stepName: string; result: string; durationMs: number; error?: string }>;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export type WorkflowStepExecutor = (step: WorkflowStep, prevResult: string) => Promise<string>;

const workflows: Map<string, Workflow> = new Map();
const runs: WorkflowRun[] = [];
let stepExecutor: WorkflowStepExecutor | null = null;

function load(): void {
  try {
    if (existsSync(WORKFLOWS_FILE)) {
      const data = JSON.parse(readFileSync(WORKFLOWS_FILE, "utf-8"));
      for (const w of data.workflows || []) workflows.set(w.id, w);
      console.log(`[workflows] Loaded ${workflows.size} workflow(s)`);
    }
  } catch { /* fresh */ }
}

function save(): void {
  try {
    const dir = dirname(WORKFLOWS_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(WORKFLOWS_FILE, JSON.stringify({ workflows: Array.from(workflows.values()) }, null, 2), "utf-8");
  } catch (err) { console.error("[workflows] Save failed:", err); }
}

load();

export function initWorkflows(executor: WorkflowStepExecutor): void {
  stepExecutor = executor;
}

export function createWorkflow(name: string, description: string, steps: WorkflowStep[], tags: string[] = []): Workflow {
  const workflow: Workflow = {
    id: uuidv4(),
    name, description, steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    runCount: 0, lastRunAt: null, lastError: null, tags,
  };
  workflows.set(workflow.id, workflow);
  save();
  return workflow;
}

export function updateWorkflow(id: string, updates: Partial<Pick<Workflow, "name" | "description" | "steps" | "tags">>): Workflow | null {
  const w = workflows.get(id);
  if (!w) return null;
  Object.assign(w, updates, { updatedAt: new Date().toISOString() });
  save();
  return w;
}

export function deleteWorkflow(id: string): boolean {
  const ok = workflows.delete(id);
  if (ok) save();
  return ok;
}

export function getWorkflow(id: string): Workflow | undefined { return workflows.get(id); }
export function listWorkflows(): Workflow[] { return Array.from(workflows.values()); }

export async function runWorkflow(id: string): Promise<WorkflowRun> {
  const workflow = workflows.get(id);
  if (!workflow) throw new Error("Workflow not found");
  if (!stepExecutor) throw new Error("Workflow executor not initialized");

  const run: WorkflowRun = {
    id: uuidv4(),
    workflowId: id,
    workflowName: workflow.name,
    status: "running",
    currentStep: 0,
    totalSteps: workflow.steps.length,
    stepResults: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };
  runs.push(run);
  if (runs.length > 200) runs.splice(0, runs.length - 200);

  let prevResult = "";

  for (let i = 0; i < workflow.steps.length; i++) {
    run.currentStep = i;
    const step = workflow.steps[i];
    const start = Date.now();

    try {
      // Handle delay step
      if (step.type === "delay") {
        const ms = (step.config.delayMs as number) || 1000;
        await new Promise(resolve => setTimeout(resolve, ms));
        const result = `Waited ${ms}ms`;
        run.stepResults.push({ stepId: step.id, stepName: step.name, result, durationMs: Date.now() - start });
        prevResult = result;
        continue;
      }

      // Handle condition step
      if (step.type === "condition") {
        const condition = (step.config.condition as string) || "";
        const matches = prevResult.toLowerCase().includes(condition.toLowerCase());
        if (!matches) {
          run.stepResults.push({ stepId: step.id, stepName: step.name, result: `Condition not met, skipping remaining steps`, durationMs: Date.now() - start });
          break;
        }
        run.stepResults.push({ stepId: step.id, stepName: step.name, result: "Condition met", durationMs: Date.now() - start });
        continue;
      }

      // Inject previous result into template
      const processedStep = { ...step };
      if (step.template) {
        processedStep.config = { ...step.config };
        for (const [key, val] of Object.entries(processedStep.config)) {
          if (typeof val === "string") {
            processedStep.config[key] = val.replace(/\{\{prev\}\}/g, prevResult);
          }
        }
      }

      const result = await stepExecutor(processedStep, prevResult);
      run.stepResults.push({ stepId: step.id, stepName: step.name, result: result.slice(0, 2000), durationMs: Date.now() - start });
      prevResult = result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      run.stepResults.push({ stepId: step.id, stepName: step.name, result: "", durationMs: Date.now() - start, error: errMsg });
      run.status = "failed";
      run.error = `Step "${step.name}" failed: ${errMsg}`;
      run.completedAt = new Date().toISOString();
      workflow.lastError = run.error;
      workflow.lastRunAt = new Date().toISOString();
      workflow.runCount++;
      save();
      return run;
    }
  }

  run.status = "completed";
  run.completedAt = new Date().toISOString();
  workflow.lastRunAt = new Date().toISOString();
  workflow.lastError = null;
  workflow.runCount++;
  save();
  return run;
}

export function getWorkflowRuns(workflowId?: string, limit = 20): WorkflowRun[] {
  const filtered = workflowId ? runs.filter(r => r.workflowId === workflowId) : runs;
  return filtered.slice(-limit);
}
