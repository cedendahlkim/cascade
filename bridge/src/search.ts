/**
 * Conversation Search — Search across all conversation history
 * 
 * Provides full-text search across Claude, Gemini, and Arena conversations.
 * Supports filtering by date, agent, and message type.
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");

interface SearchableMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  source: "claude" | "gemini" | "arena";
  type?: string;
  phase?: string;
}

interface SearchResult {
  message: SearchableMessage;
  score: number;
  highlights: string[];
}

interface SearchOptions {
  query: string;
  source?: "claude" | "gemini" | "arena" | "all";
  role?: "user" | "cascade" | "system" | "all";
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

function loadAllMessages(): SearchableMessage[] {
  const all: SearchableMessage[] = [];

  // Claude conversation
  try {
    const file = join(DATA_DIR, "conversation.json");
    if (existsSync(file)) {
      const msgs = JSON.parse(readFileSync(file, "utf-8"));
      for (const m of msgs) {
        all.push({ ...m, source: "claude" });
      }
    }
  } catch { /* skip */ }

  // Gemini conversation
  try {
    const file = join(DATA_DIR, "gemini-conversation.json");
    if (existsSync(file)) {
      const msgs = JSON.parse(readFileSync(file, "utf-8"));
      for (const m of msgs) {
        all.push({ ...m, source: "gemini" });
      }
    }
  } catch { /* skip */ }

  // Arena conversation
  try {
    const file = join(DATA_DIR, "arena.json");
    if (existsSync(file)) {
      const msgs = JSON.parse(readFileSync(file, "utf-8"));
      for (const m of msgs) {
        all.push({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          source: "arena",
          phase: m.phase,
        });
      }
    }
  } catch { /* skip */ }

  return all;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(t => t.length > 1);
}

function scoreMatch(content: string, queryTokens: string[]): number {
  const contentLower = content.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (contentLower.includes(token)) {
      score += 1;
      // Bonus for exact word match
      const regex = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(content)) score += 0.5;
    }
  }

  // Normalize by query length
  return queryTokens.length > 0 ? score / queryTokens.length : 0;
}

function extractHighlights(content: string, queryTokens: string[], maxLen = 150): string[] {
  const highlights: string[] = [];
  const contentLower = content.toLowerCase();

  for (const token of queryTokens) {
    const idx = contentLower.indexOf(token);
    if (idx >= 0) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(content.length, idx + token.length + 40);
      let snippet = content.slice(start, end).trim();
      if (start > 0) snippet = "..." + snippet;
      if (end < content.length) snippet = snippet + "...";
      highlights.push(snippet);
    }
  }

  if (highlights.length === 0 && content.length > 0) {
    highlights.push(content.slice(0, maxLen) + (content.length > maxLen ? "..." : ""));
  }

  return highlights.slice(0, 3);
}

export function searchConversations(options: SearchOptions): SearchResult[] {
  const allMessages = loadAllMessages();
  const queryTokens = tokenize(options.query);
  const limit = options.limit || 20;

  let filtered = allMessages;

  // Filter by source
  if (options.source && options.source !== "all") {
    filtered = filtered.filter(m => m.source === options.source);
  }

  // Filter by role
  if (options.role && options.role !== "all") {
    filtered = filtered.filter(m => m.role === options.role);
  }

  // Filter by date
  if (options.dateFrom) {
    const from = new Date(options.dateFrom).getTime();
    filtered = filtered.filter(m => new Date(m.timestamp).getTime() >= from);
  }
  if (options.dateTo) {
    const to = new Date(options.dateTo).getTime();
    filtered = filtered.filter(m => new Date(m.timestamp).getTime() <= to);
  }

  // Score and rank
  const results: SearchResult[] = [];
  for (const msg of filtered) {
    const score = scoreMatch(msg.content, queryTokens);
    if (score > 0) {
      results.push({
        message: msg,
        score,
        highlights: extractHighlights(msg.content, queryTokens),
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function getConversationStats(): {
  claude: number;
  gemini: number;
  arena: number;
  total: number;
  dateRange: { from: string | null; to: string | null };
} {
  const all = loadAllMessages();
  const claude = all.filter(m => m.source === "claude").length;
  const gemini = all.filter(m => m.source === "gemini").length;
  const arena = all.filter(m => m.source === "arena").length;

  let from: string | null = null;
  let to: string | null = null;
  if (all.length > 0) {
    const sorted = all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    from = sorted[0].timestamp;
    to = sorted[sorted.length - 1].timestamp;
  }

  return { claude, gemini, arena, total: all.length, dateRange: { from, to } };
}

export function exportConversation(
  source: "claude" | "gemini" | "arena" | "all",
  format: "markdown" | "json" = "markdown",
): string {
  const all = loadAllMessages();
  const filtered = source === "all" ? all : all.filter(m => m.source === source);
  filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (format === "json") {
    return JSON.stringify(filtered, null, 2);
  }

  // Markdown format
  const lines: string[] = [
    `# Konversationsexport — ${source === "all" ? "Alla" : source}`,
    `Exporterad: ${new Date().toISOString()}`,
    `Antal meddelanden: ${filtered.length}`,
    "",
    "---",
    "",
  ];

  for (const msg of filtered) {
    const time = new Date(msg.timestamp).toLocaleString("sv-SE");
    const role = msg.role === "user" ? "👤 Kim" :
                 msg.role === "cascade" ? "🤖 AI" :
                 msg.source === "arena" && msg.role === "claude" ? "🔵 Claude" :
                 msg.source === "arena" && msg.role === "gemini" ? "🟢 Gemini" :
                 `📋 ${msg.role}`;
    lines.push(`### ${role} — ${time}`);
    if (msg.source !== source && source === "all") lines.push(`*Källa: ${msg.source}*`);
    lines.push("");
    lines.push(msg.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}
