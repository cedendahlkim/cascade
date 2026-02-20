/**
 * Workspace Routes — Filsystem, terminal och AI-styrning för kodeditor.
 *
 * Ger Frankenstein AI full kontroll över:
 * - Filsystem (läsa, skriva, skapa, ta bort, byta namn, söka)
 * - Terminal (PTY-sessioner via Socket.IO)
 * - AI-agentåtgärder (redigera, generera, förklara, köra kommandon)
 */

import { Router, Request, Response } from "express";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  renameSync,
  statSync,
  readdirSync,
} from "fs";
import { join, relative, extname, basename, dirname, sep } from "path";
import { spawn, ChildProcess, exec } from "child_process";
import type { Server as SocketServer, Socket } from "socket.io";
import { Agent } from "./agent.js";
import { GeminiAgent } from "./agent-gemini.js";

// ── Constants ──

const WORKSPACE_ROOT =
  process.env.CASCADE_REMOTE_WORKSPACE ||
  join(
    dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")),
    "..",
    ".."
  );

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "__pycache__",
  ".venv",
  "venv",
  "dist",
  ".next",
  ".cache",
  "coverage",
  ".mypy_cache",
  ".pytest_cache",
  "egg-info",
]);

const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db", ".env"]);

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB — refuse to read larger files
const MAX_SEARCH_RESULTS = 100;

// ── Helpers ──

/** Resolve and validate a path is inside WORKSPACE_ROOT. */
function safePath(relPath: string): string | null {
  const resolved = join(WORKSPACE_ROOT, relPath);
  const rel = relative(WORKSPACE_ROOT, resolved);
  if (rel.startsWith("..") || rel.startsWith(sep + sep)) return null;
  return resolved;
}

type ShellRunner = "host" | "kali" | "kali_sandbox";

const KALI_CONTAINER_NAME = process.env.KALI_CONTAINER_NAME || "gracestack-kali";
const KALI_WORKSPACE_ROOT = process.env.KALI_WORKSPACE_ROOT || WORKSPACE_ROOT;
const KALI_SANDBOX_CONTAINER_NAME = process.env.KALI_SANDBOX_CONTAINER_NAME || "gracestack-kali-sandbox";
const KALI_SANDBOX_WORKDIR = process.env.KALI_SANDBOX_WORKDIR || join(WORKSPACE_ROOT, "ctf", "workspace");

function bashSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function mapWorkspaceCwdToKali(hostAbsCwd: string): string {
  try {
    const rel = relative(WORKSPACE_ROOT, hostAbsCwd);
    if (rel.startsWith("..")) return KALI_WORKSPACE_ROOT;
    return join(KALI_WORKSPACE_ROOT, rel);
  } catch {
    return KALI_WORKSPACE_ROOT;
  }
}

async function runShellCommand(
  command: string,
  execCwd: string,
  timeoutMs: number,
  runner: ShellRunner,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const clamp = (value: unknown, max = 20_000) => String(value ?? "").slice(0, max);

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";

    if (runner === "kali" || runner === "kali_sandbox") {
      if (process.platform === "win32") {
        resolve({ stdout: "", stderr: "Kali runner is only supported on Linux Docker deployments.", exitCode: 1 });
        return;
      }

      const container = runner === "kali_sandbox" ? KALI_SANDBOX_CONTAINER_NAME : KALI_CONTAINER_NAME;
      const kaliCwd = runner === "kali_sandbox" ? KALI_SANDBOX_WORKDIR : mapWorkspaceCwdToKali(execCwd);

      if (runner === "kali_sandbox" && !execCwd.startsWith(KALI_SANDBOX_WORKDIR)) {
        resolve({ stdout: "", stderr: `runner='kali_sandbox' requires cwd under: ${KALI_SANDBOX_WORKDIR}`, exitCode: 1 });
        return;
      }

      const cmd = `cd ${bashSingleQuote(kaliCwd)} && ${command}`;
      const proc = spawn(
        "docker",
        ["exec", "-i", container, "bash", "-lc", cmd],
        { timeout: timeoutMs, env: { ...process.env, PYTHONIOENCODING: "utf-8" } },
      );

      proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
      proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });
      proc.on("close", (code) => resolve({ stdout: clamp(stdout), stderr: clamp(stderr), exitCode: code ?? 1 }));
      proc.on("error", (err) => resolve({ stdout: clamp(stdout), stderr: clamp(String(err)), exitCode: 1 }));
      return;
    }

    const isWin = process.platform === "win32";
    const sh = isWin ? "cmd.exe" : "/bin/bash";
    const args = isWin ? ["/c", command] : ["-c", command];
    const proc = spawn(sh, args, {
      cwd: execCwd,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      timeout: timeoutMs,
    });
    proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
    proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });
    proc.on("close", (code) => resolve({ stdout: clamp(stdout), stderr: clamp(stderr), exitCode: code ?? 1 }));
    proc.on("error", (err) => resolve({ stdout: clamp(stdout), stderr: clamp(String(err)), exitCode: 1 }));
  });
}

/** Language ID from file extension (for Monaco). */
function langFromExt(ext: string): string {
  const map: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescriptreact",
    ".js": "javascript",
    ".jsx": "javascriptreact",
    ".py": "python",
    ".json": "json",
    ".md": "markdown",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".sh": "shell",
    ".bash": "shell",
    ".sql": "sql",
    ".rs": "rust",
    ".go": "go",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".rb": "ruby",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".lua": "lua",
    ".r": "r",
    ".xml": "xml",
    ".svg": "xml",
    ".txt": "plaintext",
    ".log": "plaintext",
    ".env": "plaintext",
    ".gitignore": "plaintext",
    ".dockerfile": "dockerfile",
    ".conf": "plaintext",
  };
  return map[ext.toLowerCase()] || "plaintext";
}

interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  language?: string;
  children?: FileTreeNode[];
}

/** Build a file tree recursively. */
function buildTree(absPath: string, depth: number = 0, maxDepth: number = 6): FileTreeNode[] {
  if (depth > maxDepth) return [];
  const entries = readdirSync(absPath, { withFileTypes: true });
  const result: FileTreeNode[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name) && entry.isDirectory()) continue;
    if (IGNORED_FILES.has(entry.name)) continue;
    if (entry.name.startsWith(".") && entry.isDirectory()) continue;

    const fullPath = join(absPath, entry.name);
    const relPath = relative(WORKSPACE_ROOT, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: relPath,
        type: "directory",
        children: buildTree(fullPath, depth + 1, maxDepth),
      });
    } else {
      const ext = extname(entry.name);
      try {
        const st = statSync(fullPath);
        result.push({
          name: entry.name,
          path: relPath,
          type: "file",
          size: st.size,
          language: langFromExt(ext),
        });
      } catch {
        // skip unreadable files
      }
    }
  }

  // Sort: directories first, then alphabetically
  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

