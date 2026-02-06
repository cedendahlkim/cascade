/**
 * Cascade AI API Wrapper
 * 
 * REST API endpoints for programmatic access to the AI agent:
 * - POST /cascade/chat       - General chat
 * - POST /cascade/code       - Code generation
 * - POST /cascade/analyze    - Code analysis
 * - POST /cascade/refactor   - Code refactoring
 * - POST /cascade/review     - Code review
 * - POST /cascade/explain    - Explain code
 * - POST /cascade/test       - Generate tests
 * - POST /cascade/webhook    - Webhook handler (GitHub etc)
 * - GET  /cascade/status     - API status
 */
import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router = Router();

// --- Auth middleware ---

const API_KEYS = new Map<string, { name: string; role: string; created: string }>();

// Load keys from env: CASCADE_API_KEYS=key1:name1,key2:name2
if (process.env.CASCADE_API_KEYS) {
  for (const entry of process.env.CASCADE_API_KEYS.split(",")) {
    const [key, name] = entry.split(":");
    if (key) {
      API_KEYS.set(key.trim(), {
        name: name?.trim() || "default",
        role: "user",
        created: new Date().toISOString(),
      });
    }
  }
}

// Master key from env
if (process.env.CASCADE_MASTER_KEY) {
  API_KEYS.set(process.env.CASCADE_MASTER_KEY, {
    name: "master",
    role: "admin",
    created: new Date().toISOString(),
  });
}

