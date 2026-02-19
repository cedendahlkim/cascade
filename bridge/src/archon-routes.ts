/**
 * Archon Knowledge Base Routes — Supabase pgvector RAG
 *
 * Provides:
 *   - Knowledge source management (CRUD)
 *   - Web crawling & text ingestion with Gemini embeddings
 *   - Semantic vector search (RAG)
 *   - Code example search
 *   - Task management (Archon-style)
 */

import { Router, Request, Response } from "express";

const router = Router();

// ── Config ──

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

function supaHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// ── Helpers ──

async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${EMBED_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });
  if (!res.ok) throw new Error(`Embed failed: ${res.status}`);
  const data = (await res.json()) as any;
  return data.embedding.values;
}

function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

async function supaRpc(fn: string, params: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: supaHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RPC ${fn} failed: ${res.status} ${err}`);
  }
  return res.json();
}

async function supaGet(table: string, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: supaHeaders(),
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
  return res.json();
}

async function supaPost(table: string, data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: supaHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${table} failed: ${res.status} ${err}`);
  }
  return res.json();
}

async function supaPatch(table: string, filter: string, data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: supaHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed: ${res.status}`);
  return res.json();
}

async function supaDelete(table: string, filter: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: supaHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status}`);
  return true;
}

// ══════════════════════════════════════════════════════════
// ── Knowledge Sources ──
// ══════════════════════════════════════════════════════════

