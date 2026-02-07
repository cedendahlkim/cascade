/**
 * Shared Memory System for AI Collaboration
 * 
 * Allows Claude and Gemini to save and read shared insights,
 * findings, decisions, and research notes during collaboration.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { v4 as uuidv4 } from "uuid";

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || join(process.cwd(), "..");
const SHARED_MEMORY_FILE = join(WORKSPACE_ROOT, "bridge", "data", "shared-memory.json");

export interface SharedMemory {
  id: string;
  type: "insight" | "finding" | "decision" | "question" | "todo" | "summary";
  content: string;
  author: "claude" | "gemini" | "both";
  topic: string;
  tags: string[];
  timestamp: string;
  references: string[]; // IDs of related memories
}

export interface ResearchSession {
  id: string;
  topic: string;
  status: "active" | "completed" | "paused";
  phase: "analyze" | "discuss" | "synthesize" | "conclude";
  rounds: number;
  maxRounds: number;
  memories: string[]; // memory IDs created during session
  summary: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface SharedMemoryStore {
  memories: SharedMemory[];
  sessions: ResearchSession[];
}

let store: SharedMemoryStore = { memories: [], sessions: [] };

function ensureDir() {
  const dir = dirname(SHARED_MEMORY_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function loadSharedMemory(): void {
  try {
    if (existsSync(SHARED_MEMORY_FILE)) {
      store = JSON.parse(readFileSync(SHARED_MEMORY_FILE, "utf-8"));
    }
  } catch {
    store = { memories: [], sessions: [] };
  }
}

export function saveSharedMemory(): void {
  try {
    ensureDir();
    writeFileSync(SHARED_MEMORY_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("[shared-memory] Failed to save:", err);
  }
}

export function addMemory(memory: Omit<SharedMemory, "id" | "timestamp">): SharedMemory {
  const entry: SharedMemory = {
    ...memory,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  store.memories.push(entry);
  // Keep max 500 memories
  if (store.memories.length > 500) store.memories = store.memories.slice(-500);
  saveSharedMemory();
  return entry;
}

export function getMemories(filter?: { topic?: string; type?: string; author?: string; limit?: number }): SharedMemory[] {
  let results = [...store.memories];
  if (filter?.topic) results = results.filter(m => m.topic.toLowerCase().includes(filter.topic!.toLowerCase()));
  if (filter?.type) results = results.filter(m => m.type === filter.type);
  if (filter?.author) results = results.filter(m => m.author === filter.author);
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (filter?.limit) results = results.slice(0, filter.limit);
  return results;
}

export function getMemoriesBySession(sessionId: string): SharedMemory[] {
  const session = store.sessions.find(s => s.id === sessionId);
  if (!session) return [];
  return store.memories.filter(m => session.memories.includes(m.id));
}

export function deleteMemoryById(id: string): boolean {
  const idx = store.memories.findIndex(m => m.id === id);
  if (idx === -1) return false;
  store.memories.splice(idx, 1);
  saveSharedMemory();
  return true;
}

export function clearMemories(): void {
  store.memories = [];
  saveSharedMemory();
}

export function createSession(topic: string, maxRounds: number): ResearchSession {
  const session: ResearchSession = {
    id: uuidv4(),
    topic,
    status: "active",
    phase: "analyze",
    rounds: 0,
    maxRounds,
    memories: [],
    summary: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
  store.sessions.push(session);
  saveSharedMemory();
  return session;
}

export function updateSession(id: string, updates: Partial<ResearchSession>): ResearchSession | null {
  const session = store.sessions.find(s => s.id === id);
  if (!session) return null;
  Object.assign(session, updates);
  saveSharedMemory();
  return session;
}

export function getSession(id: string): ResearchSession | null {
  return store.sessions.find(s => s.id === id) || null;
}

export function getSessions(limit = 20): ResearchSession[] {
  return [...store.sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, limit);
}

export function addMemoryToSession(sessionId: string, memoryId: string): void {
  const session = store.sessions.find(s => s.id === sessionId);
  if (session) {
    session.memories.push(memoryId);
    saveSharedMemory();
  }
}

export function formatMemoriesForPrompt(memories: SharedMemory[]): string {
  if (memories.length === 0) return "Inga delade minnen ännu.";
  return memories.map(m =>
    `[${m.type.toUpperCase()}] (${m.author}) ${m.content}${m.tags.length ? ` [${m.tags.join(", ")}]` : ""}`
  ).join("\n");
}

export function getAllMemories(): SharedMemory[] {
  return [...store.memories];
}

export function getAllSessions(): ResearchSession[] {
  return [...store.sessions];
}

// Initialize on import
loadSharedMemory();