function authMiddleware(req: Request, res: Response, next: () => void) {
  // If no keys configured, allow all (dev mode)
  if (API_KEYS.size === 0) {
    (req as any).apiUser = { name: "dev", role: "admin" };
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (req.headers["x-api-key"] as string) || (req.query.api_key as string);

  if (!apiKey || !API_KEYS.has(apiKey)) {
    res.status(401).json({ error: "Invalid or missing API key", hint: "Use Authorization: Bearer <key> or X-API-Key header" });
    return;
  }

  (req as any).apiUser = API_KEYS.get(apiKey);
  next();
}

router.use(authMiddleware);

// --- Anthropic client (separate from main agent for isolated conversations) ---

let client: Anthropic | null = null;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

// --- Task-specific system prompts ---

const PROMPTS: Record<string, string> = {
  chat: `You are Cascade Remote API, a helpful AI assistant. Be concise and direct. Respond in the same language as the user.`,

  code: `You are Cascade Code Generator. Generate clean, production-ready code based on the requirements.
Rules:
- Write complete, runnable code with all imports
- Follow best practices for the specified language
- Add brief inline comments for complex logic
- Return ONLY code in a fenced code block unless explanation is requested
- If language is not specified, use TypeScript`,

  analyze: `You are Cascade Code Analyzer. Analyze the provided code thoroughly.
Provide:
1. **Summary** - What the code does
2. **Quality** - Code quality score (1-10) with justification
3. **Issues** - Bugs, security issues, performance problems
4. **Suggestions** - Specific improvements with code examples
Be concise but thorough.`,

  refactor: `You are Cascade Refactoring Expert. Refactor the provided code to improve quality.
Rules:
- Maintain exact same functionality
- Improve readability, performance, and maintainability
- Apply SOLID principles where applicable
- Show the refactored code in a fenced code block
- Briefly explain key changes made`,

  review: `You are Cascade Code Reviewer. Review the code as a senior engineer would.
Provide:
1. **Verdict** - APPROVE, REQUEST_CHANGES, or COMMENT
2. **Summary** - Brief overview
3. **Issues** - Categorized as critical/warning/info
4. **Suggestions** - Actionable improvements
Format as a structured review.`,

  explain: `You are Cascade Code Explainer. Explain the provided code clearly.
- Start with a one-line summary
- Break down the logic step by step
- Explain any complex patterns or algorithms
- Note any potential issues
- Keep it accessible but technically accurate`,

  test: `You are Cascade Test Generator. Generate comprehensive tests for the provided code.
Rules:
- Use the testing framework specified (default: Jest for JS/TS, pytest for Python)
- Cover happy path, edge cases, and error cases
- Use descriptive test names
- Include setup/teardown if needed
- Return complete, runnable test code`,
};

// --- Request tracking ---

interface ApiRequest {
  id: string;
  endpoint: string;
  user: string;
  timestamp: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

const requestLog: ApiRequest[] = [];
const MAX_LOG = 200;

function logRequest(entry: ApiRequest) {
  requestLog.push(entry);
  if (requestLog.length > MAX_LOG) requestLog.shift();
}

// --- Core handler ---

async function handleTask(
  task: string,
  body: { prompt?: string; code?: string; language?: string; context?: string; max_tokens?: number },
): Promise<{ response: string; usage: { input_tokens: number; output_tokens: number }; model: string }> {
  const anthropic = getClient();
  const systemPrompt = PROMPTS[task] || PROMPTS.chat;

  // Build user message
  let userMessage = "";
  if (body.code) {
    const lang = body.language || "";
    userMessage += `\`\`\`${lang}\n${body.code}\n\`\`\`\n\n`;
  }
  if (body.prompt) {
    userMessage += body.prompt;
  }
  if (body.context) {
    userMessage += `\n\nAdditional context: ${body.context}`;
  }
  if (body.language && !body.code) {
    userMessage += `\n\nLanguage: ${body.language}`;
  }

  if (!userMessage.trim()) {
    throw new Error("No prompt or code provided");
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: body.max_tokens || 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return {
    response: text,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
    model: MODEL,
  };
}

// --- Endpoint factory ---

function createEndpoint(task: string) {
  return async (req: Request, res: Response) => {
    const start = Date.now();
    const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      const result = await handleTask(task, req.body);

      logRequest({
        id: reqId,
        endpoint: task,
        user: (req as any).apiUser?.name || "unknown",
        timestamp: new Date().toISOString(),
        inputTokens: result.usage.input_tokens,
        outputTokens: result.usage.output_tokens,
        durationMs: Date.now() - start,
      });

      res.json({
        id: reqId,
        task,
        ...result,
        duration_ms: Date.now() - start,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(msg.includes("No prompt") ? 400 : 500).json({
        id: reqId,
        error: msg,
        task,
      });
    }
  };
}

// --- Routes ---

router.post("/chat", createEndpoint("chat"));
router.post("/code", createEndpoint("code"));
router.post("/analyze", createEndpoint("analyze"));
router.post("/refactor", createEndpoint("refactor"));
router.post("/review", createEndpoint("review"));
router.post("/explain", createEndpoint("explain"));
router.post("/test", createEndpoint("test"));

// --- Webhook handler ---

router.post("/webhook", async (req: Request, res: Response) => {
  const start = Date.now();
  const reqId = `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const { source, event, data } = req.body;

    let task = "review";
    let prompt = "";
    let code = "";

    // GitHub webhook
    if (source === "github" || req.headers["x-github-event"]) {
      const ghEvent = (req.headers["x-github-event"] as string) || event;

      if (ghEvent === "push" || ghEvent === "pull_request") {
        const commits = data?.commits || req.body.commits || [];
        const pr = data?.pull_request || req.body.pull_request;

        if (pr) {
          prompt = `Review this pull request:\nTitle: ${pr.title}\nDescription: ${pr.body || "None"}\n`;
          code = pr.diff || pr.patch || "";
          task = "review";
        } else if (commits.length > 0) {
          prompt = `Review these commits:\n${commits.map((c: any) => `- ${c.message}`).join("\n")}`;
          code = commits.map((c: any) => c.patch || "").join("\n");
          task = "review";
        }
      }
    }

    // Generic webhook
    if (!prompt && data?.code) {
      code = data.code;
      prompt = data.prompt || `${event || "analyze"} this code`;
      task = data.task || "analyze";
    }

    if (!prompt && !code) {
      res.json({ id: reqId, status: "ignored", reason: "No actionable data in webhook" });
      return;
    }

    const result = await handleTask(task, { prompt, code });

    logRequest({
      id: reqId,
      endpoint: `webhook:${source || "unknown"}`,
      user: (req as any).apiUser?.name || "webhook",
      timestamp: new Date().toISOString(),
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
      durationMs: Date.now() - start,
    });

    res.json({
      id: reqId,
      source: source || "unknown",
      event: event || req.headers["x-github-event"] || "unknown",
      task,
      ...result,
      duration_ms: Date.now() - start,
    });
  } catch (err) {
    res.status(500).json({ id: reqId, error: err instanceof Error ? err.message : String(err) });
  }
});

// --- Status & metrics ---

router.get("/status", (_req: Request, res: Response) => {
  const totalRequests = requestLog.length;
  const totalTokens = requestLog.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);
  const avgDuration = totalRequests > 0
    ? Math.round(requestLog.reduce((sum, r) => sum + r.durationMs, 0) / totalRequests)
    : 0;

  const byEndpoint: Record<string, number> = {};
  for (const r of requestLog) {
    byEndpoint[r.endpoint] = (byEndpoint[r.endpoint] || 0) + 1;
  }

  res.json({
    status: "online",
    model: MODEL,
    auth_required: API_KEYS.size > 0,
    endpoints: Object.keys(PROMPTS),
    metrics: {
      total_requests: totalRequests,
      total_tokens: totalTokens,
      avg_duration_ms: avgDuration,
      by_endpoint: byEndpoint,
    },
    recent: requestLog.slice(-10).reverse(),
  });
});

// --- API docs ---

router.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Cascade Remote API",
    version: "1.0.0",
    endpoints: {
      "POST /cascade/chat": { desc: "General AI chat", body: { prompt: "string" } },
      "POST /cascade/code": { desc: "Generate code", body: { prompt: "string", language: "string?" } },
      "POST /cascade/analyze": { desc: "Analyze code", body: { code: "string", prompt: "string?" } },
      "POST /cascade/refactor": { desc: "Refactor code", body: { code: "string", language: "string?" } },
      "POST /cascade/review": { desc: "Code review", body: { code: "string", context: "string?" } },
      "POST /cascade/explain": { desc: "Explain code", body: { code: "string" } },
      "POST /cascade/test": { desc: "Generate tests", body: { code: "string", language: "string?" } },
      "POST /cascade/webhook": { desc: "Webhook handler", body: { source: "string", event: "string", data: "object" } },
      "GET  /cascade/status": { desc: "API status & metrics" },
    },
    auth: "Bearer token via Authorization header, X-API-Key header, or ?api_key= query param",
  });
});

export default router;
