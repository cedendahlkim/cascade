/**
 * RAG (Retrieval-Augmented Generation) module.
 * 
 * Features:
 * - Index text/files/PDFs/URLs into chunks
 * - BM25 scoring for relevance ranking
 * - Vector embeddings via Ollama for semantic search
 * - Auto-context injection into agent prompts
 * - File watcher for automatic re-indexing
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, watch, FSWatcher } from "fs";
import { join, basename, extname } from "path";

// --- Types ---

export interface RagChunk {
  id: string;
  sourceId: string;
  sourceName: string;
  content: string;
  index: number;
  tokens: string[];
  embedding?: number[];
}

export interface RagSource {
  id: string;
  name: string;
  type: "file" | "text" | "url" | "pdf";
  origin: string;
  chunkCount: number;
  totalLength: number;
  indexedAt: string;
}

interface RagStore {
  sources: RagSource[];
  chunks: RagChunk[];
}

interface WatchedPath {
  path: string;
  sourceId: string;
  watcher: FSWatcher;
}

// --- Config ---

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;
const MAX_RESULTS = 5;
const MAX_CONTEXT_CHARS = 4000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

// --- File Watcher State ---

const watchers: WatchedPath[] = [];
let autoReindexEnabled = false;
let reindexDebounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

const DATA_DIR = join(
  process.env.CASCADE_REMOTE_WORKSPACE ||
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\/(src|dist)\/rag\.(ts|js)$/, ""),
  "data"
);
const RAG_FILE = join(DATA_DIR, "rag-store.json");

// --- Storage ---

function loadStore(): RagStore {
  try {
    if (existsSync(RAG_FILE)) {
      return JSON.parse(readFileSync(RAG_FILE, "utf-8"));
    }
  } catch { /* fresh start */ }
  return { sources: [], chunks: [] };
}

function saveStore(store: RagStore): void {
  writeFileSync(RAG_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// --- Tokenization ---

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\såäöÅÄÖ]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// --- Chunking ---

function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    // Try to break at sentence/paragraph boundary
    if (end < text.length) {
      const slice = text.slice(start, end + 100);
      const breakPoints = [
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("\n"),
      ];
      for (const bp of breakPoints) {
        if (bp > chunkSize * 0.5) {
          end = start + bp + 1;
          break;
        }
      }
    }
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start = end - overlap;
    if (start >= text.length) break;
  }
  return chunks;
}

// --- BM25 Scoring ---

const BM25_K1 = 1.5;
const BM25_B = 0.75;

function computeBM25(
  queryTokens: string[],
  chunks: RagChunk[],
  topK: number = MAX_RESULTS
): { chunk: RagChunk; score: number }[] {
  if (chunks.length === 0) return [];

  // Document frequency
  const df: Record<string, number> = {};
  for (const chunk of chunks) {
    const seen = new Set(chunk.tokens);
    for (const token of seen) {
      df[token] = (df[token] || 0) + 1;
    }
  }

  const N = chunks.length;
  const avgDl = chunks.reduce((sum, c) => sum + c.tokens.length, 0) / N;

  // Score each chunk
  const scored = chunks.map((chunk) => {
    let score = 0;
    const dl = chunk.tokens.length;
    const tf: Record<string, number> = {};
    for (const t of chunk.tokens) {
      tf[t] = (tf[t] || 0) + 1;
    }

    for (const qt of queryTokens) {
      const termFreq = tf[qt] || 0;
      if (termFreq === 0) continue;
      const docFreq = df[qt] || 0;
      const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);
      const tfNorm = (termFreq * (BM25_K1 + 1)) / (termFreq + BM25_K1 * (1 - BM25_B + BM25_B * (dl / avgDl)));
      score += idf * tfNorm;
    }

    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// --- Public API ---

let nextSourceId = Date.now();

export function ragIndexText(
  text: string,
  name: string,
  type: "file" | "text" | "url" | "pdf" = "text",
  origin: string = ""
): RagSource {
  const store = loadStore();
  const sourceId = `src_${nextSourceId++}`;
  const textChunks = chunkText(text);

  const newChunks: RagChunk[] = textChunks.map((content, i) => ({
    id: `${sourceId}_${i}`,
    sourceId,
    sourceName: name,
    content,
    index: i,
    tokens: tokenize(content),
  }));

  const source: RagSource = {
    id: sourceId,
    name,
    type,
    origin: origin || name,
    chunkCount: newChunks.length,
    totalLength: text.length,
    indexedAt: new Date().toISOString(),
  };

  store.sources.push(source);
  store.chunks.push(...newChunks);
  saveStore(store);

  return source;
}

export function ragIndexFile(filePath: string): RagSource {
  const ext = extname(filePath).toLowerCase();
  const supportedText = [".txt", ".md", ".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".css", ".html", ".yml", ".yaml", ".toml", ".cfg", ".ini", ".sh", ".ps1", ".bat", ".csv", ".log", ".xml", ".svg", ".sql", ".env.example", ".gitignore"];

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  if (!supportedText.some((e) => filePath.toLowerCase().endsWith(e))) {
    throw new Error(`Unsupported file type: ${ext}. Supported: ${supportedText.join(", ")}`);
  }

  const content = readFileSync(filePath, "utf-8");
  return ragIndexText(content, basename(filePath), "file", filePath);
}

export function ragIndexDirectory(dirPath: string, extensions?: string[]): RagSource[] {
  const exts = extensions || [".md", ".txt", ".ts", ".tsx", ".js", ".py"];
  const sources: RagSource[] = [];

  function walk(dir: string) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (exts.some((e) => entry.endsWith(e))) {
          try {
            sources.push(ragIndexFile(fullPath));
          } catch { /* skip unreadable */ }
        }
      }
    } catch { /* skip inaccessible */ }
  }

  walk(dirPath);
  return sources;
}