/** Simple grep-like search in files. */
function searchFiles(
  dir: string,
  query: string,
  results: Array<{ path: string; line: number; content: string }>,
  depth: number = 0
): void {
  if (depth > 6 || results.length >= MAX_SEARCH_RESULTS) return;
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (results.length >= MAX_SEARCH_RESULTS) return;
    if (IGNORED_DIRS.has(entry.name) && entry.isDirectory()) continue;
    if (entry.name.startsWith(".") && entry.isDirectory()) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      searchFiles(fullPath, query, results, depth + 1);
    } else {
      try {
        const st = statSync(fullPath);
        if (st.size > MAX_FILE_SIZE) continue;
        const ext = extname(entry.name).toLowerCase();
        // Only search text-like files
        const textExts = new Set([
          ".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".md", ".html",
          ".css", ".scss", ".yaml", ".yml", ".toml", ".sh", ".sql",
          ".rs", ".go", ".java", ".c", ".cpp", ".h", ".hpp", ".rb",
          ".php", ".txt", ".log", ".conf", ".xml", ".svg", ".env",
          ".gitignore", ".dockerfile",
        ]);
        if (!textExts.has(ext)) continue;

        const content = readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        const lowerQuery = query.toLowerCase();

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= MAX_SEARCH_RESULTS) return;
          if (lines[i].toLowerCase().includes(lowerQuery)) {
            results.push({
              path: relative(WORKSPACE_ROOT, fullPath).replace(/\\/g, "/"),
              line: i + 1,
              content: lines[i].slice(0, 200),
            });
          }
        }
      } catch {
        // skip unreadable
      }
    }
  }
}

// ── Router ──

const router = Router();

