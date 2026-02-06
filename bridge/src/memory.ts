/**
 * Persistent memory storage for the AI agent.
 * 
 * Stores memories as JSON on disk. Each memory has:
 * - id: unique identifier
 * - content: the actual memory text
 * - tags: searchable tags
 * - createdAt: timestamp
 * - updatedAt: timestamp
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export interface Memory {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = join(
  process.env.CASCADE_REMOTE_WORKSPACE ||
    new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1").replace(/\/src\/memory\.ts$/, ""),
  "data"
);
const MEMORY_FILE = join(DATA_DIR, "memories.json");

function loadAll(): Memory[] {
  try {
    if (!existsSync(MEMORY_FILE)) return [];
    const raw = readFileSync(MEMORY_FILE, "utf-8");
    return JSON.parse(raw) as Memory[];
  } catch {
    return [];
  }
}

function saveAll(memories: Memory[]): void {
  writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), "utf-8");
}

let nextId = Date.now();
function genId(): string {
  return `mem_${nextId++}`;
}

export function createMemory(content: string, tags: string[] = []): Memory {
  const memories = loadAll();
  const mem: Memory = {
    id: genId(),
    content,
    tags: tags.map((t) => t.toLowerCase()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memories.push(mem);
  saveAll(memories);
  return mem;
}

export function updateMemory(id: string, content: string, tags?: string[]): Memory | null {
  const memories = loadAll();
  const idx = memories.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  memories[idx].content = content;
  if (tags) memories[idx].tags = tags.map((t) => t.toLowerCase());
  memories[idx].updatedAt = new Date().toISOString();
  saveAll(memories);
  return memories[idx];
}

export function deleteMemory(id: string): boolean {
  const memories = loadAll();
  const idx = memories.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  memories.splice(idx, 1);
  saveAll(memories);
  return true;
}

export function searchMemories(query: string): Memory[] {
  const memories = loadAll();
  const q = query.toLowerCase();
  return memories.filter(
    (m) =>
      m.content.toLowerCase().includes(q) ||
      m.tags.some((t) => t.includes(q))
  );
}

export function listMemories(): Memory[] {
  return loadAll();
}

export function getRecentMemories(limit: number = 10): Memory[] {
  const memories = loadAll();
  return memories
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

export function getMemorySummary(): string {
  const memories = loadAll();
  if (memories.length === 0) return "No memories stored yet.";

  const recent = memories
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 15);

  const lines = recent.map(
    (m) => `[${m.id}] (${m.tags.join(", ") || "no tags"}) ${m.content.slice(0, 120)}`
  );

  return `${memories.length} memories stored. Recent:\n${lines.join("\n")}`;
}
