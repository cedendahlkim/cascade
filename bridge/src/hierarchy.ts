/**
 * Hierarchical Agent Coordination — Planner/Executor/Critic/Validator
 *
 * P1: Planner Agent — breaks complex tasks into sub-steps
 * P2: Executor Agents — specialized workers per task type
 * P3: Critic Agent — adversarial reasoning, challenges assumptions
 * P4: Validator Agent — deterministic hooks, blocks if tests fail
 * P5: Orchestrator state machine for workflow coordination
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const STATE_FILE = join(DATA_DIR, "hierarchy-state.json");

// Ensure data dir exists
try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); } catch { /* ok */ }

// ─── Types ───────────────────────────────────────────────────

export type AgentRole = "planner" | "executor" | "critic" | "validator" | "orchestrator";

export type WorkflowState =
  | "idle"
  | "planning"
  | "plan_review"
  | "executing"
  | "criticizing"
  | "validating"
  | "revision"
  | "completed"
  | "failed"
  | "blocked";

export type StepStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped" | "blocked";

export type ExecutorSpecialty =
  | "code"
  | "research"
  | "analysis"
  | "writing"
  | "data"
  | "general";

export interface PlanStep {
  id: string;
  index: number;
  description: string;
  specialty: ExecutorSpecialty;
  status: StepStatus;
  dependencies: string[];       // step IDs that must complete first
  output: string | null;
  executorId: string | null;
  criticFeedback: string | null;
  validationResult: ValidationResult | null;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number;
}

export interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
  reasoning: string;
  createdAt: string;
  revisedAt: string | null;
  revisionCount: number;
}

export interface CriticReview {
  id: string;
  targetType: "plan" | "step_output" | "final_output";
  targetId: string;
  issues: CriticIssue[];
  overallScore: number;       // 0-10
  recommendation: "approve" | "revise" | "reject";
  reasoning: string;
  timestamp: string;
}

export interface CriticIssue {
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  description: string;
  suggestion: string;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
  blockers: string[];
  timestamp: string;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  type: "format" | "completeness" | "consistency" | "test" | "custom";
}

export interface HierarchyWorkflow {
  id: string;
  goal: string;
  state: WorkflowState;
  plan: Plan | null;
  currentStepId: string | null;
  criticReviews: CriticReview[];
  stateHistory: StateTransition[];
  finalOutput: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  totalDurationMs: number;
  tokenUsage: { planning: number; execution: number; criticism: number; validation: number };
}

export interface StateTransition {
  from: WorkflowState;
  to: WorkflowState;
  reason: string;
  timestamp: string;
}

export interface HierarchyStats {
  totalWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
  avgStepsPerPlan: number;
  avgRevisionsPerWorkflow: number;
  avgCriticScore: number;
  validationPassRate: number;
  totalTokens: number;
  activeWorkflows: number;
}

// ─── LLM Function Type ──────────────────────────────────────

export type LLMRespondFn = (prompt: string) => Promise<string>;

// ─── State Machine ──────────────────────────────────────────

const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  idle:         ["planning"],
  planning:     ["plan_review", "failed"],
  plan_review:  ["executing", "planning", "failed"],   // approve → executing, revise → planning
  executing:    ["criticizing", "revision", "failed"],
  criticizing:  ["validating", "revision", "executing", "failed"],
  validating:   ["completed", "revision", "blocked", "failed"],
  revision:     ["planning", "executing", "failed"],
  completed:    ["idle"],
  failed:       ["idle", "planning"],
  blocked:      ["revision", "failed", "idle"],
};

// ─── Orchestrator ───────────────────────────────────────────

const workflows: Map<string, HierarchyWorkflow> = new Map();
let llmFns: Record<AgentRole, LLMRespondFn | null> = {
  planner: null,
  executor: null,
  critic: null,
  validator: null,
  orchestrator: null,
};
let eventCallback: ((event: string, data: unknown) => void) | null = null;