/** GET /api/workspace/tree — File tree */
router.get("/tree", (_req: Request, res: Response) => {
  try {
    const tree = buildTree(WORKSPACE_ROOT);
    res.json({ root: WORKSPACE_ROOT, tree });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * POST /api/workspace/ai/mission
 *
 * Autopilot-style multi-step loop:
 * plan (Gemini JSON) → execute (edit/create/run) → optional verify (build/test) → repeat.
 */
router.post("/ai/mission", async (req: Request, res: Response) => {
  const {
    goal,
    currentFile,
    currentContent,
    openFiles,
    cwd,
    runner,
    verify,
    maxIterations,
  } = (req.body || {}) as {
    goal?: string;
    currentFile?: string | null;
    currentContent?: string | null;
    openFiles?: string[];
    cwd?: string;
    runner?: ShellRunner;
    verify?: { commands?: string[]; cwd?: string; runner?: ShellRunner };
    maxIterations?: number;
  };

  if (!goal || typeof goal !== "string" || goal.trim().length === 0) {
    return res.status(400).json({ error: "goal required" });
  }

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  const missionCwd = (() => {
    if (!cwd) return WORKSPACE_ROOT;
    const safe = safePath(String(cwd).replace(/^\/+/, ""));
    return safe || WORKSPACE_ROOT;
  })();

  const verifyCwd = (() => {
    const vcwd = verify?.cwd;
    if (!vcwd) return missionCwd;
    const safe = safePath(String(vcwd).replace(/^\/+/, ""));
    return safe || missionCwd;
  })();

  const missionRunner: ShellRunner = runner === "kali" ? "kali" : runner === "kali_sandbox" ? "kali_sandbox" : "host";
  const verifyRunner: ShellRunner = verify?.runner === "kali" ? "kali" : verify?.runner === "kali_sandbox" ? "kali_sandbox" : missionRunner;

  // If running in the locked-down sandbox, force execution cwd to the sandbox workdir.
  // This keeps file mutations contained and prevents accidental execution elsewhere.
  const effectiveMissionCwd = missionRunner === "kali_sandbox" ? KALI_SANDBOX_WORKDIR : missionCwd;
  const effectiveVerifyCwd = verifyRunner === "kali_sandbox" ? KALI_SANDBOX_WORKDIR : verifyCwd;

  const clamp = (value: unknown, max = 10_000) => String(value ?? "").slice(0, max);

  const verifyCommands: string[] = Array.isArray(verify?.commands)
    ? (verify?.commands as unknown[]).map(String).filter((c) => c.trim().length > 0)
    : [];

  try {
    const iterations: any[] = [];
    const maxIters = Math.max(1, Math.min(10, Number.isFinite(maxIterations as number) ? (maxIterations as number) : 3));
    let ok = false;
    let prev = "";

    for (let iter = 1; iter <= maxIters; iter++) {
      const kbContext = await searchArchonKB(goal, 2);

      const fileContext = currentContent && currentFile
        ? `FILINNEHÅLL (${currentFile}):\n\`\`\`\n${String(currentContent).slice(0, 6000)}\n\`\`\`\n`
        : "";

      const planPrompt = `Du är Frankenstein Autopilot. Du kan redigera filer och köra kommandon i en monorepo.

WORKSPACE ROOT: ${WORKSPACE_ROOT}
MISSION CWD: ${missionCwd}
${currentFile ? `AKTUELL FIL: ${currentFile}` : ""}
${openFiles?.length ? `ÖPPNA FILER: ${openFiles.join(", ")}` : ""}
${fileContext}

MISSION GOAL: ${goal}

${kbContext ? `KUNSKAPSBAS (Archon):\n${kbContext}\n` : ""}
${prev ? `SENASTE RESULTAT (JSON, truncated):\n${prev}\n` : ""}

Svara med EXAKT EN JSON-array med actions.
Tillgängliga actions:
- {"action":"edit","path":"relativ/sökväg","content":"HELA det nya filinnehållet"}
- {"action":"create","path":"relativ/sökväg","content":"filinnehåll"}
- {"action":"run","command":"shell-kommando","runner":"host|kali|kali_sandbox"}
- {"action":"done","text":"kort sammanfattning"}

REGLER:
- Vid edit/create: content måste vara HELA filen
- runner är valfri. Om runner saknas: använd mission runner (${missionRunner}).
- Returnera BARA JSON-arrayen (ingen markdown, inga code fences).`;

      const planRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: planPrompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 16384 },
          }),
        }
      );

      const planData = (await planRes.json()) as any;
      let planText = planData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      planText = String(planText).replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```$/i, "").trim();

      let actions: any[];
      try {
        actions = JSON.parse(planText);
        if (!Array.isArray(actions)) actions = [actions];
      } catch {
        iterations.push({ iteration: iter, ok: false, error: "Invalid JSON from model", raw: clamp(planText, 8000) });
        ok = false;
        break;
      }

      const results: any[] = [];
      for (const act of actions) {
        try {
          switch (act.action) {
            case "edit":
            case "create": {
              const relPath = String(act.path || "");
              const abs = safePath(relPath);
              if (!abs) {
                results.push({ ...act, success: false, error: "Path outside workspace" });
                break;
              }
              const dir = dirname(abs);
              if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
              const isNew = !existsSync(abs);
              writeFileSync(abs, String(act.content || ""), "utf-8");
              results.push({ action: isNew ? "create" : "edit", path: relPath, success: true, isNew });
              break;
            }
            case "run": {
              const cmd = String(act.command || "").trim();
              if (!cmd) {
                results.push({ action: "run", success: false, error: "command empty" });
                break;
              }
              const actRunner: ShellRunner = act.runner === "kali" ? "kali" : act.runner === "kali_sandbox" ? "kali_sandbox" : missionRunner;
              const r = await runShellCommand(cmd, effectiveMissionCwd, 120_000, actRunner);
              results.push({ action: "run", command: cmd, runner: actRunner, success: r.exitCode === 0, ...r });
              break;
            }
            case "done":
              results.push({ action: "done", success: true, text: String(act.text || "") });
              break;
            default:
              results.push({ action: act.action, success: false, error: "Unknown action" });
          }
        } catch (err) {
          results.push({ ...act, success: false, error: String(err) });
        }
      }

      const verifyResults: any[] = [];
      if (verifyCommands.length > 0) {
        for (const cmd of verifyCommands) {
          // eslint-disable-next-line no-await-in-loop
          const r = await runShellCommand(cmd, effectiveVerifyCwd, 240_000, verifyRunner);
          verifyResults.push({ command: cmd, runner: verifyRunner, success: r.exitCode === 0, ...r });
        }
      }

      const verifyOk = verifyResults.length > 0 ? verifyResults.every((v) => v.success) : true;
      const resultsOk = results.every((r) => r.success !== false);
      ok = verifyOk && resultsOk;

      iterations.push({ iteration: iter, actions, results, verify: verifyResults, ok });

      prev = clamp(JSON.stringify({ results, verify: verifyResults }, null, 2), 12_000);

      const hasDone = actions.some((a) => a?.action === "done");
      if (ok && hasDone) break;
    }

    res.json({
      goal,
      ok,
      runner: missionRunner,
      cwd: effectiveMissionCwd,
      verify_runner: verifyRunner,
      verify_cwd: effectiveVerifyCwd,
      iterations,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/**
 * POST /api/workspace/ai/doctor
 *
 * Kör en uppsättning kommandon (t.ex. "npm run build") i ett givet cwd under WORKSPACE_ROOT
 * och låter en AI-agent generera en markdown-rapport över resultatet.
 *
 * Body:
 * {
 *   commands: string[];
 *   cwd?: string; // relativ till WORKSPACE_ROOT, t.ex. "web" eller "bridge"
 * }
 */
router.post("/ai/doctor", async (req: Request, res: Response) => {
  const { commands, cwd } = req.body as { commands?: string[]; cwd?: string };

  if (!Array.isArray(commands) || commands.length === 0) {
    return res.status(400).json({ error: "commands must be a non-empty array" });
  }

  let execCwd = WORKSPACE_ROOT;
  if (cwd && typeof cwd === "string") {
    const safe = safePath(cwd.replace(/^\/+/, ""));
    if (!safe) return res.status(400).json({ error: "cwd outside workspace" });
    execCwd = safe;
  }

  const MAX_OUTPUT = 20_000; // bytes per stream

  const runCommand = (cmd: string) => new Promise<{ command: string; exitCode: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = exec(cmd, { cwd: execCwd, maxBuffer: MAX_OUTPUT * 2 }, (error, stdout, stderr) => {
      const exitCode = error && typeof (error as any).code === "number" ? (error as any).code : 0;
      resolve({
        command: cmd,
        exitCode,
        stdout: String(stdout || "").slice(0, MAX_OUTPUT),
        stderr: String(stderr || "").slice(0, MAX_OUTPUT),
      });
    });

    // Failsafe timeout 2 min per kommando
    setTimeout(() => {
      try { child.kill(); } catch { /* ignore */ }
    }, 120_000).unref();
  });

  try {
    const results: { command: string; exitCode: number | null; stdout: string; stderr: string }[] = [];
    for (const cmd of commands) {
      // Kör sekventiellt för att inte överbelasta systemet
      // eslint-disable-next-line no-await-in-loop
      const r = await runCommand(cmd);
      results.push(r);
    }

    // Bygg en sammanfattad logg till AI:n
    const summaryText = results.map(r => {
      return [
        `$ ${r.command}`,
        `exitCode: ${r.exitCode}`,
        r.stdout ? `stdout (truncated):\n${r.stdout}` : "stdout: <empty>",
        r.stderr ? `stderr (truncated):\n${r.stderr}` : "stderr: <empty>",
      ].join("\n");
    }).join("\n\n---\n\n");

    const systemPrompt = [
      "Du är en senior utvecklare som analyserar build/test/log-output.",
      "Du ska:",
      "1) Kort sammanfatta det övergripande hälsotillståndet (OK / har fel)",
      "2) Lista de allvarligaste felen först",
      "3) Föreslå konkreta nästa steg i punktform (kommandon, filer att titta på osv)",
      "Svara i Markdown med rubriker: ## Status, ## Allvarliga problem, ## Rekommenderade åtgärder.",
    ].join("\n");

    // Välj AI-agent: använd GeminiAgent om konfigurerad, annars main Agent
    const agent = new GeminiAgent({ name: "Doctor", role: "kod-doktor" });
    const hasGemini = agent.isEnabled();
    const fallbackAgent = new Agent();

    const prompt = [
      systemPrompt,
      "\n\n### Loggar från Code Doctor\n",
      summaryText,
    ].join("\n");

    const analysis = hasGemini
      ? await agent.respond(prompt)
      : await fallbackAgent.respond(prompt);

    res.json({
      cwd: execCwd,
      results,
      analysis,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /api/workspace/file?path=... — Read file */
router.get("/file", (req: Request, res: Response) => {
  const relPath = req.query.path as string;
  if (!relPath) return res.status(400).json({ error: "path required" });

  const abs = safePath(relPath);
  if (!abs) return res.status(403).json({ error: "Path outside workspace" });
  if (!existsSync(abs)) return res.status(404).json({ error: "File not found" });

  try {
    const st = statSync(abs);
    if (st.isDirectory()) return res.status(400).json({ error: "Path is a directory" });
    if (st.size > MAX_FILE_SIZE) return res.status(413).json({ error: "File too large" });

    const content = readFileSync(abs, "utf-8");
    const ext = extname(abs);
    res.json({
      path: relPath,
      content,
      language: langFromExt(ext),
      size: st.size,
      modified: st.mtimeMs,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** PUT /api/workspace/file — Write/update file */
router.put("/file", (req: Request, res: Response) => {
  const { path: relPath, content } = req.body;
  if (!relPath || content === undefined) {
    return res.status(400).json({ error: "path and content required" });
  }

  const abs = safePath(relPath);
  if (!abs) return res.status(403).json({ error: "Path outside workspace" });

  try {
    const dir = dirname(abs);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(abs, content, "utf-8");
    const st = statSync(abs);
    res.json({ ok: true, size: st.size, modified: st.mtimeMs });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/file — Create new file */
router.post("/file", (req: Request, res: Response) => {
  const { path: relPath, content } = req.body;
  if (!relPath) return res.status(400).json({ error: "path required" });

  const abs = safePath(relPath);
  if (!abs) return res.status(403).json({ error: "Path outside workspace" });
  if (existsSync(abs)) return res.status(409).json({ error: "File already exists" });

  try {
    const dir = dirname(abs);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(abs, content || "", "utf-8");
    res.json({ ok: true, path: relPath });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** DELETE /api/workspace/file?path=... — Delete file */
router.delete("/file", (req: Request, res: Response) => {
  const relPath = req.query.path as string;
  if (!relPath) return res.status(400).json({ error: "path required" });

  const abs = safePath(relPath);
  if (!abs) return res.status(403).json({ error: "Path outside workspace" });
  if (!existsSync(abs)) return res.status(404).json({ error: "File not found" });

  try {
    unlinkSync(abs);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/dir — Create directory */
router.post("/dir", (req: Request, res: Response) => {
  const { path: relPath } = req.body;
  if (!relPath) return res.status(400).json({ error: "path required" });

  const abs = safePath(relPath);
  if (!abs) return res.status(403).json({ error: "Path outside workspace" });

  try {
    mkdirSync(abs, { recursive: true });
    res.json({ ok: true, path: relPath });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/rename — Rename file or directory */
router.post("/rename", (req: Request, res: Response) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) return res.status(400).json({ error: "oldPath and newPath required" });

  const absOld = safePath(oldPath);
  const absNew = safePath(newPath);
  if (!absOld || !absNew) return res.status(403).json({ error: "Path outside workspace" });
  if (!existsSync(absOld)) return res.status(404).json({ error: "Source not found" });

  try {
    const dir = dirname(absNew);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    renameSync(absOld, absNew);
    res.json({ ok: true, path: newPath });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /api/workspace/search?q=... — Search in files */
router.get("/search", (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query || query.length < 2) return res.status(400).json({ error: "query too short (min 2 chars)" });

  try {
    const results: Array<{ path: string; line: number; content: string }> = [];
    searchFiles(WORKSPACE_ROOT, query, results);
    res.json({ query, count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── AI Agent endpoints ──

/** POST /api/workspace/ai/edit — AI edits a file */
router.post("/ai/edit", async (req: Request, res: Response) => {
  const { path: relPath, instruction } = req.body;
  if (!relPath || !instruction) {
    return res.status(400).json({ error: "path and instruction required" });
  }

  const abs = safePath(relPath);
  if (!abs) return res.status(403).json({ error: "Path outside workspace" });
  if (!existsSync(abs)) return res.status(404).json({ error: "File not found" });

  try {
    const content = readFileSync(abs, "utf-8");
    const ext = extname(abs);
    const language = langFromExt(ext);

    // Call Gemini to edit the file
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const prompt = `You are an expert programmer. Edit the following ${language} file according to the instruction.

INSTRUCTION: ${instruction}

CURRENT FILE (${basename(abs)}):
\`\`\`${language}
${content}
\`\`\`

Return ONLY the complete updated file content. No explanations, no markdown fences.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        }),
      }
    );

    const data = await response.json() as any;
    let newContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown fences if present
    newContent = newContent.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");

    res.json({
      path: relPath,
      original: content,
      modified: newContent,
      language,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/ai/generate — AI generates a new file */
router.post("/ai/generate", async (req: Request, res: Response) => {
  const { path: relPath, instruction } = req.body;
  if (!relPath || !instruction) {
    return res.status(400).json({ error: "path and instruction required" });
  }

  const abs = safePath(relPath);
  if (!abs) return res.status(403).json({ error: "Path outside workspace" });

  try {
    const ext = extname(relPath);
    const language = langFromExt(ext);

    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const prompt = `You are an expert programmer. Generate a ${language} file according to the instruction.

INSTRUCTION: ${instruction}
FILE NAME: ${basename(relPath)}

Return ONLY the file content. No explanations, no markdown fences.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
        }),
      }
    );

    const data = await response.json() as any;
    let content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    content = content.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");

    res.json({ path: relPath, content, language });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/ai/explain — AI explains code or answers general questions */
