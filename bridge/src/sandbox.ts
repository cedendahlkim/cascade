/**
 * Arena Sandbox — Isolated execution environment for AI agents
 * 
 * Allows AI agents to write, execute, and test code during Arena sessions.
 * Each session gets its own temp directory with isolated file system.
 * Supports: JavaScript/TypeScript, Python, shell commands.
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync, statSync } from "fs";
import { join, basename, extname } from "path";
import { tmpdir } from "os";
import { execSync, spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";

// --- Types ---

export interface SandboxSession {
  id: string;
  arenaSessionId: string;
  createdAt: string;
  workDir: string;
  executions: SandboxExecution[];
}

export interface SandboxExecution {
  id: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  language: SandboxLanguage;
  code: string;
  filename: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timestamp: string;
  status: "success" | "error" | "timeout";
}

export interface SandboxFile {
  name: string;
  path: string;
  size: number;
  language: string;
  content?: string;
}

export type SandboxLanguage = "javascript" | "typescript" | "python" | "shell";

// --- Constants ---

const SANDBOX_ROOT = join(tmpdir(), "cascade-arena-sandbox");
const EXECUTION_TIMEOUT_MS = 15_000; // 15 seconds max per execution
const MAX_OUTPUT_LENGTH = 10_000; // Truncate output at 10k chars
const MAX_FILE_SIZE = 50_000; // Max 50KB per file

// Language configs
const LANG_CONFIG: Record<SandboxLanguage, { ext: string; cmd: (file: string) => string }> = {
  javascript: { ext: ".js", cmd: (f) => `node "${f}"` },
  typescript: { ext: ".ts", cmd: (f) => `npx tsx "${f}"` },
  python: { ext: ".py", cmd: (f) => `python "${f}"` },
  shell: { ext: ".sh", cmd: (f) => process.platform === "win32" ? `powershell -File "${f}"` : `bash "${f}"` },
};

// --- State ---

const sessions = new Map<string, SandboxSession>();

// Ensure sandbox root exists
if (!existsSync(SANDBOX_ROOT)) {
  mkdirSync(SANDBOX_ROOT, { recursive: true });
}

// --- Core Functions ---

/** Create a new sandbox session tied to an Arena session */
export function createSandboxSession(arenaSessionId: string): SandboxSession {
  const id = uuidv4();
  const workDir = join(SANDBOX_ROOT, id);
  mkdirSync(workDir, { recursive: true });

  const session: SandboxSession = {
    id,
    arenaSessionId,
    createdAt: new Date().toISOString(),
    workDir,
    executions: [],
  };

  sessions.set(id, session);
  console.log(`[sandbox] Created session ${id} for arena ${arenaSessionId}`);
  return session;
}

/** Get or create sandbox session for an Arena session */
export function getSandboxForArena(arenaSessionId: string): SandboxSession {
  for (const s of sessions.values()) {
    if (s.arenaSessionId === arenaSessionId) return s;
  }
  return createSandboxSession(arenaSessionId);
}

