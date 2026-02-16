/**
 * Weaviate-backed RAG module for Cascade Remote.
 * 
 * Provides semantic vector search via Weaviate + Ollama embeddings.
 * Falls back gracefully to BM25 (rag.ts) if Weaviate is unavailable.
 * 
 * Collections:
 *   - Knowledge: indexed documents, files, text snippets
 *   - Memories: agent memories for semantic recall
 */
import weaviate, { WeaviateClient, vectors, dataType } from "weaviate-client";

// --- State ---

let client: WeaviateClient | null = null;
let connected = false;
let initPromise: Promise<void> | null = null;

const WEAVIATE_HOST = process.env.WEAVIATE_HOST || "localhost";
const WEAVIATE_PORT = parseInt(process.env.WEAVIATE_PORT || "8080", 10);
const WEAVIATE_GRPC_PORT = parseInt(process.env.WEAVIATE_GRPC_PORT || "50051", 10);
// URL that the Weaviate container uses to reach Ollama (Docker internal network)
const OLLAMA_EMBED_URL_INTERNAL = process.env.OLLAMA_EMBED_URL_INTERNAL || "http://ollama-embed:11434";
// URL for direct access from host (not used for vectorizer config)
const OLLAMA_EMBED_URL = process.env.OLLAMA_EMBED_URL || "http://localhost:11435";
const EMBED_MODEL = process.env.WEAVIATE_EMBED_MODEL || "nomic-embed-text";

// --- Connection ---