export function ragSearch(query: string, topK: number = MAX_RESULTS): { content: string; source: string; score: number }[] {
  const store = loadStore();
  const queryTokens = tokenize(query);
  const results = computeBM25(queryTokens, store.chunks, topK);

  return results.map((r) => ({
    content: r.chunk.content,
    source: r.chunk.sourceName,
    score: Math.round(r.score * 100) / 100,
  }));
}

export function ragGetContext(query: string, maxChars: number = MAX_CONTEXT_CHARS): string {
  const results = ragSearch(query, 8);
  if (results.length === 0) return "";

  let context = "";
  for (const r of results) {
    const entry = `[${r.source}] (score: ${r.score})\n${r.content}\n\n`;
    if (context.length + entry.length > maxChars) break;
    context += entry;
  }

  return context.trim();
}

export function ragListSources(): RagSource[] {
  const store = loadStore();
  return store.sources;
}

export function ragDeleteSource(sourceId: string): boolean {
  const store = loadStore();
  const idx = store.sources.findIndex((s) => s.id === sourceId);
  if (idx === -1) return false;
  store.sources.splice(idx, 1);
  store.chunks = store.chunks.filter((c) => c.sourceId !== sourceId);
  saveStore(store);
  return true;
}

export function ragClear(): void {
  saveStore({ sources: [], chunks: [] });
}

export function ragStats(): { sourceCount: number; chunkCount: number; totalChars: number; embeddedChunks: number; autoReindex: boolean; watchedPaths: number } {
  const store = loadStore();
  return {
    sourceCount: store.sources.length,
    chunkCount: store.chunks.length,
    totalChars: store.sources.reduce((sum, s) => sum + s.totalLength, 0),
    embeddedChunks: store.chunks.filter(c => c.embedding && c.embedding.length > 0).length,
    autoReindex: autoReindexEnabled,
    watchedPaths: watchers.length,
  };
}

// --- G1: PDF Indexing ---