/** Execute code in the sandbox */
export function executeSandbox(
  sessionId: string,
  agentId: string,
  agentName: string,
  code: string,
  language: SandboxLanguage = "javascript",
  filename?: string,
): SandboxExecution {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Sandbox session ${sessionId} not found`);

  const config = LANG_CONFIG[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const execId = uuidv4();
  const fname = filename || `${agentId}-${execId.slice(0, 8)}${config.ext}`;
  const filePath = join(session.workDir, fname);

  // Write code to file
  writeFileSync(filePath, code, "utf-8");

  // Execute with timeout
  const startTime = Date.now();
  let stdout = "";
  let stderr = "";
  let exitCode: number | null = null;
  let status: "success" | "error" | "timeout" = "success";

  try {
    const result = execSync(config.cmd(filePath), {
      cwd: session.workDir,
      timeout: EXECUTION_TIMEOUT_MS,
      maxBuffer: 1024 * 1024, // 1MB
      encoding: "utf-8",
      env: {
        ...process.env,
        NODE_PATH: join(process.cwd(), "node_modules"),
        SANDBOX_SESSION: sessionId,
        SANDBOX_WORKDIR: session.workDir,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    stdout = truncateOutput(result || "");
    exitCode = 0;
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; status?: number; killed?: boolean };
    stdout = truncateOutput(execErr.stdout || "");
    stderr = truncateOutput(execErr.stderr || "");
    exitCode = execErr.status ?? 1;

    if (execErr.killed) {
      status = "timeout";
      stderr += `\n[SANDBOX] Execution timed out after ${EXECUTION_TIMEOUT_MS / 1000}s`;
    } else {
      status = "error";
    }
  }

  const durationMs = Date.now() - startTime;

  const execution: SandboxExecution = {
    id: execId,
    sessionId,
    agentId,
    agentName,
    language,
    code,
    filename: fname,
    stdout,
    stderr,
    exitCode,
    durationMs,
    timestamp: new Date().toISOString(),
    status,
  };

  session.executions.push(execution);
  console.log(`[sandbox] ${agentName} executed ${fname} (${language}) → ${status} in ${durationMs}ms`);

  return execution;
}

/** Write a file to the sandbox working directory */
export function writeSandboxFile(sessionId: string, filename: string, content: string): SandboxFile {
  const session = sessions.get(sessionId);
  if (!session) throw new Error(`Sandbox session ${sessionId} not found`);

  if (content.length > MAX_FILE_SIZE) {
    throw new Error(`File too large (${content.length} > ${MAX_FILE_SIZE})`);
  }

  const filePath = join(session.workDir, filename);
  writeFileSync(filePath, content, "utf-8");

  return {
    name: filename,
    path: filePath,
    size: content.length,
    language: detectLanguage(filename),
  };
}

/** Read a file from the sandbox */
export function readSandboxFile(sessionId: string, filename: string): SandboxFile | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const filePath = join(session.workDir, filename);
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, "utf-8");
  return {
    name: filename,
    path: filePath,
    size: content.length,
    language: detectLanguage(filename),
    content,
  };
}

/** List all files in a sandbox session */
export function listSandboxFiles(sessionId: string): SandboxFile[] {
  const session = sessions.get(sessionId);
  if (!session || !existsSync(session.workDir)) return [];

  return readdirSync(session.workDir)
    .filter(f => {
      const fp = join(session.workDir, f);
      return existsSync(fp) && statSync(fp).isFile();
    })
    .map(f => {
      const fp = join(session.workDir, f);
      const stat = statSync(fp);
      return {
        name: f,
        path: fp,
        size: stat.size,
        language: detectLanguage(f),
      };
    });
}

/** Get all executions for a session */
export function getSandboxExecutions(sessionId: string): SandboxExecution[] {
  return sessions.get(sessionId)?.executions || [];
}

/** Get sandbox session info */
export function getSandboxSession(sessionId: string): SandboxSession | undefined {
  return sessions.get(sessionId);
}

/** Get sandbox session by arena session ID */
export function getSandboxByArena(arenaSessionId: string): SandboxSession | undefined {
  for (const s of sessions.values()) {
    if (s.arenaSessionId === arenaSessionId) return s;
  }
  return undefined;
}

/** Clean up a sandbox session */
export function destroySandboxSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  try {
    rmSync(session.workDir, { recursive: true, force: true });
  } catch {}
  sessions.delete(sessionId);
  console.log(`[sandbox] Destroyed session ${sessionId}`);
}

/** Parse sandbox commands from AI agent responses */
export function parseSandboxCommands(content: string): Array<{
  language: SandboxLanguage;
  code: string;
  filename?: string;
  description?: string;
}> {
  const commands: Array<{
    language: SandboxLanguage;
    code: string;
    filename?: string;
    description?: string;
  }> = [];

  // Match [SANDBOX:language] or [SANDBOX:language:filename] blocks
  const sandboxRegex = /\[SANDBOX(?::(\w+))?(?::([^\]]+))?\]\s*(?:\(([^)]+)\))?\s*```[\w]*\n([\s\S]*?)```/g;
  let match;

  while ((match = sandboxRegex.exec(content)) !== null) {
    const lang = (match[1] || "javascript").toLowerCase() as SandboxLanguage;
    const filename = match[2] || undefined;
    const description = match[3] || undefined;
    const code = match[4].trim();

    if (code && LANG_CONFIG[lang]) {
      commands.push({ language: lang, code, filename, description });
    }
  }

  // Also match simpler format: [KÖR] or [TEST] code blocks
  const simpleRegex = /\[(?:KÖR|TEST|RUN|EXEC)\]\s*```(\w+)?\n([\s\S]*?)```/g;
  while ((match = simpleRegex.exec(content)) !== null) {
    const langHint = (match[1] || "javascript").toLowerCase();
    const lang = mapLanguage(langHint);
    const code = match[2].trim();

    if (code && LANG_CONFIG[lang]) {
      commands.push({ language: lang, code });
    }
  }

  return commands;
}

/** Format execution result for display in Arena */
export function formatExecutionResult(exec: SandboxExecution): string {
  const statusEmoji = exec.status === "success" ? "✅" : exec.status === "timeout" ? "⏱️" : "❌";
  const lines = [
    `${statusEmoji} **Sandbox: ${exec.filename}** (${exec.language}, ${exec.durationMs}ms)`,
  ];

  if (exec.stdout) {
    lines.push("```");
    lines.push(exec.stdout);
    lines.push("```");
  }

  if (exec.stderr) {
    lines.push("**Fel:**");
    lines.push("```");
    lines.push(exec.stderr);
    lines.push("```");
  }

  return lines.join("\n");
}

// --- Helpers ---

function truncateOutput(output: string): string {
  if (output.length > MAX_OUTPUT_LENGTH) {
    return output.slice(0, MAX_OUTPUT_LENGTH) + `\n... (trunkerad, ${output.length} tecken totalt)`;
  }
  return output;
}

function detectLanguage(filename: string): string {
  const ext = extname(filename).toLowerCase();
  const map: Record<string, string> = {
    ".js": "javascript", ".mjs": "javascript",
    ".ts": "typescript", ".tsx": "typescript",
    ".py": "python",
    ".sh": "shell", ".bash": "shell", ".ps1": "shell",
    ".json": "json", ".md": "markdown", ".txt": "text",
    ".html": "html", ".css": "css",
  };
  return map[ext] || "text";
}

function mapLanguage(hint: string): SandboxLanguage {
  const map: Record<string, SandboxLanguage> = {
    js: "javascript", javascript: "javascript", node: "javascript",
    ts: "typescript", typescript: "typescript", tsx: "typescript",
    py: "python", python: "python", python3: "python",
    sh: "shell", bash: "shell", powershell: "shell", ps1: "shell",
  };
  return map[hint] || "javascript";
}