function emit(event: string, data: unknown): void {
  if (eventCallback) eventCallback(event, data);
}

function transition(wf: HierarchyWorkflow, to: WorkflowState, reason: string): void {
  const from = wf.state;
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    console.warn(`[hierarchy] Invalid transition: ${from} → ${to}`);
    return;
  }
  wf.stateHistory.push({ from, to, reason, timestamp: new Date().toISOString() });
  wf.state = to;
  wf.updatedAt = new Date().toISOString();
  emit("hierarchy_state", { workflowId: wf.id, from, to, reason });
}

function saveState(): void {
  try {
    const data = Array.from(workflows.values()).slice(-50);
    writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch { /* non-critical */ }
}

function loadState(): void {
  try {
    if (existsSync(STATE_FILE)) {
      const data: HierarchyWorkflow[] = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      for (const wf of data) {
        // Reset active workflows to failed on restart
        if (["planning", "executing", "criticizing", "validating", "revision", "plan_review"].includes(wf.state)) {
          wf.state = "failed";
          wf.stateHistory.push({ from: wf.state, to: "failed", reason: "Server restart", timestamp: new Date().toISOString() });
        }
        workflows.set(wf.id, wf);
      }
    }
  } catch { /* fresh start */ }
}

// ─── Init ───────────────────────────────────────────────────

export function initHierarchy(
  fns: Partial<Record<AgentRole, LLMRespondFn>>,
  onEvent?: (event: string, data: unknown) => void,
): void {
  llmFns = { ...llmFns, ...fns };
  if (onEvent) eventCallback = onEvent;
  loadState();
  console.log("[hierarchy] Initialized with roles:", Object.keys(fns).filter(k => fns[k as AgentRole]).join(", "));
}

// ─── P1: Planner Agent ──────────────────────────────────────

async function generatePlan(goal: string): Promise<Plan> {
  const fn = llmFns.planner || llmFns.orchestrator;
  if (!fn) throw new Error("No planner LLM configured");

  const prompt = `Du är en Planner Agent. Din uppgift är att bryta ner ett komplext mål till konkreta, sekventiella delsteg.

MÅL: "${goal}"

Svara ENBART med giltig JSON (ingen markdown):
{
  "reasoning": "Kort förklaring av din plan-strategi",
  "steps": [
    {
      "description": "Vad som ska göras i detta steg",
      "specialty": "code|research|analysis|writing|data|general",
      "dependencies": [],
      "maxAttempts": 2
    }
  ]
}

Regler:
- Varje steg ska vara atomärt och testbart
- Använd "dependencies" för steg som kräver resultat från tidigare steg (referera med index: "step_0", "step_1" etc)
- Välj rätt specialty för varje steg
- Max 10 steg, min 2 steg
- Varje steg ska ha en tydlig definition av "klar"`;

  const response = await fn(prompt);
  const parsed = JSON.parse(response.replace(/```json?\n?|```/g, "").trim());

  const plan: Plan = {
    id: uuidv4(),
    goal,
    reasoning: parsed.reasoning || "",
    steps: (parsed.steps || []).map((s: Record<string, unknown>, i: number) => ({
      id: `step_${i}`,
      index: i,
      description: s.description as string || `Step ${i + 1}`,
      specialty: (s.specialty as ExecutorSpecialty) || "general",
      status: "pending" as StepStatus,
      dependencies: (s.dependencies as string[]) || [],
      output: null,
      executorId: null,
      criticFeedback: null,
      validationResult: null,
      attempts: 0,
      maxAttempts: (s.maxAttempts as number) || 2,
      startedAt: null,
      completedAt: null,
      durationMs: 0,
    })),
    createdAt: new Date().toISOString(),
    revisedAt: null,
    revisionCount: 0,
  };

  return plan;
}

// ─── P2: Executor Agent ─────────────────────────────────────

async function executeStep(step: PlanStep, context: string): Promise<string> {
  const fn = llmFns.executor || llmFns.orchestrator;
  if (!fn) throw new Error("No executor LLM configured");

  const prompt = `Du är en Executor Agent med specialitet: ${step.specialty}.

UPPGIFT: ${step.description}

KONTEXT FRÅN TIDIGARE STEG:
${context || "(Inga tidigare resultat)"}

${step.criticFeedback ? `FEEDBACK FRÅN CRITIC (förbättra baserat på detta):\n${step.criticFeedback}\n` : ""}

Utför uppgiften noggrant. Ge ett komplett, detaljerat svar.
Om du behöver göra antaganden, ange dem explicit.
Avsluta med [CONFIDENCE: X.XX] där X.XX är 0-1.`;

  return fn(prompt);
}

// ─── P3: Critic Agent ───────────────────────────────────────

async function criticize(
  targetType: CriticReview["targetType"],
  targetId: string,
  content: string,
  goal: string,
): Promise<CriticReview> {
  const fn = llmFns.critic || llmFns.orchestrator;
  if (!fn) throw new Error("No critic LLM configured");

  const prompt = `Du är en Critic Agent. Din roll är adversarial reasoning — utmana antaganden och hitta brister.

URSPRUNGLIGT MÅL: "${goal}"
TYP: ${targetType}

INNEHÅLL ATT GRANSKA:
${content.slice(0, 4000)}

Svara ENBART med giltig JSON (ingen markdown):
{
  "overallScore": 7,
  "recommendation": "approve|revise|reject",
  "reasoning": "Övergripande bedömning",
  "issues": [
    {
      "severity": "low|medium|high|critical",
      "category": "accuracy|completeness|logic|efficiency|security|style",
      "description": "Vad är problemet",
      "suggestion": "Hur det kan förbättras"
    }
  ]
}

Regler:
- Var konstruktiv men krävande
- Score 0-10 (10 = perfekt)
- "approve" om score >= 7 och inga critical issues
- "revise" om score 4-6 eller har high issues
- "reject" om score < 4 eller har critical issues
- Utmana ALLTID minst ett antagande`;

  const response = await fn(prompt);
  const parsed = JSON.parse(response.replace(/```json?\n?|```/g, "").trim());

  return {
    id: uuidv4(),
    targetType,
    targetId,
    issues: (parsed.issues || []).map((issue: Record<string, unknown>) => ({
      severity: issue.severity || "medium",
      category: issue.category || "general",
      description: issue.description || "",
      suggestion: issue.suggestion || "",
    })),
    overallScore: parsed.overallScore ?? 5,
    recommendation: parsed.recommendation || "revise",
    reasoning: parsed.reasoning || "",
    timestamp: new Date().toISOString(),
  };
}

// ─── P4: Validator Agent ────────────────────────────────────

async function validate(
  content: string,
  goal: string,
  stepDescription: string,
): Promise<ValidationResult> {
  const fn = llmFns.validator || llmFns.orchestrator;

  // Deterministic checks first (no LLM needed)
  const checks: ValidationCheck[] = [];

  // Check: non-empty output
  checks.push({
    name: "non_empty",
    passed: content.trim().length > 0,
    message: content.trim().length > 0 ? "Output is non-empty" : "Output is empty",
    type: "completeness",
  });

  // Check: minimum length
  checks.push({
    name: "min_length",
    passed: content.length >= 20,
    message: content.length >= 20 ? `Output length OK (${content.length} chars)` : "Output too short",
    type: "completeness",
  });

  // Check: no error indicators
  const hasError = /\b(error|exception|failed|traceback|undefined|null)\b/i.test(content.slice(0, 500));
  checks.push({
    name: "no_errors",
    passed: !hasError,
    message: hasError ? "Output contains error indicators" : "No error indicators found",
    type: "consistency",
  });

  // Check: confidence present
  const confMatch = content.match(/\[CONFIDENCE:\s*([\d.]+)\]/i);
  const confidence = confMatch ? parseFloat(confMatch[1]) : 0;
  checks.push({
    name: "confidence_threshold",
    passed: confidence >= 0.5,
    message: confidence >= 0.5 ? `Confidence OK (${confidence})` : `Low confidence (${confidence})`,
    type: "consistency",
  });

  // LLM-based validation if available
  if (fn) {
    try {
      const prompt = `Du är en Validator Agent. Kontrollera om resultatet uppfyller uppgiften.

UPPGIFT: ${stepDescription}
MÅL: ${goal}

RESULTAT:
${content.slice(0, 3000)}

Svara ENBART med giltig JSON:
{
  "checks": [
    { "name": "relevance", "passed": true, "message": "Relevant to task", "type": "completeness" },
    { "name": "correctness", "passed": true, "message": "Appears correct", "type": "consistency" }
  ],
  "blockers": []
}

"blockers" = lista med kritiska problem som BLOCKERAR godkännande (tom om inga).`;

      const response = await fn(prompt);
      const parsed = JSON.parse(response.replace(/```json?\n?|```/g, "").trim());

      if (parsed.checks) {
        for (const c of parsed.checks) {
          checks.push({
            name: c.name || "llm_check",
            passed: !!c.passed,
            message: c.message || "",
            type: c.type || "custom",
          });
        }
      }

      const blockers = parsed.blockers || [];
      return {
        passed: checks.every(c => c.passed) && blockers.length === 0,
        checks,
        blockers,
        timestamp: new Date().toISOString(),
      };
    } catch {
      // LLM validation failed, use deterministic only
    }
  }

  return {
    passed: checks.every(c => c.passed),
    checks,
    blockers: [],
    timestamp: new Date().toISOString(),
  };
}

// ─── P5: Orchestrator State Machine ─────────────────────────

export async function startWorkflow(goal: string): Promise<HierarchyWorkflow> {
  const wf: HierarchyWorkflow = {
    id: uuidv4(),
    goal,
    state: "idle",
    plan: null,
    currentStepId: null,
    criticReviews: [],
    stateHistory: [],
    finalOutput: null,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    totalDurationMs: 0,
    tokenUsage: { planning: 0, execution: 0, criticism: 0, validation: 0 },
  };

  workflows.set(wf.id, wf);
  emit("hierarchy_workflow_created", { id: wf.id, goal });

  // Start the state machine
  await runStateMachine(wf);

  return wf;
}

async function runStateMachine(wf: HierarchyWorkflow): Promise<void> {
  const startTime = Date.now();
  const MAX_ITERATIONS = 30; // Safety limit
  let iterations = 0;

  try {
    // Initial transition
    transition(wf, "planning", "Workflow started");

    while (!["completed", "failed", "blocked"].includes(wf.state) && iterations < MAX_ITERATIONS) {
      iterations++;

      switch (wf.state) {
        case "planning": {
          emit("hierarchy_phase", { workflowId: wf.id, phase: "planning" });
          try {
            const plan = await generatePlan(wf.goal);
            wf.plan = plan;
            transition(wf, "plan_review", "Plan generated");
          } catch (err) {
            wf.metadata.lastError = err instanceof Error ? err.message : String(err);
            transition(wf, "failed", `Planning failed: ${wf.metadata.lastError}`);
          }
          break;
        }

        case "plan_review": {
          emit("hierarchy_phase", { workflowId: wf.id, phase: "plan_review" });
          if (!wf.plan) { transition(wf, "failed", "No plan to review"); break; }

          const planSummary = wf.plan.steps.map((s, i) => `${i + 1}. [${s.specialty}] ${s.description}`).join("\n");
          const review = await criticize("plan", wf.plan.id, `Goal: ${wf.goal}\n\nPlan:\n${planSummary}`, wf.goal);
          wf.criticReviews.push(review);
          emit("hierarchy_review", { workflowId: wf.id, review });

          if (review.recommendation === "reject" && wf.plan.revisionCount < 2) {
            wf.plan.revisionCount++;
            wf.plan.revisedAt = new Date().toISOString();
            transition(wf, "planning", `Plan rejected (score: ${review.overallScore}), re-planning`);
          } else if (review.recommendation === "revise" && wf.plan.revisionCount < 2) {
            // Incorporate feedback and re-plan
            wf.goal = `${wf.goal}\n\n[CRITIC FEEDBACK: ${review.reasoning}. Issues: ${review.issues.map(i => i.description).join("; ")}]`;
            wf.plan.revisionCount++;
            transition(wf, "planning", `Plan needs revision (score: ${review.overallScore})`);
          } else {
            transition(wf, "executing", `Plan approved (score: ${review.overallScore})`);
          }
          break;
        }

        case "executing": {
          emit("hierarchy_phase", { workflowId: wf.id, phase: "executing" });
          if (!wf.plan) { transition(wf, "failed", "No plan to execute"); break; }

          // Find next executable step
          const nextStep = findNextStep(wf.plan);
          if (!nextStep) {
            // All steps done
            transition(wf, "criticizing", "All steps completed, moving to final review");
            break;
          }

          wf.currentStepId = nextStep.id;
          nextStep.status = "in_progress";
          nextStep.startedAt = new Date().toISOString();
          nextStep.attempts++;
          emit("hierarchy_step_start", { workflowId: wf.id, stepId: nextStep.id, description: nextStep.description });

          // Build context from completed dependencies
          const context = buildStepContext(wf.plan, nextStep);

          try {
            const output = await executeStep(nextStep, context);
            nextStep.output = output;
            nextStep.completedAt = new Date().toISOString();
            nextStep.durationMs = Date.now() - new Date(nextStep.startedAt!).getTime();

            // Quick validation
            const validation = await validate(output, wf.goal, nextStep.description);
            nextStep.validationResult = validation;

            if (validation.passed) {
              nextStep.status = "completed";
              emit("hierarchy_step_done", { workflowId: wf.id, stepId: nextStep.id, passed: true });
            } else if (nextStep.attempts < nextStep.maxAttempts) {
              nextStep.status = "pending";
              nextStep.criticFeedback = validation.blockers.join("; ") || "Validation failed";
              emit("hierarchy_step_retry", { workflowId: wf.id, stepId: nextStep.id, attempt: nextStep.attempts });
            } else {
              nextStep.status = "failed";
              emit("hierarchy_step_done", { workflowId: wf.id, stepId: nextStep.id, passed: false });
              // Check if this is a critical failure
              if (validation.blockers.length > 0) {
                transition(wf, "blocked", `Step "${nextStep.description}" blocked: ${validation.blockers[0]}`);
                break;
              }
            }
          } catch (err) {
            nextStep.status = nextStep.attempts < nextStep.maxAttempts ? "pending" : "failed";
            nextStep.output = err instanceof Error ? err.message : String(err);
            nextStep.completedAt = new Date().toISOString();
            nextStep.durationMs = Date.now() - new Date(nextStep.startedAt!).getTime();
            emit("hierarchy_step_error", { workflowId: wf.id, stepId: nextStep.id, error: nextStep.output });

            if (nextStep.status === "failed") {
              transition(wf, "revision", `Step failed after ${nextStep.attempts} attempts`);
            }
          }
          break;
        }

        case "criticizing": {
          emit("hierarchy_phase", { workflowId: wf.id, phase: "criticizing" });
          if (!wf.plan) { transition(wf, "failed", "No plan to criticize"); break; }

          // Compile all outputs
          const allOutputs = wf.plan.steps
            .filter(s => s.status === "completed" && s.output)
            .map(s => `## Step ${s.index + 1}: ${s.description}\n${s.output!.slice(0, 1000)}`)
            .join("\n\n");

          const review = await criticize("final_output", wf.id, allOutputs, wf.goal);
          wf.criticReviews.push(review);
          emit("hierarchy_review", { workflowId: wf.id, review });

          if (review.recommendation === "reject") {
            const failedSteps = review.issues
              .filter(i => i.severity === "critical" || i.severity === "high")
              .map(i => i.category);
            if (failedSteps.length > 0 && wf.plan.revisionCount < 3) {
              transition(wf, "revision", `Final review rejected: ${review.reasoning.slice(0, 100)}`);
            } else {
              transition(wf, "failed", `Final review rejected after max revisions`);
            }
          } else if (review.recommendation === "revise" && wf.plan.revisionCount < 3) {
            // Mark specific steps for re-execution based on issues
            for (const issue of review.issues.filter(i => i.severity === "high" || i.severity === "critical")) {
              const step = wf.plan.steps.find(s => s.description.toLowerCase().includes(issue.category.toLowerCase()));
              if (step && step.attempts < step.maxAttempts) {
                step.status = "pending";
                step.criticFeedback = issue.suggestion;
              }
            }
            transition(wf, "executing", `Revising based on critic feedback (score: ${review.overallScore})`);
          } else {
            transition(wf, "validating", `Critic approved (score: ${review.overallScore})`);
          }
          break;
        }

        case "validating": {
          emit("hierarchy_phase", { workflowId: wf.id, phase: "validating" });
          if (!wf.plan) { transition(wf, "failed", "No plan to validate"); break; }

          // Final validation of complete output
          const finalOutput = wf.plan.steps
            .filter(s => s.status === "completed" && s.output)
            .map(s => s.output!)
            .join("\n\n---\n\n");

          const validation = await validate(finalOutput, wf.goal, "Complete workflow output");

          if (validation.passed) {
            wf.finalOutput = finalOutput;
            wf.completedAt = new Date().toISOString();
            wf.totalDurationMs = Date.now() - startTime;
            transition(wf, "completed", "All validations passed");
          } else if (validation.blockers.length > 0) {
            transition(wf, "blocked", `Validation blocked: ${validation.blockers[0]}`);
          } else if (wf.plan.revisionCount < 3) {
            transition(wf, "revision", "Validation failed, revising");
          } else {
            // Accept with warnings after max revisions
            wf.finalOutput = finalOutput;
            wf.completedAt = new Date().toISOString();
            wf.totalDurationMs = Date.now() - startTime;
            wf.metadata.validationWarnings = validation.checks.filter(c => !c.passed).map(c => c.message);
            transition(wf, "completed", "Accepted with warnings after max revisions");
          }
          break;
        }

        case "revision": {
          emit("hierarchy_phase", { workflowId: wf.id, phase: "revision" });
          if (!wf.plan) { transition(wf, "failed", "No plan to revise"); break; }

          wf.plan.revisionCount++;
          wf.plan.revisedAt = new Date().toISOString();

          // Check if there are pending steps to re-execute
          const hasPending = wf.plan.steps.some(s => s.status === "pending");
          if (hasPending) {
            transition(wf, "executing", `Revision ${wf.plan.revisionCount}: re-executing pending steps`);
          } else {
            // Re-plan from scratch
            transition(wf, "planning", `Revision ${wf.plan.revisionCount}: full re-plan`);
          }
          break;
        }

        default:
          break;
      }

      saveState();
    }

    if (iterations >= MAX_ITERATIONS) {
      wf.metadata.maxIterationsReached = true;
      if (!["completed", "failed", "blocked"].includes(wf.state)) {
        transition(wf, "failed", "Max iterations reached");
      }
    }

  } catch (err) {
    wf.metadata.lastError = err instanceof Error ? err.message : String(err);
    if (!["completed", "failed"].includes(wf.state)) {
      transition(wf, "failed", `Unexpected error: ${wf.metadata.lastError}`);
    }
  }

  wf.totalDurationMs = Date.now() - startTime;
  saveState();
}

// ─── Helpers ────────────────────────────────────────────────

function findNextStep(plan: Plan): PlanStep | null {
  for (const step of plan.steps) {
    if (step.status !== "pending") continue;

    // Check dependencies
    const depsOk = step.dependencies.every(depId => {
      const dep = plan.steps.find(s => s.id === depId);
      return dep && dep.status === "completed";
    });

    if (depsOk) return step;
  }
  return null;
}

function buildStepContext(plan: Plan, step: PlanStep): string {
  const parts: string[] = [];
  for (const depId of step.dependencies) {
    const dep = plan.steps.find(s => s.id === depId);
    if (dep?.output) {
      parts.push(`[Step ${dep.index + 1}: ${dep.description}]\n${dep.output.slice(0, 1500)}`);
    }
  }
  // Also include most recent completed step if not in dependencies
  const lastCompleted = [...plan.steps]
    .filter(s => s.status === "completed" && s.output && !step.dependencies.includes(s.id))
    .pop();
  if (lastCompleted?.output) {
    parts.push(`[Previous: ${lastCompleted.description}]\n${lastCompleted.output.slice(0, 800)}`);
  }
  return parts.join("\n\n");
}

// ─── API Functions ──────────────────────────────────────────

export function getWorkflow(id: string): HierarchyWorkflow | null {
  return workflows.get(id) || null;
}

export function listWorkflows(limit = 20): HierarchyWorkflow[] {
  return Array.from(workflows.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getHierarchyStats(): HierarchyStats {
  const all = Array.from(workflows.values());
  const completed = all.filter(w => w.state === "completed");
  const failed = all.filter(w => w.state === "failed");
  const active = all.filter(w => !["completed", "failed", "idle", "blocked"].includes(w.state));

  const allReviews = all.flatMap(w => w.criticReviews);
  const avgCritic = allReviews.length > 0
    ? allReviews.reduce((s, r) => s + r.overallScore, 0) / allReviews.length
    : 0;

  const allSteps = all.flatMap(w => w.plan?.steps || []);
  const validatedSteps = allSteps.filter(s => s.validationResult);
  const passRate = validatedSteps.length > 0
    ? validatedSteps.filter(s => s.validationResult!.passed).length / validatedSteps.length
    : 0;

  const plansWithSteps = all.filter(w => w.plan && w.plan.steps.length > 0);
  const avgSteps = plansWithSteps.length > 0
    ? plansWithSteps.reduce((s, w) => s + w.plan!.steps.length, 0) / plansWithSteps.length
    : 0;

  const avgRevisions = all.length > 0
    ? all.reduce((s, w) => s + (w.plan?.revisionCount || 0), 0) / all.length
    : 0;

  return {
    totalWorkflows: all.length,
    completedWorkflows: completed.length,
    failedWorkflows: failed.length,
    avgStepsPerPlan: Math.round(avgSteps * 10) / 10,
    avgRevisionsPerWorkflow: Math.round(avgRevisions * 10) / 10,
    avgCriticScore: Math.round(avgCritic * 10) / 10,
    validationPassRate: Math.round(passRate * 100) / 100,
    totalTokens: all.reduce((s, w) => s + w.tokenUsage.planning + w.tokenUsage.execution + w.tokenUsage.criticism + w.tokenUsage.validation, 0),
    activeWorkflows: active.length,
  };
}

export function cancelWorkflow(id: string): boolean {
  const wf = workflows.get(id);
  if (!wf || ["completed", "failed"].includes(wf.state)) return false;
  transition(wf, "failed", "Cancelled by user");
  saveState();
  return true;
}

export function retryWorkflow(id: string): HierarchyWorkflow | null {
  const wf = workflows.get(id);
  if (!wf || !["failed", "blocked"].includes(wf.state)) return null;

  // Reset to planning
  if (wf.plan) {
    for (const step of wf.plan.steps) {
      if (step.status === "failed" || step.status === "blocked") {
        step.status = "pending";
        step.output = null;
        step.validationResult = null;
      }
    }
  }

  transition(wf, "planning", "Retried by user");
  // Run async
  runStateMachine(wf).catch(err => {
    console.error("[hierarchy] Retry error:", err);
  });

  return wf;
}