router.post("/ai/explain", async (req: Request, res: Response) => {
  const { path: relPath, selection } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    let prompt: string;
    let language = "plaintext";

    if (selection) {
      // General chat / question with context provided by the frontend
      prompt = `Du är en expert-programmerare och AI-assistent som heter Frankenstein. Svara på svenska, koncist och hjälpsamt.

${selection}`;
    } else if (relPath && relPath !== ".") {
      // Explain a specific file
      const abs = safePath(relPath);
      if (!abs) return res.status(403).json({ error: "Path outside workspace" });
      if (!existsSync(abs)) return res.status(404).json({ error: "File not found" });

      const fullContent = readFileSync(abs, "utf-8");
      const ext = extname(abs);
      language = langFromExt(ext);

      prompt = `Du är en expert-programmerare. Förklara följande ${language}-kod tydligt och koncist på svenska.

\`\`\`${language}
${fullContent}
\`\`\`

Förklara:
1. Vad koden gör (översikt)
2. Viktiga funktioner/klasser och deras syfte
3. Anmärkningsvärda mönster eller potentiella problem`;
    } else {
      return res.status(400).json({ error: "path or selection required" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
        }),
      }
    );

    const data = await response.json() as any;
    const explanation = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Kunde inte svara just nu.";

    res.json({ path: relPath || ".", explanation, language });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/ai/chat — Smart natural language coding assistant */
router.post("/ai/chat", async (req: Request, res: Response) => {
  const { message, currentFile, currentContent, openFiles } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    // Step 1: Let Gemini decide what actions to take
    const planPrompt = `Du är Frankenstein, en expert AI-kodassistent. Analysera användarens begäran och bestäm vilka åtgärder som behövs.

WORKSPACE ROOT: ${WORKSPACE_ROOT}
${currentFile ? `AKTUELL FIL: ${currentFile}` : "INGEN FIL ÖPPEN"}
${openFiles?.length ? `ÖPPNA FILER: ${openFiles.join(", ")}` : ""}
${currentContent ? `FILINNEHÅLL (${currentFile}):\n\`\`\`\n${currentContent.slice(0, 6000)}\n\`\`\`` : ""}

ANVÄNDARENS BEGÄRAN: ${message}

Svara med EXAKT EN JSON-array med åtgärder. Varje åtgärd har ett "action"-fält.
Tillgängliga actions:
- {"action":"edit","path":"relativ/sökväg","content":"HELA det nya filinnehållet"} — Redigera/skriv om en fil
- {"action":"create","path":"relativ/sökväg","content":"filinnehåll"} — Skapa en ny fil
- {"action":"run","command":"shell-kommando"} — Kör ett terminalkommando
- {"action":"answer","text":"svar till användaren"} — Svara/förklara utan kodändring

REGLER:
- Vid "edit" MÅSTE "content" vara HELA det uppdaterade filinnehållet, inte bara ändringarna
- Om du skapar/redigerar kod, skriv produktionsklar, komplett kod
- Inkludera alltid en "answer" action sist som sammanfattar vad du gjort
- Svara BARA med JSON-arrayen, inget annat. Ingen markdown, inga code fences.

Exempel: [{"action":"edit","path":"src/app.ts","content":"import...\\n..."},{"action":"answer","text":"Jag uppdaterade app.ts med..."}]`;

    const planRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: planPrompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 16384 },
        }),
      }
    );

    const planData = await planRes.json() as any;
    let planText = planData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown fences if present
    planText = planText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?\s*```$/i, "").trim();

    let actions: any[];
    try {
      actions = JSON.parse(planText);
      if (!Array.isArray(actions)) actions = [actions];
    } catch {
      // If Gemini didn't return valid JSON, treat as a simple answer
      return res.json({
        actions: [{ action: "answer", text: planText }],
        results: [{ action: "answer", success: true, text: planText }],
      });
    }

    // Step 2: Execute each action
    const results: any[] = [];

    for (const act of actions) {
      try {
        switch (act.action) {
          case "edit":
          case "create": {
            const abs = safePath(act.path);
            if (!abs) { results.push({ ...act, success: false, error: "Path outside workspace" }); break; }
            // Ensure parent dirs exist
            const dir = dirname(abs);
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
            const isNew = !existsSync(abs);
            writeFileSync(abs, act.content || "", "utf-8");
            results.push({
              action: act.action,
              path: act.path,
              success: true,
              isNew,
              language: langFromExt(extname(act.path)),
              content: act.content,
            });
            break;
          }
          case "run": {
            const cmdResult = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
              let stdout = "";
              let stderr = "";
              const isWin = process.platform === "win32";
              const sh = isWin ? "cmd.exe" : "/bin/bash";
              const args = isWin ? ["/c", act.command] : ["-c", act.command];
              const proc = spawn(sh, args, {
                cwd: WORKSPACE_ROOT,
                env: { ...process.env, PYTHONIOENCODING: "utf-8" },
                timeout: 30000,
              });
              proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
              proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });
              proc.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 1 }));
              proc.on("error", (err) => resolve({ stdout, stderr: String(err), exitCode: 1 }));
            });
            results.push({ action: "run", command: act.command, success: cmdResult.exitCode === 0, ...cmdResult });
            break;
          }
          case "answer": {
            results.push({ action: "answer", success: true, text: act.text });
            break;
          }
          default:
            results.push({ action: act.action, success: false, error: "Unknown action" });
        }
      } catch (err) {
        results.push({ ...act, success: false, error: String(err) });
      }
    }

    res.json({ actions, results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** Search Archon Knowledge Base for relevant context */
async function searchArchonKB(query: string, topK = 3): Promise<string> {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || "";
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
    if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_KEY) return "";

    // Generate embedding for query
    const embedRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { parts: [{ text: query }] }, outputDimensionality: 768 }),
      }
    );
    if (!embedRes.ok) return "";
    const embedData = (await embedRes.json()) as any;
    const embedding = embedData.embedding?.values;
    if (!embedding) return "";

    // Search via Supabase RPC
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_knowledge_chunks`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query_embedding: embedding, match_count: topK }),
    });
    if (!rpcRes.ok) return "";
    const results = (await rpcRes.json()) as any[];
    if (!results?.length) return "";

    return results
      .filter((r: any) => r.similarity > 0.4)
      .map((r: any) => `[Källa: ${r.url || "KB"} | Relevans: ${(r.similarity * 100).toFixed(0)}%]\n${r.content?.slice(0, 600)}`)
      .join("\n\n");
  } catch {
    return "";
  }
}

/** POST /api/workspace/ai/chat/stream — Streaming AI chat via SSE */
router.post("/ai/chat/stream", async (req: Request, res: Response) => {
  const { message, currentFile, currentContent, openFiles, history } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  // Gather context from open files
  const fileContexts: string[] = [];
  if (openFiles?.length) {
    for (const f of openFiles.slice(0, 5)) {
      if (f === currentFile) continue;
      const abs = safePath(f);
      if (abs && existsSync(abs)) {
        try {
          const st = statSync(abs);
          if (st.size < 50000) {
            const content = readFileSync(abs, "utf-8");
            fileContexts.push(`--- ${f} ---\n${content.slice(0, 3000)}`);
          }
        } catch { /* skip */ }
      }
    }
  }

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  // Search Archon Knowledge Base for relevant context
  const kbContext = await searchArchonKB(message, 3);

  // Build conversation history for multi-turn
  const contents: any[] = [];
  if (history?.length) {
    for (const h of history.slice(-10)) {
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }],
      });
    }
  }

  const systemContext = `Du är Frankenstein, en expert AI-kodassistent i Gracestack Editor. Du kan:
- Redigera filer (svara med kodblock markerade med filsökväg)
- Förklara kod
- Föreslå förbättringar
- Köra kommandon
- Söka i kunskapsbasen (Archon Knowledge Base) för dokumentation och kodexempel

WORKSPACE: ${WORKSPACE_ROOT}
${currentFile ? `AKTUELL FIL: ${currentFile}` : ""}
${currentContent ? `FILINNEHÅLL:\n\`\`\`\n${currentContent.slice(0, 8000)}\n\`\`\`` : ""}
${fileContexts.length ? `\nANDRA ÖPPNA FILER:\n${fileContexts.join("\n\n")}` : ""}
${kbContext ? `\nKUNSKAPSBAS (Archon RAG — relevant dokumentation):\n${kbContext}` : ""}

REGLER:
- Svara på svenska om användaren skriver svenska
- Var koncis och handlingsorienterad
- Om du har kunskapsbaskontext ovan, referera till den när det är relevant
- Om du föreslår kodändringar, visa HELA den uppdaterade filen i ett kodblock med filsökvägen som kommentar
- Markera filändringar med: \`\`\`EDIT:sökväg/till/fil\n...ny kod...\n\`\`\`
- Markera nya filer med: \`\`\`CREATE:sökväg/till/fil\n...kod...\n\`\`\`
- Markera kommandon med: \`\`\`RUN\nkommando\n\`\`\`
- Du har tillgång till Archon Knowledge Base — en vektorsökbar kunskapsbas med crawlad dokumentation. Användaren kan lägga till fler källor via Knowledge Base-panelen (Ctrl+Shift+P → "Knowledge Base").`;

  contents.push({
    role: "user",
    parts: [{ text: `${systemContext}\n\nANVÄNDAREN: ${message}` }],
  });

  try {
    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const streamRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 16384 },
        }),
      }
    );

    if (!streamRes.ok || !streamRes.body) {
      res.write(`data: ${JSON.stringify({ error: "Gemini API error" })}\n\n`);
      res.end();
      return;
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (text) {
            fullText += text;
            res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
          }
        } catch { /* skip malformed */ }
      }
    }

    // Parse file actions from the full response
    const fileActions: any[] = [];
    const editRegex = /```(?:EDIT|CREATE):([^\n]+)\n([\s\S]*?)```/g;
    const runRegex = /```RUN\n([\s\S]*?)```/g;
    let match;

    while ((match = editRegex.exec(fullText)) !== null) {
      const filePath = match[1].trim();
      const content = match[2].trimEnd();
      const abs = safePath(filePath);
      if (abs) {
        const isNew = !existsSync(abs);
        const dir = dirname(abs);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(abs, content, "utf-8");
        fileActions.push({
          action: isNew ? "create" : "edit",
          path: filePath,
          content,
          language: langFromExt(extname(filePath)),
          success: true,
          isNew,
        });
      }
    }

    while ((match = runRegex.exec(fullText)) !== null) {
      const command = match[1].trim();
      try {
        const cmdResult = await runShellCommand(command, WORKSPACE_ROOT, 30_000, "host");
        fileActions.push({ action: "run", command, success: cmdResult.exitCode === 0, ...cmdResult });
      } catch (err) {
        fileActions.push({ action: "run", command, success: false, error: String(err) });
      }
    }

    // Send final summary with file actions
    res.write(`data: ${JSON.stringify({ done: true, fileActions })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

/** POST /api/workspace/ai/inline — Inline AI edit (Ctrl+K style) */
router.post("/ai/inline", async (req: Request, res: Response) => {
  const { path: relPath, selection, instruction, fullContent, selectionRange } = req.body;
  if (!instruction) return res.status(400).json({ error: "instruction required" });

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  try {
    const ext = relPath ? extname(relPath) : ".txt";
    const language = langFromExt(ext);

    // SSE for streaming inline edit
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const prompt = selection
      ? `Du är en expert-programmerare. Redigera BARA den markerade koden enligt instruktionen.

FIL: ${relPath || "unknown"}
SPRÅK: ${language}

HELA FILEN:
\`\`\`${language}
${(fullContent || "").slice(0, 10000)}
\`\`\`

MARKERAD KOD (rad ${selectionRange?.startLine || "?"}-${selectionRange?.endLine || "?"}):
\`\`\`${language}
${selection}
\`\`\`

INSTRUKTION: ${instruction}

Svara med BARA den uppdaterade markerade koden. Ingen förklaring, inga markdown-fences, bara koden som ska ersätta markeringen.`
      : `Du är en expert-programmerare. Generera kod enligt instruktionen.

FIL: ${relPath || "unknown"}
SPRÅK: ${language}
KONTEXT (filen):
\`\`\`${language}
${(fullContent || "").slice(0, 10000)}
\`\`\`

INSTRUKTION: ${instruction}

Svara med BARA koden som ska infogas. Ingen förklaring, inga markdown-fences.`;

    const streamRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!streamRes.ok || !streamRes.body) {
      res.write(`data: ${JSON.stringify({ error: "Gemini API error" })}\n\n`);
      res.end();
      return;
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (text) {
            fullText += text;
            res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
          }
        } catch { /* skip */ }
      }
    }

    // Strip markdown fences from final result
    let cleanResult = fullText.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");

    res.write(`data: ${JSON.stringify({ done: true, result: cleanResult })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

/** POST /api/workspace/ai/diagnose — AI analyzes terminal errors and suggests fixes */
router.post("/ai/diagnose", async (req: Request, res: Response) => {
  const { error: errorText, command, currentFile, currentContent } = req.body;
  if (!errorText) return res.status(400).json({ error: "error text required" });

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    let fileContext = "";
    if (currentFile && currentContent) {
      fileContext = `\n\nAktuell fil (${currentFile}):\n\`\`\`\n${currentContent.slice(0, 3000)}\n\`\`\``;
    }

    const prompt = `Du är Frankenstein, en expert AI-felsökare. Analysera detta terminalfel och ge en konkret lösning.

Kommando som kördes: ${command || "(okänt)"}

Felmeddelande:
\`\`\`
${errorText.slice(0, 2000)}
\`\`\`${fileContext}

Svara på svenska med:
1. **Orsak:** Kort förklaring av vad som gick fel
2. **Lösning:** Konkret fix (med kod om relevant)
3. **Kommando:** Om ett terminalkommando löser problemet, skriv det i ett \`\`\`RUN block

Var koncis och handlingsorienterad.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      }
    );

    const data = await response.json() as any;
    const diagnosis = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Kunde inte analysera felet.";
    res.json({ diagnosis });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/ai/refactor — AI refactors code with specific instruction */
router.post("/ai/refactor", async (req: Request, res: Response) => {
  const { path: relPath, content, instruction, mode } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const modePrompts: Record<string, string> = {
      refactor: "Refaktorera koden för bättre läsbarhet, namngivning och struktur. Behåll samma funktionalitet.",
      optimize: "Optimera koden för bättre prestanda. Identifiera flaskhalsar och ineffektiva mönster.",
      review: "Granska koden och ge feedback. Identifiera buggar, säkerhetsproblem, kodlukt och förbättringsmöjligheter. Svara INTE med omskriven kod utan med en lista av observationer.",
      simplify: "Förenkla koden. Ta bort onödig komplexitet, förkorta utan att förlora läsbarhet.",
      document: "Lägg till JSDoc/docstrings och inline-kommentarer som förklarar komplex logik. Behåll all befintlig kod.",
      test: "Generera enhetstester för denna kod. Använd det mest lämpliga testramverket.",
    };

    const modeInstruction = modePrompts[mode] || modePrompts.refactor;
    const userInstruction = instruction ? `\n\nAnvändarens extra instruktion: ${instruction}` : "";

    const prompt = `Du är Frankenstein, en expert-kodgranskare och refaktorerare.