export async function ragIndexPdf(filePath: string): Promise<RagSource> {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = extname(filePath).toLowerCase();
  if (ext !== ".pdf") {
    throw new Error(`Not a PDF file: ${ext}`);
  }

  let text = "";
  try {
    // Dynamic import to avoid hard dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParseFn = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const buffer = readFileSync(filePath);
    const data = await pdfParseFn(buffer);
    text = data.text || "";
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err instanceof Error ? err.message : String(err)}. Install: npm i pdf-parse`);
  }

  if (!text.trim()) {
    throw new Error("PDF contains no extractable text (might be scanned/image-only)");
  }

  return ragIndexText(text, basename(filePath), "pdf", filePath);
}

// --- G2: URL Indexing ---

export async function ragIndexUrl(url: string, name?: string): Promise<RagSource> {
  let text = "";
  const sourceName = name || new URL(url).hostname + new URL(url).pathname.slice(0, 40);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CascadeRemote-RAG/1.0",
        "Accept": "text/html,application/xhtml+xml,text/plain,application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const rawText = await response.text();

    if (contentType.includes("application/json")) {
      // JSON: pretty-print for indexing
      try {
        text = JSON.stringify(JSON.parse(rawText), null, 2);
      } catch {
        text = rawText;
      }
    } else if (contentType.includes("text/plain")) {
      text = rawText;
    } else {
      // HTML: strip tags, extract meaningful content
      text = stripHtml(rawText);
    }
  } catch (err) {
    throw new Error(`URL fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!text.trim()) {
    throw new Error("URL returned no extractable text content");
  }

  return ragIndexText(text, sourceName, "url", url);
}

function stripHtml(html: string): string {
  // Remove script/style blocks entirely
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "");

  // Convert common block elements to newlines
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|h[1-6]|li|tr|blockquote|pre|section|article)[\s>]/gi, "\n")
    .replace(/<\/?(ul|ol|table|thead|tbody)[\s>]/gi, "\n");

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ");

  // Clean up whitespace
  text = text
    .split("\n")
    .map(line => line.replace(/\s+/g, " ").trim())
    .filter(line => line.length > 2)
    .join("\n");

  return text.trim();
}

// --- G3: Vector Embeddings via Ollama ---

let ollamaAvailable: boolean | null = null;

async function checkOllamaAvailable(): Promise<boolean> {
  if (ollamaAvailable !== null) return ollamaAvailable;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    ollamaAvailable = res.ok;
    if (ollamaAvailable) {
      console.log(`[rag] Ollama available at ${OLLAMA_URL} — vector embeddings enabled`);
    }
  } catch {
    ollamaAvailable = false;
  }
  return ollamaAvailable;
}

async function getEmbedding(text: string): Promise<number[] | null> {
  if (!(await checkOllamaAvailable())) return null;

  try {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, prompt: text.slice(0, 2000) }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const data = await res.json() as { embedding?: number[] };
    return data.embedding || null;
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function ragSearchSemantic(
  query: string,
  topK: number = MAX_RESULTS
): Promise<{ content: string; source: string; score: number }[]> {
  const store = loadStore();
  const chunksWithEmbeddings = store.chunks.filter(c => c.embedding && c.embedding.length > 0);

  if (chunksWithEmbeddings.length === 0) {
    // Fallback to BM25 if no embeddings
    return ragSearch(query, topK);
  }

  const queryEmbedding = await getEmbedding(query);
  if (!queryEmbedding) {
    // Fallback to BM25 if Ollama unavailable
    return ragSearch(query, topK);
  }

  const scored = chunksWithEmbeddings.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding!),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(s => s.score > 0.3)
    .map(r => ({
      content: r.chunk.content,
      source: r.chunk.sourceName,
      score: Math.round(r.score * 100) / 100,
    }));
}