/** GET /api/archon/sources — List all knowledge sources */
router.get("/sources", async (_req: Request, res: Response) => {
  try {
    const sources = await supaGet(
      "knowledge_sources",
      "select=id,title,url,source_type,status,metadata,created_at&order=created_at.desc"
    );
    res.json({ sources, count: sources.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/archon/sources — Create a new knowledge source */
router.post("/sources", async (req: Request, res: Response) => {
  const { title, url, source_type } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });

  try {
    const source = await supaPost("knowledge_sources", {
      title,
      url: url || null,
      source_type: source_type || "website",
      status: "pending",
    });
    res.json({ source: Array.isArray(source) ? source[0] : source });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** DELETE /api/archon/sources/:id — Delete a source and all its chunks */
router.delete("/sources/:id", async (req: Request, res: Response) => {
  try {
    await supaDelete("knowledge_sources", `id=eq.${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ══════════════════════════════════════════════════════════
// ── Ingest / Crawl ──
// ══════════════════════════════════════════════════════════

/** POST /api/archon/ingest — Ingest text into a source */
router.post("/ingest", async (req: Request, res: Response) => {
  const { source_id, text, url, section_title, chunk_size } = req.body;
  if (!source_id || !text) return res.status(400).json({ error: "source_id and text required" });

  try {
    // Update source status
    await supaPatch("knowledge_sources", `id=eq.${source_id}`, { status: "processing" });

    const chunks = chunkText(text, chunk_size || 800);
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await embed(chunks[i]);
        await supaPost("knowledge_chunks", {
          source_id,
          content: chunks[i],
          embedding,
          chunk_index: i,
          url: url || null,
          section_title: section_title || null,
          word_count: chunks[i].split(/\s+/).length,
        });
        created++;
        // Rate limit: Gemini free tier
        if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        errors.push(`chunk ${i}: ${err}`);
      }
    }

    await supaPatch("knowledge_sources", `id=eq.${source_id}`, {
      status: errors.length === 0 ? "ready" : "error",
      metadata: { chunks_created: created, errors: errors.length },
    });

    res.json({ created, total_chunks: chunks.length, errors });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/archon/crawl — Crawl a URL and ingest its content */
router.post("/crawl", async (req: Request, res: Response) => {
  const { url, title, max_pages } = req.body;
  if (!url) return res.status(400).json({ error: "url required" });

  try {
    // Create source
    const sourceArr = await supaPost("knowledge_sources", {
      title: title || url,
      url,
      source_type: "website",
      status: "crawling",
    });
    const source = Array.isArray(sourceArr) ? sourceArr[0] : sourceArr;

    // Fetch the page
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Gracestack-Archon/1.0 (knowledge crawler)" },
    });
    if (!pageRes.ok) throw new Error(`Fetch failed: ${pageRes.status}`);

    const html = await pageRes.text();

    // Simple HTML → text extraction
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 50) {
      await supaPatch("knowledge_sources", `id=eq.${source.id}`, { status: "error" });
      return res.status(400).json({ error: "Page has too little text content" });
    }

    // Extract code blocks from original HTML
    const codeBlocks: Array<{ code: string; lang: string }> = [];
    const codeRegex = /<code[^>]*class="[^"]*language-(\w+)[^"]*"[^>]*>([\s\S]*?)<\/code>/gi;
    let match;
    while ((match = codeRegex.exec(html)) !== null) {
      const lang = match[1];
      const code = match[2]
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .trim();
      if (code.length > 20) codeBlocks.push({ code, lang });
    }

    // Chunk and embed text
    const chunks = chunkText(text);
    let created = 0;

    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await embed(chunks[i]);
        await supaPost("knowledge_chunks", {
          source_id: source.id,
          content: chunks[i],
          embedding,
          chunk_index: i,
          url,
          word_count: chunks[i].split(/\s+/).length,
        });
        created++;
        if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.log(`[archon] Crawl chunk ${i} failed:`, String(err).slice(0, 120));
      }
    }

    // Ingest code examples
    let codeCreated = 0;
    for (const cb of codeBlocks.slice(0, 20)) {
      try {
        const embedding = await embed(`${cb.lang}: ${cb.code.slice(0, 500)}`);
        await supaPost("knowledge_code_examples", {
          source_id: source.id,
          code: cb.code,
          language: cb.lang,
          embedding,
        });
        codeCreated++;
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.log(`[archon] Code example failed:`, String(err).slice(0, 120));
      }
    }

    await supaPatch("knowledge_sources", `id=eq.${source.id}`, {
      status: "ready",
      metadata: { chunks: created, code_examples: codeCreated, text_length: text.length },
    });

    res.json({
      source,
      chunks_created: created,
      code_examples: codeCreated,
      text_length: text.length,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ══════════════════════════════════════════════════════════
// ── RAG Search ──
// ══════════════════════════════════════════════════════════

/** POST /api/archon/search — Semantic search in knowledge base */
router.post("/search", async (req: Request, res: Response) => {
  const { query, top_k, source_id } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  try {
    const embedding = await embed(query);
    const params: Record<string, unknown> = {
      query_embedding: embedding,
      match_count: top_k || 5,
    };
    if (source_id) params.filter_source_id = source_id;

    const results = await supaRpc("match_knowledge_chunks", params);
    res.json({ results, count: results.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/archon/search/code — Search code examples */
router.post("/search/code", async (req: Request, res: Response) => {
  const { query, top_k, source_id } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  try {
    const embedding = await embed(query);
    const params: Record<string, unknown> = {
      query_embedding: embedding,
      match_count: top_k || 5,
    };
    if (source_id) params.filter_source_id = source_id;

    const results = await supaRpc("match_code_examples", params);
    res.json({ results, count: results.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ══════════════════════════════════════════════════════════
// ── Task Management ──
// ══════════════════════════════════════════════════════════

/** GET /api/archon/projects — List projects */
router.get("/projects", async (_req: Request, res: Response) => {
  try {
    const projects = await supaGet("archon_projects", "select=*&order=created_at.desc");
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/archon/projects — Create project */
router.post("/projects", async (req: Request, res: Response) => {
  const { title, description, github_repo } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  try {
    const project = await supaPost("archon_projects", { title, description, github_repo });
    res.json({ project: Array.isArray(project) ? project[0] : project });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** GET /api/archon/tasks — List tasks */
router.get("/tasks", async (req: Request, res: Response) => {
  const { project_id, status } = req.query;
  let query = "select=*&order=created_at.desc";
  if (project_id) query += `&project_id=eq.${project_id}`;
  if (status) query += `&status=eq.${status}`;
  try {
    const tasks = await supaGet("archon_tasks", query);
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** POST /api/archon/tasks — Create task */
router.post("/tasks", async (req: Request, res: Response) => {
  const { title, description, project_id, priority, assignee } = req.body;
  if (!title) return res.status(400).json({ error: "title required" });
  try {
    const task = await supaPost("archon_tasks", {
      title,
      description: description || null,
      project_id: project_id || null,
      priority: priority || "medium",
      assignee: assignee || null,
    });
    res.json({ task: Array.isArray(task) ? task[0] : task });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** PATCH /api/archon/tasks/:id — Update task */
router.patch("/tasks/:id", async (req: Request, res: Response) => {
  const { status, title, description, priority, assignee } = req.body;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (priority) updates.priority = priority;
  if (assignee !== undefined) updates.assignee = assignee;

  try {
    const task = await supaPatch("archon_tasks", `id=eq.${req.params.id}`, updates);
    res.json({ task: Array.isArray(task) ? task[0] : task });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

/** DELETE /api/archon/tasks/:id — Delete task */
router.delete("/tasks/:id", async (req: Request, res: Response) => {
  try {
    await supaDelete("archon_tasks", `id=eq.${req.params.id}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ══════════════════════════════════════════════════════════
// ── Stats ──
// ══════════════════════════════════════════════════════════

/** GET /api/archon/stats — Knowledge base stats */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [sources, chunks, codeExamples, projects, tasks] = await Promise.all([
      supaGet("knowledge_sources", "select=id&limit=1000"),
      supaGet("knowledge_chunks", "select=id&limit=1"),
      supaGet("knowledge_code_examples", "select=id&limit=1"),
      supaGet("archon_projects", "select=id&limit=1000"),
      supaGet("archon_tasks", "select=id,status&limit=1000"),
    ]);

    const tasksByStatus: Record<string, number> = {};
    for (const t of tasks) {
      tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
    }

    res.json({
      sources: sources.length,
      projects: projects.length,
      tasks: tasks.length,
      tasks_by_status: tasksByStatus,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ══════════════════════════════════════════════════════════
// RAG CHAT — Search KB + stream Gemini answer
// ══════════════════════════════════════════════════════════

/** POST /api/archon/chat — RAG chat: search KB → build context → stream Gemini answer */
router.post("/chat", async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  try {
    // 1. Search knowledge base for relevant context
    let kbContext = "";
    let kbSources: string[] = [];
    try {
      const queryEmbed = await embed(message);
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_knowledge_chunks`, {
        method: "POST",
        headers: supaHeaders(),
        body: JSON.stringify({ query_embedding: queryEmbed, match_count: 5 }),
      });
      if (rpcRes.ok) {
        const results = (await rpcRes.json()) as any[];
        const relevant = results.filter((r: any) => r.similarity > 0.35);
        if (relevant.length > 0) {
          kbContext = relevant
            .map((r: any, i: number) => `[Dokument ${i + 1} | Relevans: ${(r.similarity * 100).toFixed(0)}% | Källa: ${r.url || "KB"}]\n${r.content}`)
            .join("\n\n---\n\n");
          kbSources = [...new Set(relevant.map((r: any) => r.url).filter(Boolean))];
        }
      }
    } catch { /* KB search failed silently */ }

    // 2. Also search code examples
    let codeContext = "";
    try {
      const codeEmbed = await embed(message);
      const codeRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_code_examples`, {
        method: "POST",
        headers: supaHeaders(),
        body: JSON.stringify({ query_embedding: codeEmbed, match_count: 3 }),
      });
      if (codeRes.ok) {
        const codeResults = (await codeRes.json()) as any[];
        const relevantCode = codeResults.filter((r: any) => r.similarity > 0.4);
        if (relevantCode.length > 0) {
          codeContext = "\n\nKODEXEMPEL FRÅN KUNSKAPSBASEN:\n" + relevantCode
            .map((r: any) => `\`\`\`${r.language || ""}\n${r.code}\n\`\`\`${r.summary ? `\n${r.summary}` : ""}`)
            .join("\n\n");
        }
      }
    } catch { /* code search failed silently */ }

    // 3. Build system prompt
    const systemPrompt = `Du är Frankenstein, en AI-assistent kopplad till Archon Knowledge Base.
Du har tillgång till en kunskapsbas med crawlad dokumentation och kodexempel.

INSTRUKTIONER:
- Svara på svenska om användaren skriver svenska
- Basera dina svar på kunskapsbasens innehåll när det är relevant
- Citera källor med [Källa: URL] när du refererar till specifik information
- Om kunskapsbasen inte har relevant information, säg det tydligt och svara med din allmänna kunskap
- Var koncis, strukturerad och handlingsorienterad
- Använd markdown-formatering (rubriker, listor, kodblock)
${kbContext ? `\nKUNSKAPSBAS — RELEVANT DOKUMENTATION:\n${kbContext}` : "\nKunskapsbasen innehåller ingen relevant information för denna fråga."}
${codeContext}`;

    // 4. Build conversation
    const contents: any[] = [];
    if (history?.length) {
      for (const h of history.slice(-8)) {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: `${systemPrompt}\n\nANVÄNDAREN: ${message}` }],
    });

    // 5. Stream response via SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Send KB sources as first event
    if (kbSources.length > 0) {
      res.write(`data: ${JSON.stringify({ type: "sources", sources: kbSources })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: "kb_count", count: kbContext ? kbContext.split("---").length : 0 })}\n\n`);

    const streamRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!streamRes.ok || !streamRes.body) {
      res.write(`data: ${JSON.stringify({ type: "error", error: `Gemini ${streamRes.status}` })}\n\n`);
      res.end();
      return;
    }

    const reader = streamRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

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
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ type: "text", text })}\n\n`);
          }
        } catch { /* skip malformed */ }
      }
    }

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: String(err) });
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`);
      res.end();
    }
  }
});

export default router;