Uppgift: ${modeInstruction}${userInstruction}

Fil: ${relPath || "okänd"}

Kod:
\`\`\`
${content.slice(0, 8000)}
\`\`\`

${mode === "review" 
  ? "Svara med en strukturerad granskning i markdown med kategorier: 🐛 Buggar, ⚠️ Varningar, 💡 Förslag, ✅ Bra mönster."
  : "Svara ENBART med den omskrivna koden, utan förklaringar runt koden. Behåll samma språk."}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        }),
      }
    );

    const data = await response.json() as any;
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Kunde inte bearbeta koden.";
    
    // Clean markdown fences if mode is not review
    let cleaned = result;
    if (mode !== "review") {
      cleaned = result.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
    }

    res.json({ result: cleaned, mode });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/ai/search-semantic — AI-powered semantic code search */
router.post("/ai/search-semantic", async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    // First, get the file tree to understand project structure
    const allFiles: Array<{ path: string; snippet: string }> = [];
    
    function walkDir(dir: string, prefix: string = "") {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === "__pycache__") continue;
          const fullPath = join(dir, entry.name);
          const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            walkDir(fullPath, relPath);
          } else if (entry.isFile()) {
            try {
              const stat = statSync(fullPath);
              if (stat.size > 100000) continue; // Skip large files
              const ext = extname(entry.name).toLowerCase();
              const codeExts = [".ts", ".tsx", ".js", ".jsx", ".py", ".css", ".html", ".json", ".md", ".yaml", ".yml", ".sh", ".sql"];
              if (!codeExts.includes(ext)) continue;
              const content = readFileSync(fullPath, "utf-8");
              allFiles.push({ path: relPath, snippet: content.slice(0, 500) });
            } catch { /* skip unreadable */ }
          }
        }
      } catch { /* skip */ }
    }
    
    walkDir(WORKSPACE_ROOT);

    // Build a compact file index for AI
    const fileIndex = allFiles.slice(0, 100).map(f => `${f.path}:\n${f.snippet}`).join("\n---\n");

    const prompt = `Du är Frankenstein, en expert på kodnavigering. Användaren söker i sin kodbas.

Sökfråga: "${query}"

Här är en översikt av projektets filer (första 500 tecken av varje):

${fileIndex.slice(0, 15000)}

Baserat på sökfrågan, identifiera de mest relevanta filerna och förklara varför. Svara i JSON-format:
[
  { "path": "relativ/sökväg", "relevance": "kort förklaring", "line_hint": "ungefärlig rad eller funktion" }
]

Returnera max 8 resultat, sorterade efter relevans. Svara ENBART med JSON-arrayen.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
        }),
      }
    );

    const data = await response.json() as any;
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    
    // Parse JSON from response
    let results = [];
    try {
      const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      results = JSON.parse(cleaned);
    } catch {
      results = [{ path: "error", relevance: "Kunde inte tolka AI-svaret", line_hint: "" }];
    }

    res.json({ results, query });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/ai/terminal — AI runs a terminal command */
router.post("/ai/terminal", async (req: Request, res: Response) => {
  const { command, cwd, runner } = req.body;
  if (!command) return res.status(400).json({ error: "command required" });

  const shellRunner: ShellRunner = runner === "kali" ? "kali" : runner === "kali_sandbox" ? "kali_sandbox" : "host";

  const workDir = shellRunner === "kali_sandbox"
    ? KALI_SANDBOX_WORKDIR
    : (cwd ? safePath(cwd) : WORKSPACE_ROOT);
  if (!workDir) return res.status(403).json({ error: "Path outside workspace" });

  try {
    const result = await runShellCommand(String(command), workDir, 30_000, shellRunner);
    res.json({ command, runner: shellRunner, ...result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Git Integration ──

/** Helper to run git commands */
async function runGit(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const proc = spawn("git", args, { cwd: WORKSPACE_ROOT, timeout: 15000 });
    proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
    proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });
    proc.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 1 }));
    proc.on("error", (err) => resolve({ stdout, stderr: String(err), exitCode: 1 }));
  });
}