export async function initWeaviate(): Promise<boolean> {
  if (connected && client) return true;
  if (initPromise) {
    await initPromise;
    return connected;
  }

  initPromise = (async () => {
    try {
      client = await weaviate.connectToLocal({
        host: WEAVIATE_HOST,
        port: WEAVIATE_PORT,
        grpcPort: WEAVIATE_GRPC_PORT,
      });

      // Test connection
      const ready = await client.isReady();
      if (!ready) {
        console.log("[weaviate] Server not ready");
        client = null;
        connected = false;
        return;
      }

      connected = true;
      console.log(`[weaviate] Connected to ${WEAVIATE_HOST}:${WEAVIATE_PORT}`);

      // Ensure collections exist
      await ensureCollections();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[weaviate] Not available (${msg.slice(0, 80)}) — using BM25 fallback`);
      client = null;
      connected = false;
    }
  })();

  await initPromise;
  initPromise = null;
  return connected;
}

async function ensureCollections(): Promise<void> {
  if (!client) return;

  try {
    const collections = await client.collections.listAll();
    const names = collections.map((c: { name: string }) => c.name);

    const ollamaVectorizer = vectors.text2VecOllama({
      apiEndpoint: OLLAMA_EMBED_URL_INTERNAL,
      model: EMBED_MODEL,
    });

    if (!names.includes("Knowledge")) {
      await client.collections.create({
        name: "Knowledge",
        vectorizers: ollamaVectorizer,
        properties: [
          { name: "content", dataType: dataType.TEXT },
          { name: "source_name", dataType: dataType.TEXT },
          { name: "source_id", dataType: dataType.TEXT },
          { name: "source_type", dataType: dataType.TEXT },
          { name: "chunk_index", dataType: dataType.INT },
          { name: "indexed_at", dataType: dataType.TEXT },
        ],
      });
      console.log("[weaviate] Created 'Knowledge' collection (text2vec-ollama)");
    }

    if (!names.includes("AgentMemory")) {
      await client.collections.create({
        name: "AgentMemory",
        vectorizers: ollamaVectorizer,
        properties: [
          { name: "content", dataType: dataType.TEXT },
          { name: "tags", dataType: dataType.TEXT },
          { name: "created_at", dataType: dataType.TEXT },
          { name: "memory_id", dataType: dataType.TEXT },
        ],
      });
      console.log("[weaviate] Created 'AgentMemory' collection (text2vec-ollama)");
    }
  } catch (err) {
    console.error("[weaviate] Error creating collections:", err instanceof Error ? err.message : err);
  }
}

export function isWeaviateConnected(): boolean {
  return connected && client !== null;
}

export async function closeWeaviate(): Promise<void> {
  if (client) {
    client.close();
    client = null;
    connected = false;
  }
}

// --- Chunking (same logic as rag.ts) ---

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    if (end < text.length) {
      const slice = text.slice(start, end + 100);
      const breakPoints = [
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(".\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("\n"),
      ];
      for (const bp of breakPoints) {
        if (bp > CHUNK_SIZE * 0.5) {
          end = start + bp + 1;
          break;
        }
      }
    }
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    start = end - CHUNK_OVERLAP;
    if (start >= text.length) break;
  }
  return chunks;
}

// --- Indexing ---

export interface WeaviateSource {
  id: string;
  name: string;
  type: "file" | "text" | "url";
  chunkCount: number;
  totalLength: number;
  indexedAt: string;
}

export async function weaviateIndexText(
  text: string,
  name: string,
  type: "file" | "text" | "url" = "text"
): Promise<WeaviateSource | null> {
  if (!client || !connected) return null;

  const sourceId = `wsrc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const chunks = chunkText(text);
  const indexedAt = new Date().toISOString();

  try {
    const collection = client.collections.get("Knowledge");

    const objects = chunks.map((content, i) => ({
      properties: {
        content,
        source_name: name,
        source_id: sourceId,
        source_type: type,
        chunk_index: i,
        indexed_at: indexedAt,
      },
    }));

    // Batch insert
    const batchSize = 100;
    for (let i = 0; i < objects.length; i += batchSize) {
      const batch = objects.slice(i, i + batchSize);
      await collection.data.insertMany(batch as any);
    }

    console.log(`[weaviate] Indexed "${name}": ${chunks.length} chunks`);

    return {
      id: sourceId,
      name,
      type,
      chunkCount: chunks.length,
      totalLength: text.length,
      indexedAt,
    };
  } catch (err) {
    console.error("[weaviate] Index error:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function weaviateIndexFile(filePath: string): Promise<WeaviateSource | null> {
  const { readFileSync, existsSync } = await import("fs");
  const { basename } = await import("path");

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf-8");
  return weaviateIndexText(content, basename(filePath), "file");
}

// --- Search ---

export interface WeaviateSearchResult {
  content: string;
  source: string;
  score: number;
  sourceId?: string;
}

export async function weaviateSearch(
  query: string,
  topK: number = 5
): Promise<WeaviateSearchResult[]> {
  if (!client || !connected) return [];

  try {
    const collection = client.collections.get("Knowledge");

    const result = await collection.query.nearText(query, {
      limit: topK,
      returnMetadata: ["distance"] as any,
    });

    return result.objects.map((obj: any) => ({
      content: obj.properties.content as string,
      source: obj.properties.source_name as string,
      score: obj.metadata?.distance != null ? Math.round((1 - obj.metadata.distance) * 100) / 100 : 0.5,
      sourceId: obj.properties.source_id as string,
    }));
  } catch (err) {
    console.error("[weaviate] Search error:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function weaviateHybridSearch(
  query: string,
  topK: number = 5,
  alpha: number = 0.5
): Promise<WeaviateSearchResult[]> {
  if (!client || !connected) return [];

  try {
    const collection = client.collections.get("Knowledge");

    const result = await collection.query.hybrid(query, {
      limit: topK,
      alpha, // 0 = pure BM25, 1 = pure vector, 0.5 = balanced
      returnMetadata: ["score"] as any,
    });

    return result.objects.map((obj: any) => ({
      content: obj.properties.content as string,
      source: obj.properties.source_name as string,
      score: obj.metadata?.score != null ? Math.round(obj.metadata.score * 100) / 100 : 0.5,
      sourceId: obj.properties.source_id as string,
    }));
  } catch (err) {
    console.error("[weaviate] Hybrid search error:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function weaviateGetContext(
  query: string,
  maxChars: number = 4000
): Promise<string> {
  // Try hybrid search first (best of both worlds)
  let results = await weaviateHybridSearch(query, 8, 0.6);

  // Fallback to pure vector search
  if (results.length === 0) {
    results = await weaviateSearch(query, 8);
  }

  if (results.length === 0) return "";

  let context = "";
  for (const r of results) {
    const entry = `[${r.source}] (score: ${r.score})\n${r.content}\n\n`;
    if (context.length + entry.length > maxChars) break;
    context += entry;
  }

  return context.trim();
}

// --- Source Management ---

export async function weaviateListSources(): Promise<WeaviateSource[]> {
  if (!client || !connected) return [];

  try {
    const collection = client.collections.get("Knowledge");

    // Aggregate by source_id to get unique sources
    const result = await collection.query.fetchObjects({
      limit: 10000,
    });

    const sourceMap = new Map<string, WeaviateSource>();

    for (const obj of result.objects as any[]) {
      const sid = obj.properties.source_id as string;
      if (!sourceMap.has(sid)) {
        sourceMap.set(sid, {
          id: sid,
          name: obj.properties.source_name as string,
          type: (obj.properties.source_type as "file" | "text" | "url") || "text",
          chunkCount: 0,
          totalLength: 0,
          indexedAt: obj.properties.indexed_at as string || "",
        });
      }
      const src = sourceMap.get(sid)!;
      src.chunkCount++;
      src.totalLength += (obj.properties.content as string || "").length;
    }

    return Array.from(sourceMap.values());
  } catch (err) {
    console.error("[weaviate] List sources error:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function weaviateDeleteSource(sourceId: string): Promise<boolean> {
  if (!client || !connected) return false;

  try {
    const collection = client.collections.get("Knowledge");

    await collection.data.deleteMany(
      collection.filter.byProperty("source_id").equal(sourceId)
    );

    console.log(`[weaviate] Deleted source: ${sourceId}`);
    return true;
  } catch (err) {
    console.error("[weaviate] Delete error:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function weaviateStats(): Promise<{
  sourceCount: number;
  chunkCount: number;
  totalChars: number;
  backend: "weaviate" | "bm25";
}> {
  if (!client || !connected) {
    return { sourceCount: 0, chunkCount: 0, totalChars: 0, backend: "bm25" };
  }

  try {
    const sources = await weaviateListSources();
    return {
      sourceCount: sources.length,
      chunkCount: sources.reduce((sum, s) => sum + s.chunkCount, 0),
      totalChars: sources.reduce((sum, s) => sum + s.totalLength, 0),
      backend: "weaviate",
    };
  } catch {
    return { sourceCount: 0, chunkCount: 0, totalChars: 0, backend: "weaviate" };
  }
}

// --- Memory Integration ---

export async function weaviateIndexMemory(
  memoryId: string,
  content: string,
  tags: string[]
): Promise<boolean> {
  if (!client || !connected) return false;

  try {
    const collection = client.collections.get("AgentMemory");

    await collection.data.insert({
      properties: {
        content,
        tags: tags.join(", "),
        created_at: new Date().toISOString(),
        memory_id: memoryId,
      },
    });

    return true;
  } catch (err) {
    console.error("[weaviate] Memory index error:", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function weaviateSearchMemories(
  query: string,
  topK: number = 5
): Promise<{ content: string; tags: string; score: number; memoryId: string }[]> {
  if (!client || !connected) return [];

  try {
    const collection = client.collections.get("AgentMemory");

    const result = await collection.query.nearText(query, {
      limit: topK,
      returnMetadata: ["distance"] as any,
    });

    return result.objects.map((obj: any) => ({
      content: obj.properties.content as string,
      tags: obj.properties.tags as string || "",
      score: obj.metadata?.distance != null ? Math.round((1 - obj.metadata.distance) * 100) / 100 : 0.5,
      memoryId: obj.properties.memory_id as string || "",
    }));
  } catch (err) {
    console.error("[weaviate] Memory search error:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function weaviateDeleteMemory(memoryId: string): Promise<boolean> {
  if (!client || !connected) return false;

  try {
    const collection = client.collections.get("AgentMemory");

    await collection.data.deleteMany(
      collection.filter.byProperty("memory_id").equal(memoryId)
    );

    return true;
  } catch (err) {
    console.error("[weaviate] Memory delete error:", err instanceof Error ? err.message : err);
    return false;
  }
}
