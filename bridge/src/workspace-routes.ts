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
import { spawn, ChildProcess } from "child_process";
import type { Server as SocketServer, Socket } from "socket.io";

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

/** POST /api/workspace/ai/terminal — AI runs a terminal command */
router.post("/ai/terminal", async (req: Request, res: Response) => {
  const { command, cwd } = req.body;
  if (!command) return res.status(400).json({ error: "command required" });

  const workDir = cwd ? safePath(cwd) : WORKSPACE_ROOT;
  if (!workDir) return res.status(403).json({ error: "Path outside workspace" });

  try {
    const isWindows = process.platform === "win32";
    const shell = isWindows ? "cmd.exe" : "/bin/bash";
    const shellArgs = isWindows ? ["/c", command] : ["-c", command];

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
      let stdout = "";
      let stderr = "";
      const proc = spawn(shell, shellArgs, {
        cwd: workDir,
        env: { ...process.env, PYTHONIOENCODING: "utf-8" },
        timeout: 30000,
      });

      proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
      proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });
      proc.on("close", (code) => resolve({ stdout, stderr, exitCode: code ?? 1 }));
      proc.on("error", (err) => resolve({ stdout, stderr: String(err), exitCode: 1 }));
    });

    res.json({ command, ...result });
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
