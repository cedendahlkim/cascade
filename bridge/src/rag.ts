/**
 * RAG (Retrieval-Augmented Generation) module.
 * 
 * Lightweight BM25-based document retrieval:
 * - Index text/files into chunks
 * - BM25 scoring for relevance ranking
 * - Auto-context injection into agent prompts
 * - No external APIs or embeddings needed
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename, extname } from "path";

// --- Types ---

export interface RagChunk {
  id: string;
  sourceId: string;
  sourceName: string;
  content: string;
  index: number;
  tokens: string[];
}

export interface RagSource {
  id: string;
  name: string;
  type: "file" | "text" | "url";
  origin: string;
  chunkCount: number;
  totalLength: number;
  indexedAt: string;
}

interface RagStore {
  sources: RagSource[];
  chunks: RagChunk[];
}

// --- Config ---

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;
const MAX_RESULTS = 5;
const MAX_CONTEXT_CHARS = 4000;

const DATA_DIR = join(
  process.env.CASCADE_REMOTE_WORKSPACE ||
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\/src\/rag\.ts$/, ""),
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
  type: "file" | "text" | "url" = "text",
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

export function ragStats(): { sourceCount: number; chunkCount: number; totalChars: number } {
  const store = loadStore();
  return {
    sourceCount: store.sources.length,
    chunkCount: store.chunks.length,
    totalChars: store.sources.reduce((sum, s) => sum + s.totalLength, 0),
  };
}
