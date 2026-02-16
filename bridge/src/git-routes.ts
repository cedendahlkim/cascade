/**
 * Git Integration Routes
 * 
 * Provides REST API for git operations:
 * - Status, diff, log, branches
 * - AI-generated commit messages
 * - Commit, checkout, push
 */
import { Router, Request, Response } from "express";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const router = Router();

// Configurable repo path — defaults to project root
const REPO_PATH = process.env.GIT_REPO_PATH || process.cwd();
const MAX_LOG_ENTRIES = 100;
const MAX_DIFF_SIZE = 500_000; // 500KB

/** Run a git command safely */
async function git(...args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd: REPO_PATH,
      maxBuffer: 2 * 1024 * 1024,
      timeout: 15_000,
    });
    return stdout.trim();
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string };
    throw new Error(e.stderr || e.message || "Git command failed");
  }
}

// ─── Status ───────────────────────────────────────────────────
router.get("/api/git/status", async (_req: Request, res: Response) => {
  try {
    const [statusRaw, branchRaw, remoteRaw] = await Promise.all([
      git("status", "--porcelain=v1"),
      git("rev-parse", "--abbrev-ref", "HEAD"),
      git("remote", "-v").catch(() => ""),
    ]);

    const files = statusRaw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const status = line.substring(0, 2);
        const path = line.substring(3);
        let state = "modified";
        if (status.includes("?")) state = "untracked";
        else if (status.includes("A")) state = "added";
        else if (status.includes("D")) state = "deleted";
        else if (status.includes("R")) state = "renamed";
        else if (status.includes("M")) state = "modified";
        const staged = status[0] !== " " && status[0] !== "?";
        return { path, status: status.trim(), state, staged };
      });

    const ahead = await git("rev-list", "--count", "@{u}..HEAD").catch(() => "0");
    const behind = await git("rev-list", "--count", "HEAD..@{u}").catch(() => "0");

    res.json({
      branch: branchRaw,
      files,
      clean: files.length === 0,
      ahead: parseInt(ahead, 10),
      behind: parseInt(behind, 10),
      remote: remoteRaw.split("\n")[0]?.split("\t")[1]?.split(" ")[0] || null,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Diff ─────────────────────────────────────────────────────
router.get("/api/git/diff", async (req: Request, res: Response) => {
  try {
    const staged = req.query.staged === "true";
    const filePath = req.query.file as string | undefined;

    const args = ["diff", "--stat"];
    if (staged) args.splice(1, 0, "--cached");
    if (filePath) args.push("--", filePath);

    const stat = await git(...args);

    // Full diff (limited size)
    const fullArgs = ["diff"];
    if (staged) fullArgs.push("--cached");
    if (filePath) fullArgs.push("--", filePath);
    let fullDiff = await git(...fullArgs);
    const truncated = fullDiff.length > MAX_DIFF_SIZE;
    if (truncated) fullDiff = fullDiff.substring(0, MAX_DIFF_SIZE) + "\n... (trunkerad)";

    res.json({ stat, diff: fullDiff, truncated });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Log ──────────────────────────────────────────────────────
router.get("/api/git/log", async (req: Request, res: Response) => {
  try {
    const count = Math.min(parseInt(req.query.count as string, 10) || 30, MAX_LOG_ENTRIES);
    const filePath = req.query.file as string | undefined;

    const args = [
      "log",
      `--max-count=${count}`,
      "--format=%H|%h|%an|%ae|%aI|%s",
    ];
    if (filePath) args.push("--", filePath);

    const raw = await git(...args);
    const commits = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, short, author, email, date, ...msgParts] = line.split("|");
        return { hash, short, author, email, date, message: msgParts.join("|") };
      });

    res.json({ commits, count: commits.length });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Branches ─────────────────────────────────────────────────
router.get("/api/git/branches", async (_req: Request, res: Response) => {
  try {
    const [branchRaw, currentRaw] = await Promise.all([
      git("branch", "-a", "--format=%(refname:short)|%(objectname:short)|%(committerdate:iso8601)|%(subject)"),
      git("rev-parse", "--abbrev-ref", "HEAD"),
    ]);

    const branches = branchRaw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [name, hash, date, ...msgParts] = line.split("|");
        return {
          name,
          hash,
          date,
          message: msgParts.join("|"),
          current: name === currentRaw,
          remote: name.startsWith("origin/"),
        };
      });

    res.json({ current: currentRaw, branches });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── File diff (single file) ─────────────────────────────────
router.get("/api/git/diff/:file(*)", async (req: Request, res: Response) => {
  try {
    const filePath = req.params.file as string;
    const diff = await git("diff", "--", filePath);
    const stagedDiff = await git("diff", "--cached", "--", filePath);
    res.json({ diff: diff || stagedDiff, file: filePath });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Stage files ──────────────────────────────────────────────
router.post("/api/git/stage", async (req: Request, res: Response) => {
  try {
    const { files } = req.body as { files?: string[] };
    if (!files || files.length === 0) {
      await git("add", "-A");
    } else {
      await git("add", "--", ...files);
    }
    res.json({ ok: true, staged: files || ["all"] });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Unstage files ────────────────────────────────────────────
router.post("/api/git/unstage", async (req: Request, res: Response) => {
  try {
    const { files } = req.body as { files?: string[] };
    if (!files || files.length === 0) {
      await git("reset", "HEAD");
    } else {
      await git("reset", "HEAD", "--", ...files);
    }
    res.json({ ok: true, unstaged: files || ["all"] });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Commit ───────────────────────────────────────────────────
router.post("/api/git/commit", async (req: Request, res: Response) => {
  try {
    const { message } = req.body as { message: string };
    if (!message?.trim()) {
      return res.status(400).json({ error: "Commit message krävs" });
    }
    const result = await git("commit", "-m", message.trim());
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Push ─────────────────────────────────────────────────────
router.post("/api/git/push", async (_req: Request, res: Response) => {
  try {
    const result = await git("push");
    res.json({ ok: true, result: result || "Pushed successfully" });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Pull ─────────────────────────────────────────────────────
router.post("/api/git/pull", async (_req: Request, res: Response) => {
  try {
    const result = await git("pull", "--ff-only");
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Checkout branch ──────────────────────────────────────────
router.post("/api/git/checkout", async (req: Request, res: Response) => {
  try {
    const { branch } = req.body as { branch: string };
    if (!branch?.trim()) {
      return res.status(400).json({ error: "Branch-namn krävs" });
    }
    // Sanitize: only allow alphanumeric, dash, underscore, slash, dot
    if (!/^[\w./-]+$/.test(branch)) {
      return res.status(400).json({ error: "Ogiltigt branch-namn" });
    }
    const result = await git("checkout", branch.trim());
    res.json({ ok: true, branch: branch.trim(), result });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Discard changes (restore file) ──────────────────────────
router.post("/api/git/discard", async (req: Request, res: Response) => {
  try {
    const { files } = req.body as { files: string[] };
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Ange filer att återställa" });
    }
    await git("checkout", "--", ...files);
    res.json({ ok: true, restored: files });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── AI Commit Message ────────────────────────────────────────
router.post("/api/git/ai-commit-message", async (_req: Request, res: Response) => {
  try {
    // Get staged diff, or all diff if nothing staged
    let diff = await git("diff", "--cached");
    if (!diff) diff = await git("diff");
    if (!diff) {
      return res.status(400).json({ error: "Inga ändringar att beskriva" });
    }

    // Truncate diff for LLM context
    const maxChars = 8000;
    const truncatedDiff = diff.length > maxChars
      ? diff.substring(0, maxChars) + "\n... (trunkerad)"
      : diff;

    // Get file stat for context
    let stat = await git("diff", "--cached", "--stat").catch(() => "");
    if (!stat) stat = await git("diff", "--stat").catch(() => "");

    const prompt = `Du är en expert på att skriva git commit messages. Analysera denna diff och generera ett commit message.

Regler:
- Använd Conventional Commits-format: type(scope): description
- Types: feat, fix, refactor, docs, style, test, chore, perf
- Skriv på engelska
- Första raden max 72 tecken
- Om det behövs, lägg till en tom rad och sedan en body med bullet points
- Var specifik om vad som ändrades

Filstatistik:
${stat}

Diff:
\`\`\`
${truncatedDiff}
\`\`\`

Svara ENBART med commit message, inget annat.`;

    // Try to use the agent's LLM (Claude or Gemini)
    const { Anthropic } = await import("@anthropic-ai/sdk").catch(() => ({ Anthropic: null }));
    
    let commitMessage = "";

    if (Anthropic && process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      commitMessage = (response.content[0] as { type: string; text: string }).text.trim();
    } else if (process.env.GEMINI_API_KEY) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
          }),
        }
      );
      const data = await geminiRes.json();
      commitMessage = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    }

    if (!commitMessage) {
      // Fallback: generate from stat
      const lines = stat.split("\n").filter(Boolean);
      const fileCount = lines.length - 1; // last line is summary
      commitMessage = `chore: update ${fileCount} file${fileCount !== 1 ? "s" : ""}`;
    }

    res.json({ message: commitMessage, diff_size: diff.length, truncated: diff.length > maxChars });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── Stash ────────────────────────────────────────────────────
router.post("/api/git/stash", async (req: Request, res: Response) => {
  try {
    const { action, message } = req.body as { action?: string; message?: string };
    if (action === "pop") {
      const result = await git("stash", "pop");
      res.json({ ok: true, result });
    } else if (action === "list") {
      const result = await git("stash", "list");
      const stashes = result.split("\n").filter(Boolean).map((line, i) => ({
        index: i,
        ref: line.split(":")[0],
        message: line.split(":").slice(1).join(":").trim(),
      }));
      res.json({ stashes });
    } else {
      const args = ["stash", "push"];
      if (message) args.push("-m", message);
      const result = await git(...args);
      res.json({ ok: true, result });
    }
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