export async function ragHybridSearch(
  query: string,
  topK: number = MAX_RESULTS,
  alpha: number = 0.5
): Promise<{ content: string; source: string; score: number }[]> {
  // alpha: 0 = pure BM25, 1 = pure vector, 0.5 = balanced
  const bm25Results = ragSearch(query, topK * 2);
  const semanticResults = await ragSearchSemantic(query, topK * 2);

  // Merge and deduplicate by content
  const scoreMap = new Map<string, { content: string; source: string; bm25: number; vector: number }>();

  // Normalize BM25 scores to 0-1
  const maxBm25 = Math.max(...bm25Results.map(r => r.score), 0.001);
  for (const r of bm25Results) {
    const key = r.content.slice(0, 100);
    const existing = scoreMap.get(key) || { content: r.content, source: r.source, bm25: 0, vector: 0 };
    existing.bm25 = r.score / maxBm25;
    scoreMap.set(key, existing);
  }

  for (const r of semanticResults) {
    const key = r.content.slice(0, 100);
    const existing = scoreMap.get(key) || { content: r.content, source: r.source, bm25: 0, vector: 0 };
    existing.vector = r.score;
    scoreMap.set(key, existing);
  }

  return Array.from(scoreMap.values())
    .map(r => ({
      content: r.content,
      source: r.source,
      score: Math.round(((1 - alpha) * r.bm25 + alpha * r.vector) * 100) / 100,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function ragEmbedAllChunks(): Promise<{ embedded: number; skipped: number; failed: number }> {
  const store = loadStore();
  let embedded = 0, skipped = 0, failed = 0;

  for (const chunk of store.chunks) {
    if (chunk.embedding && chunk.embedding.length > 0) {
      skipped++;
      continue;
    }

    const emb = await getEmbedding(chunk.content);
    if (emb) {
      chunk.embedding = emb;
      embedded++;
    } else {
      failed++;
    }

    // Rate limit: small delay between requests
    if (embedded % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  if (embedded > 0) {
    saveStore(store);
    console.log(`[rag] Embedded ${embedded} chunks (${skipped} already done, ${failed} failed)`);
  }

  return { embedded, skipped, failed };
}

// --- G4: Auto Re-indexing via File Watcher ---

export function ragStartAutoReindex(paths?: string[]): { watching: string[]; enabled: boolean } {
  autoReindexEnabled = true;

  // Default: watch data directory
  const watchPaths = paths || [DATA_DIR];
  const watching: string[] = [];

  for (const watchPath of watchPaths) {
    if (!existsSync(watchPath)) continue;

    // Don't double-watch
    if (watchers.some(w => w.path === watchPath)) {
      watching.push(watchPath);
      continue;
    }

    try {
      const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (!filename || !autoReindexEnabled) return;

        const fullPath = join(watchPath, filename);
        const ext = extname(filename).toLowerCase();
        const supportedExts = [".txt", ".md", ".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".css", ".html", ".yml", ".yaml", ".pdf"];

        if (!supportedExts.includes(ext)) return;
        if (filename.includes("node_modules") || filename.includes(".git") || filename.startsWith(".")) return;

        // Debounce: wait 2s after last change before re-indexing
        const timerKey = fullPath;
        if (reindexDebounceTimers[timerKey]) {
          clearTimeout(reindexDebounceTimers[timerKey]);
        }

        reindexDebounceTimers[timerKey] = setTimeout(async () => {
          delete reindexDebounceTimers[timerKey];
          try {
            if (!existsSync(fullPath)) {
              // File deleted — remove from index
              const store = loadStore();
              const src = store.sources.find(s => s.origin === fullPath);
              if (src) {
                ragDeleteSource(src.id);
                console.log(`[rag] Auto-removed deleted file: ${filename}`);
              }
              return;
            }

            // Remove old version
            const store = loadStore();
            const existingSrc = store.sources.find(s => s.origin === fullPath);
            if (existingSrc) {
              ragDeleteSource(existingSrc.id);
            }

            // Re-index
            if (ext === ".pdf") {
              await ragIndexPdf(fullPath);
            } else {
              ragIndexFile(fullPath);
            }
            console.log(`[rag] Auto-reindexed: ${filename}`);
          } catch (err) {
            // Silently skip files that can't be indexed
          }
        }, 2000);
      });

      watchers.push({ path: watchPath, sourceId: "", watcher });
      watching.push(watchPath);
      console.log(`[rag] Watching for changes: ${watchPath}`);
    } catch (err) {
      console.error(`[rag] Failed to watch ${watchPath}:`, err instanceof Error ? err.message : err);
    }
  }

  return { watching, enabled: true };
}

export function ragStopAutoReindex(): void {
  autoReindexEnabled = false;
  for (const w of watchers) {
    try { w.watcher.close(); } catch { /* ignore */ }
  }
  watchers.length = 0;
  for (const key of Object.keys(reindexDebounceTimers)) {
    clearTimeout(reindexDebounceTimers[key]);
  }
  reindexDebounceTimers = {};
  console.log("[rag] Auto-reindex stopped");
}

export function ragGetAutoReindexStatus(): { enabled: boolean; watchedPaths: string[] } {
  return {
    enabled: autoReindexEnabled,
    watchedPaths: watchers.map(w => w.path),
  };
}