/** GET /api/workspace/git/status — Git status */
router.get("/git/status", async (_req: Request, res: Response) => {
  try {
    const status = await runGit(["status", "--porcelain=v1", "-b"]);
    const branch = await runGit(["branch", "--show-current"]);
    const logResult = await runGit(["log", "--oneline", "-10", "--format=%h|%s|%an|%ar"]);

    const files: Array<{ status: string; path: string; staged: boolean }> = [];
    for (const line of status.stdout.split("\n").filter(Boolean)) {
      if (line.startsWith("##")) continue;
      const xy = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      const staged = xy[0] !== " " && xy[0] !== "?";
      let statusLabel = "modified";
      if (xy.includes("A")) statusLabel = "added";
      else if (xy.includes("D")) statusLabel = "deleted";
      else if (xy.includes("?")) statusLabel = "untracked";
      else if (xy.includes("R")) statusLabel = "renamed";
      files.push({ status: statusLabel, path: filePath, staged });
    }

    const commits = logResult.stdout.split("\n").filter(Boolean).map((line) => {
      const [hash, message, author, time] = line.split("|");
      return { hash, message, author, time };
    });

    res.json({
      branch: branch.stdout.trim(),
      files,
      commits,
      clean: files.length === 0,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /api/workspace/git/diff?path=... — Git diff for a file */
router.get("/git/diff", async (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  const staged = req.query.staged === "true";
  try {
    const args = staged ? ["diff", "--cached"] : ["diff"];
    if (filePath) args.push("--", filePath);
    const result = await runGit(args);
    res.json({ diff: result.stdout, path: filePath || "all" });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/git/stage — Stage files */
router.post("/git/stage", async (req: Request, res: Response) => {
  const { paths } = req.body;
  try {
    const args = ["add", ...(paths?.length ? paths : ["."])];
    const result = await runGit(args);
    res.json({ ok: result.exitCode === 0, stderr: result.stderr });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/git/unstage — Unstage files */
router.post("/git/unstage", async (req: Request, res: Response) => {
  const { paths } = req.body;
  try {
    const args = ["reset", "HEAD", ...(paths?.length ? paths : ["."])];
    const result = await runGit(args);
    res.json({ ok: result.exitCode === 0, stderr: result.stderr });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/git/commit — Commit staged changes */
router.post("/git/commit", async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  try {
    const result = await runGit(["commit", "-m", message]);
    res.json({ ok: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/git/push — Push to remote */
router.post("/git/push", async (_req: Request, res: Response) => {
  try {
    const result = await runGit(["push"]);
    res.json({ ok: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/git/ai-commit — AI generates commit message */
router.post("/git/ai-commit", async (_req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const diff = await runGit(["diff", "--cached"]);
    if (!diff.stdout.trim()) {
      const unstaged = await runGit(["diff"]);
      if (!unstaged.stdout.trim()) return res.json({ message: "chore: minor updates" });
      diff.stdout = unstaged.stdout;
    }

    const prompt = `Generate a concise, conventional commit message for these changes. Use format: type(scope): description. Types: feat, fix, refactor, docs, style, test, chore. Return ONLY the commit message, nothing else.\n\nDiff:\n${diff.stdout.slice(0, 8000)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
        }),
      }
    );
    const data = await response.json() as any;
    const message = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "chore: update files";
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── AI Autocomplete ──

/** POST /api/workspace/ai/complete — Ghost text completion */
router.post("/ai/complete", async (req: Request, res: Response) => {
  const { path: relPath, content, line, column, prefix } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  try {
    const ext = relPath ? extname(relPath) : ".txt";
    const language = langFromExt(ext);

    const lines = content.split("\n");
    const currentLine = lines[line - 1] || "";
    const contextBefore = lines.slice(Math.max(0, line - 30), line).join("\n");
    const contextAfter = lines.slice(line, Math.min(lines.length, line + 10)).join("\n");

    const prompt = `You are an AI code completion engine. Complete the code at the cursor position.

LANGUAGE: ${language}
FILE: ${relPath || "unknown"}

CODE BEFORE CURSOR:
${contextBefore}
${currentLine.slice(0, column - 1)}█

CODE AFTER CURSOR:
${currentLine.slice(column - 1)}
${contextAfter}

RULES:
- Return ONLY the completion text that should be inserted at the cursor (█)
- Do NOT repeat any code that already exists before the cursor
- Keep completions concise (1-5 lines typically)
- Match the existing code style and indentation
- If no meaningful completion, return empty string
- No explanations, no markdown`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await response.json() as any;
    let completion = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    completion = completion.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");

    res.json({ completion, line, column });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── MVP Generator — Generate a complete project from a prompt ──

/** Collect file index for context (path + first 2 lines) */
function collectFileIndex(dir: string, depth = 0, max = 80): string[] {
  if (depth > 4) return [];
  const result: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (result.length >= max) break;
      if (IGNORED_DIRS.has(e.name) && e.isDirectory()) continue;
      if (e.name.startsWith(".") && e.isDirectory()) continue;
      if (IGNORED_FILES.has(e.name)) continue;
      const full = join(dir, e.name);
      const rel = relative(WORKSPACE_ROOT, full).replace(/\\/g, "/");
      if (e.isDirectory()) {
        result.push(`📁 ${rel}/`);
        result.push(...collectFileIndex(full, depth + 1, max - result.length));
      } else {
        result.push(`📄 ${rel}`);
      }
    }
  } catch { /* skip */ }
  return result;
}

router.post("/ai/generate-mvp", async (req: Request, res: Response) => {
  const { prompt, projectName, targetDir, attachments } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  const projDir = targetDir || projectName || "mvp-project";

  // Build attachment context
  let attachmentContext = "";
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    attachmentContext = "\n\nBIFOGADE FILER (använd som referens/kontext):\n";
    for (const att of attachments) {
      if (att.type === "text" || att.type === "code") {
        attachmentContext += `\n--- ${att.name} ---\n${att.content?.slice(0, 4000) || ""}\n`;
      } else if (att.type === "image") {
        attachmentContext += `\n[Bild: ${att.name}] (beskriven av användaren)\n`;
      } else {
        attachmentContext += `\n[Fil: ${att.name}, typ: ${att.mimeType || "okänd"}]\n`;
      }
    }
  }

  try {
    // Step 1: Generate project plan
    const planPrompt = `Du är Frankenstein, en expert fullstack-utvecklare. Användaren vill skapa ett komplett MVP-projekt.

ANVÄNDARENS BESKRIVNING:
${prompt}
${attachmentContext}

MÅLMAPP: ${projDir}/

Generera en KOMPLETT projektplan i JSON-format. Svara ENBART med JSON, inga förklaringar.

JSON-format:
{
  "name": "projektnamn",
  "description": "kort beskrivning",
  "tech_stack": ["tech1", "tech2"],
  "files": [
    {
      "path": "relativ/sökväg/fil.ext",
      "description": "vad filen gör",
      "priority": 1
    }
  ],
  "commands": ["npm init -y", "npm install express"],
  "run_command": "npm start"
}

Regler:
- Generera ALLA filer som behövs för ett fungerande MVP
- Inkludera package.json, README.md, .gitignore
- Använd moderna best practices
- Max 30 filer
- Sortera filer efter priority (1 = skapa först)
- commands = kommandon att köra EFTER filerna skapats (t.ex. npm install)
- run_command = kommando för att starta projektet`;

    const planRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: planPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 },
        }),
      }
    );

    const planData = await planRes.json() as any;
    if (planData?.error) {
      return res.status(500).json({ error: `Gemini API error: ${planData.error.message || JSON.stringify(planData.error)}` });
    }
    let planText = planData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Strip code fences robustly (handles ```json, ``` json, whitespace variants)
    planText = planText.replace(/^\s*```\s*\w*\s*\n?/, "").replace(/\n?\s*```\s*$/, "").trim();

    let plan: any;
    try {
      plan = JSON.parse(planText);
    } catch {
      // Try to extract JSON from the text
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { plan = JSON.parse(jsonMatch[0]); } catch { /* fall through */ }
      }
      if (!plan) {
        return res.status(500).json({ error: "AI kunde inte generera en giltig projektplan", raw: planText.slice(0, 500) });
      }
    }

    if (!plan.files || !Array.isArray(plan.files)) {
      return res.status(500).json({ error: "Ingen fillista i planen", plan });
    }

    // Sort by priority
    plan.files.sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));

    // Step 2: Create project directory
    const projectRoot = safePath(projDir);
    if (!projectRoot) return res.status(403).json({ error: "Invalid project path" });
    if (!existsSync(projectRoot)) mkdirSync(projectRoot, { recursive: true });

    // Step 3: Generate each file
    const createdFiles: string[] = [];
    const errors: string[] = [];

    for (const file of plan.files) {
      const filePath = file.path;
      const fullPath = join(projectRoot, filePath);
      const fileDir = dirname(fullPath);

      // Create directories
      if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });

      // Generate file content
      const filePrompt = `Du är Frankenstein, en expert fullstack-utvecklare. Generera innehållet för denna fil.

PROJEKT: ${plan.name} — ${plan.description}
TECH STACK: ${plan.tech_stack?.join(", ") || "modern web"}
FIL: ${filePath}
BESKRIVNING: ${file.description}
${attachmentContext}

ALLA FILER I PROJEKTET:
${plan.files.map((f: any) => `- ${f.path}: ${f.description}`).join("\n")}

REDAN SKAPADE FILER:
${createdFiles.map((f) => {
  try {
    const content = readFileSync(join(projectRoot, f), "utf-8");
    return `--- ${f} ---\n${content.slice(0, 2000)}`;
  } catch { return `--- ${f} --- (ej läsbar)`; }
}).join("\n\n")}

Generera ENBART filinnehållet. Ingen markdown, inga förklaringar, inga code fences.
Koden ska vara komplett, fungerande och följa best practices.`;

      try {
        const fileRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: filePrompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
            }),
          }
        );

        const fileData = await fileRes.json() as any;
        if (fileData?.error) {
          errors.push(`${filePath}: Gemini API error: ${fileData.error.message || "unknown"}`);
          continue;
        }
        let content = fileData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Strip outer code fences (handles ```js, ```json, etc.)
        content = content.replace(/^\s*```\s*\w*\s*\n/, "").replace(/\n\s*```\s*$/, "").trim();

        writeFileSync(fullPath, content, "utf-8");
        createdFiles.push(filePath);

        // Rate limit: 1s delay between files to avoid Gemini 429
        if (plan.files.indexOf(file) < plan.files.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        errors.push(`${filePath}: ${err}`);
      }
    }

    // Step 4: Run setup commands
    const commandResults: Array<{ command: string; success: boolean; output: string }> = [];
    if (plan.commands && Array.isArray(plan.commands)) {
      for (const cmd of plan.commands) {
        try {
          const isWindows = process.platform === "win32";
          const shell = isWindows ? "cmd.exe" : "/bin/bash";
          const shellArgs = isWindows ? ["/c", cmd] : ["-c", cmd];
          const proc = spawn(shell, shellArgs, {
            cwd: projectRoot,
            env: { ...process.env, PYTHONIOENCODING: "utf-8" },
            stdio: ["pipe", "pipe", "pipe"],
          });

          let stdout = "";
          let stderr = "";
          proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
          proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });

          const exitCode = await new Promise<number>((resolve) => {
            proc.on("close", (code) => resolve(code || 0));
            setTimeout(() => { proc.kill(); resolve(-1); }, 60000);
          });

          commandResults.push({
            command: cmd,
            success: exitCode === 0,
            output: (stdout + stderr).slice(0, 500),
          });
        } catch (err) {
          commandResults.push({ command: cmd, success: false, output: String(err) });
        }
      }
    }

    res.json({
      success: true,
      projectDir: projDir,
      plan: {
        name: plan.name,
        description: plan.description,
        tech_stack: plan.tech_stack,
        run_command: plan.run_command,
      },
      files: createdFiles,
      errors,
      commandResults,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/ai/chat-with-files — Chat with file attachments */
router.post("/ai/chat-with-files", async (req: Request, res: Response) => {
  const { message, attachments, history } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

  // Build attachment context
  let fileContext = "";
  if (attachments && Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att.content) {
        const label = att.name || "fil";
        const lang = att.language || langFromExt(extname(att.name || ".txt"));
        fileContext += `\n\n--- Bifogad fil: ${label} ---\n\`\`\`${lang}\n${att.content.slice(0, 8000)}\n\`\`\`\n`;
      }
    }
  }

  // Build conversation history
  const contents: any[] = [];
  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  const systemPrompt = `Du är Frankenstein, en expert AI-kodassistent i Gracestack Editor. Du kan:
- Analysera bifogade filer (kod, text, config, data)
- Föreslå förbättringar och fixa buggar
- Generera ny kod baserat på bifogade filer
- Svara på frågor om filinnehåll

Svara på svenska. Var koncis och hjälpsam. Använd markdown med kodblock.
Om du föreslår kodändringar, markera med EDIT:filsökväg eller CREATE:filsökväg före kodblocket.`;

  contents.push({
    role: "user",
    parts: [{ text: `${systemPrompt}\n\nAnvändarens meddelande: ${message}${fileContext}` }],
  });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
        }),
      }
    );

    const data = await response.json() as any;
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Kunde inte svara just nu.";
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/workspace/upload — Save uploaded file to workspace */
router.post("/upload", (req: Request, res: Response) => {
  const { path: relPath, content, encoding } = req.body;
  if (!relPath || content === undefined) return res.status(400).json({ error: "path and content required" });

  const abs = safePath(relPath);
  if (!abs) return res.status(403).json({ error: "Path outside workspace" });

  try {
    const dir = dirname(abs);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    if (encoding === "base64") {
      const buffer = Buffer.from(content, "base64");
      writeFileSync(abs, buffer);
    } else {
      writeFileSync(abs, content, "utf-8");
    }

    res.json({ ok: true, path: relPath });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── Terminal PTY via Socket.IO ──

const terminals: Map<string, ChildProcess> = new Map();

export function initWorkspaceSocket(io: SocketServer): void {
  io.on("connection", (socket: Socket) => {
    // Spawn terminal
    socket.on("terminal:spawn", (data?: { cwd?: string; id?: string }) => {
      const id = data?.id || `term-${Date.now()}`;
      const cwd = data?.cwd ? safePath(data.cwd) || WORKSPACE_ROOT : WORKSPACE_ROOT;
      const isWindows = process.platform === "win32";
      const shell = isWindows ? "powershell.exe" : "/bin/bash";

      const proc = spawn(shell, [], {
        cwd,
        env: { ...process.env, TERM: "xterm-256color", PYTHONIOENCODING: "utf-8" },
        stdio: ["pipe", "pipe", "pipe"],
      });

      terminals.set(id, proc);

      proc.stdout?.on("data", (d: Buffer) => {
        socket.emit("terminal:output", { id, data: d.toString("utf-8") });
      });
      proc.stderr?.on("data", (d: Buffer) => {
        socket.emit("terminal:output", { id, data: d.toString("utf-8") });
      });
      proc.on("close", (code) => {
        socket.emit("terminal:exit", { id, code });
        terminals.delete(id);
      });

      socket.emit("terminal:spawned", { id });
    });

    // Send input to terminal
    socket.on("terminal:input", (data: { id: string; input: string }) => {
      const proc = terminals.get(data.id);
      if (proc?.stdin?.writable) {
        proc.stdin.write(data.input);
      }
    });

    // Kill terminal
    socket.on("terminal:kill", (data: { id: string }) => {
      const proc = terminals.get(data.id);
      if (proc) {
        proc.kill();
        terminals.delete(data.id);
      }
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      for (const [id, proc] of terminals) {
        proc.kill();
        terminals.delete(id);
      }
    });
  });
}

export default router;
