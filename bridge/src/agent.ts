/**
 * AI Agent module for Cascade Remote Bridge
 * 
 * Handles automatic responses to mobile messages using Anthropic Claude.
 * Maintains conversation history and persistent memory via tool use.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  createMemory,
  updateMemory,
  deleteMemory,
  searchMemories,
  listMemories,
  getMemorySummary,
} from "./memory.js";
import { FILESYSTEM_TOOLS, handleFilesystemTool } from "./tools-filesystem.js";
import { COMMAND_TOOLS, handleCommandTool } from "./tools-commands.js";
import { PROCESS_TOOLS, handleProcessTool } from "./tools-process.js";
import { DESKTOP_TOOLS, handleDesktopTool } from "./tools-desktop.js";
import { WEB_TOOLS, handleWebTool } from "./tools-web.js";
import { getAuditLog, getSecurityConfig } from "./security.js";
import {
  ragIndexText, ragIndexFile, ragIndexDirectory,
  ragSearch, ragGetContext, ragListSources,
  ragDeleteSource, ragStats,
} from "./rag.js";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlock[];
}

const MEMORY_TOOLS: Anthropic.Tool[] = [
  {
    name: "save_memory",
    description:
      "Save important information to persistent memory. Use this proactively whenever the user shares preferences, project details, decisions, names, or anything worth remembering across sessions.",
    input_schema: {
      type: "object" as const,
      properties: {
        content: {
          type: "string",
          description: "The information to remember",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description:
            "Tags for categorization (e.g. 'preference', 'project', 'person', 'decision')",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "search_memory",
    description:
      "Search stored memories by keyword or tag. Use this when the user asks about something you might have saved before, or to recall context.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search term (matches content and tags)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_memories",
    description: "List all stored memories. Use when the user asks what you remember.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "update_memory",
    description: "Update an existing memory by its ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Memory ID to update" },
        content: { type: "string", description: "New content" },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "New tags (optional)",
        },
      },
      required: ["id", "content"],
    },
  },
  {
    name: "delete_memory",
    description: "Delete a memory by its ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Memory ID to delete" },
      },
      required: ["id"],
    },
  },
];

const SECURITY_TOOLS: Anthropic.Tool[] = [
  {
    name: "view_audit_log",
    description: "View the security audit log showing all tool invocations (allowed and denied).",
    input_schema: {
      type: "object" as const,
      properties: {
        lines: { type: "number", description: "Number of recent log lines (default: 30)" },
      },
    },
  },
  {
    name: "view_security_config",
    description: "View current security configuration: allowed paths, commands, and blocked patterns.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
];

const RAG_TOOLS: Anthropic.Tool[] = [
  {
    name: "rag_index_text",
    description: "Index text into the knowledge base for RAG retrieval. Use this to add documentation, notes, or any text the user wants to remember and search later.",
    input_schema: {
      type: "object" as const,
      properties: {
        text: { type: "string", description: "Text content to index" },
        name: { type: "string", description: "Name/title for this content" },
      },
      required: ["text", "name"],
    },
  },
  {
    name: "rag_index_file",
    description: "Index a file into the knowledge base. Supports text files (.txt, .md, .ts, .py, .json, etc).",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: { type: "string", description: "Path to the file to index" },
      },
      required: ["file_path"],
    },
  },
  {
    name: "rag_index_directory",
    description: "Index all supported files in a directory recursively. Great for indexing an entire project.",
    input_schema: {
      type: "object" as const,
      properties: {
        dir_path: { type: "string", description: "Directory path to index" },
        extensions: { type: "array", items: { type: "string" }, description: "File extensions to include (default: .md, .txt, .ts, .tsx, .js, .py)" },
      },
      required: ["dir_path"],
    },
  },
  {
    name: "rag_search",
    description: "Search the knowledge base for relevant information. Returns the most relevant text chunks matching the query.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        top_k: { type: "number", description: "Number of results (default: 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "rag_list_sources",
    description: "List all indexed sources in the knowledge base.",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "rag_delete_source",
    description: "Remove a source from the knowledge base by its ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        source_id: { type: "string", description: "Source ID to delete" },
      },
      required: ["source_id"],
    },
  },
  {
    name: "rag_stats",
    description: "Get statistics about the knowledge base (source count, chunk count, total characters).",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
];

const ALL_TOOLS: Anthropic.Tool[] = [
  ...MEMORY_TOOLS,
  ...SECURITY_TOOLS,
  ...FILESYSTEM_TOOLS,
  ...COMMAND_TOOLS,
  ...PROCESS_TOOLS,
  ...DESKTOP_TOOLS,
  ...WEB_TOOLS,
  ...RAG_TOOLS,
];

async function handleToolCall(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "save_memory": {
      const mem = createMemory(
        input.content as string,
        (input.tags as string[]) || []
      );
      return `Memory saved: [${mem.id}] "${mem.content.slice(0, 80)}"`;
    }
    case "search_memory": {
      const results = searchMemories(input.query as string);
      if (results.length === 0) return "No memories found matching that query.";
      return results
        .map((m) => `[${m.id}] (${m.tags.join(", ")}) ${m.content}`)
        .join("\n");
    }
    case "list_memories": {
      const all = listMemories();
      if (all.length === 0) return "No memories stored yet.";
      return all
        .map((m) => `[${m.id}] (${m.tags.join(", ")}) ${m.content}`)
        .join("\n");
    }
    case "update_memory": {
      const updated = updateMemory(
        input.id as string,
        input.content as string,
        input.tags as string[] | undefined
      );
      return updated
        ? `Memory updated: [${updated.id}]`
        : `Memory not found: ${input.id}`;
    }
    case "delete_memory": {
      const ok = deleteMemory(input.id as string);
      return ok ? `Memory deleted: ${input.id}` : `Memory not found: ${input.id}`;
    }
    case "view_audit_log": {
      const lines = (input.lines as number) || 30;
      return getAuditLog(lines);
    }
    case "view_security_config": {
      return JSON.stringify(getSecurityConfig(), null, 2);
    }
    case "rag_index_text": {
      const src = ragIndexText(input.text as string, input.name as string);
      return `Indexed "${src.name}": ${src.chunkCount} chunks, ${src.totalLength} chars [${src.id}]`;
    }
    case "rag_index_file": {
      try {
        const src = ragIndexFile(input.file_path as string);
        return `Indexed file "${src.name}": ${src.chunkCount} chunks, ${src.totalLength} chars [${src.id}]`;
      } catch (err) {
        return `Failed: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    case "rag_index_directory": {
      try {
        const sources = ragIndexDirectory(input.dir_path as string, input.extensions as string[] | undefined);
        return `Indexed ${sources.length} files:\n${sources.map((s) => `  - ${s.name} (${s.chunkCount} chunks)`).join("\n")}`;
      } catch (err) {
        return `Failed: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
    case "rag_search": {
      const results = ragSearch(input.query as string, (input.top_k as number) || 5);
      if (results.length === 0) return "No relevant results found in knowledge base.";
      return results.map((r, i) => `${i + 1}. [${r.source}] (score: ${r.score})\n${r.content}`).join("\n\n");
    }
    case "rag_list_sources": {
      const sources = ragListSources();
      if (sources.length === 0) return "Knowledge base is empty. Use rag_index_text or rag_index_file to add content.";
      return sources.map((s) => `[${s.id}] ${s.name} (${s.type}) - ${s.chunkCount} chunks, ${s.totalLength} chars - indexed ${s.indexedAt}`).join("\n");
    }
    case "rag_delete_source": {
      const ok = ragDeleteSource(input.source_id as string);
      return ok ? `Deleted source: ${input.source_id}` : `Source not found: ${input.source_id}`;
    }
    case "rag_stats": {
      const stats = ragStats();
      return `Knowledge base: ${stats.sourceCount} sources, ${stats.chunkCount} chunks, ${stats.totalChars} total characters`;
    }
    default: {
      // Delegate to other tool handlers
      const fsResult = handleFilesystemTool(name, input);
      if (!fsResult.startsWith("Unknown filesystem tool:")) return fsResult;
      const cmdResult = handleCommandTool(name, input);
      if (!cmdResult.startsWith("Unknown command tool:")) return cmdResult;
      const procResult = handleProcessTool(name, input);
      if (!procResult.startsWith("Unknown process tool:")) return procResult;
      const deskResult = await handleDesktopTool(name, input);
      if (!deskResult.startsWith("Unknown desktop tool:")) return deskResult;
      const webResult = await handleWebTool(name, input);
      if (!webResult.startsWith("Unknown web tool:")) return webResult;
      return `Unknown tool: ${name}`;
    }
  }
}

export type AgentStatus =
  | { type: "thinking" }
  | { type: "tool_start"; tool: string; input?: string }
  | { type: "tool_done"; tool: string }
  | { type: "done" };

export type StatusCallback = (status: AgentStatus) => void;

const TOOL_CATEGORIES: Record<string, string> = {
  save_memory: "memory",
  search_memory: "memory",
  list_memories: "memory",
  update_memory: "memory",
  delete_memory: "memory",
  read_file: "filesystem",
  write_file: "filesystem",
  list_directory: "filesystem",
  search_files: "search",
  file_info: "filesystem",
  run_command: "command",
  list_processes: "process",
  kill_process: "process",
  system_info: "system",
  network_info: "system",
  take_screenshot: "desktop",
  mouse_click: "desktop",
  mouse_move: "desktop",
  mouse_scroll: "desktop",
  type_text: "desktop",
  press_key: "desktop",
  get_active_window: "desktop",
  list_windows: "desktop",
  focus_window: "desktop",
  desktop_action: "desktop",
  view_audit_log: "security",
  view_security_config: "security",
  web_search: "web",
  fetch_url: "web",
  http_request: "web",
  run_javascript: "command",
  download_file: "web",
  rag_index_text: "knowledge",
  rag_index_file: "knowledge",
  rag_index_directory: "knowledge",
  rag_search: "knowledge",
  rag_list_sources: "knowledge",
  rag_delete_source: "knowledge",
  rag_stats: "knowledge",
};

export function getToolCategory(toolName: string): string {
  return TOOL_CATEGORIES[toolName] || "unknown";
}

const MAX_HISTORY = 40;
const MAX_TOOL_ROUNDS = 8;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
}

export class Agent {
  private client: Anthropic | null = null;
  private history: Anthropic.MessageParam[] = [];
  private model: string;
  private enabled: boolean;
  private statusCallback: StatusCallback | null = null;
  private tokenUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, cacheReadTokens: 0, cacheCreateTokens: 0 };

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = process.env.LLM_MODEL || "claude-sonnet-4-20250514";
    this.enabled = !!apiKey;

    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      console.log(`[agent] Initialized with model: ${this.model}`);
    } else {
      console.log("[agent] No ANTHROPIC_API_KEY set - auto-responses disabled");
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  onStatus(cb: StatusCallback): void {
    this.statusCallback = cb;
  }

  private emitStatus(status: AgentStatus): void {
    if (this.statusCallback) this.statusCallback(status);
  }

  private getSystemPrompt(): string {
    const memorySummary = getMemorySummary();
    return `You are Cascade Remote, an AI assistant accessible from a mobile phone.
You help the user with coding questions, project status, and general tasks.
Keep responses concise and mobile-friendly (short paragraphs, no huge code blocks unless asked).
Respond in the same language the user writes in.

You have persistent memory. PROACTIVELY save important information the user shares (preferences, names, project details, decisions, etc.) without being asked. This helps you remember across sessions.

You also have powerful system tools:
- **Web & Internet**: web_search (search the internet), fetch_url (read any webpage), http_request (call APIs), download_file (download files)
- **Code Execution**: run_javascript (execute JS/Node.js code), run_command (run shell commands)
- **Filesystem**: read_file, write_file, list_directory, search_files, file_info
- **Processes**: list_processes, kill_process, system_info, network_info
- **Desktop Control**: take_screenshot (with AI vision), desktop_action (click, type, press keys)
- **Memory**: save_memory, search_memory, list_memories, update_memory, delete_memory
- **Knowledge Base (RAG)**: rag_index_text, rag_index_file, rag_index_directory, rag_search, rag_list_sources, rag_delete_source, rag_stats
- **Security**: view_audit_log, view_security_config

You have a knowledge base (RAG). When the user asks about indexed content, use rag_search first. You can index files, directories, or text into the knowledge base for later retrieval.

You can do ANYTHING the user asks. If they want information from the internet, use web_search. If they want to read a webpage, use fetch_url. If they need calculations or data processing, use run_javascript. You are a fully capable AI assistant with no limitations.

For desktop control:
1. Take a screenshot first to see what's on screen.
2. The screenshot analysis gives element positions as PERCENTAGE coordinates (0-100).
3. Use desktop_action to perform a sequence of actions in ONE step (avoids focus-stealing).
   Format: "focus:WindowTitle|sleep:500|click:x%,y%|type:text|key:enter"
4. ALWAYS include focus:WindowTitle as the first action, followed by sleep:500.
5. HINT: In the Cascade Remote web chat, the input field is at approximately (50%, 93%) and the send button at (98%, 93%). The Windows taskbar is at ~97-100%.
6. If a click misses, try y values between 91-94% for bottom input fields.

IMPORTANT: When the user asks you to "use the computer", "click", "type", "open", "write something on screen", "send a message", or anything involving physically interacting with the desktop – use the Desktop Control tools. Do NOT just save to memory or respond with text. Actually control the mouse and keyboard.

All operations are security-checked and audit-logged. If a command is blocked, explain why and suggest alternatives.

Current memory state:
${memorySummary}`;
  }

  async respond(userMessage: string): Promise<string> {
    if (!this.client) {
      return "AI agent not configured. Set ANTHROPIC_API_KEY in bridge/.env";
    }

    this.history.push({ role: "user", content: userMessage });

    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY);
    }

    // Auto-RAG: search knowledge base for relevant context
    let ragContext = "";
    try {
      ragContext = ragGetContext(userMessage, 3000);
    } catch { /* RAG not critical */ }

    try {
      let finalText = "";

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        this.emitStatus({ type: "thinking" });

        const systemPrompt = ragContext
          ? `${this.getSystemPrompt()}\n\n--- RELEVANT KNOWLEDGE BASE CONTEXT ---\n${ragContext}\n--- END CONTEXT ---\nUse the above context if relevant to the user's question.`
          : this.getSystemPrompt();

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 1024,
          system: systemPrompt,
          tools: ALL_TOOLS,
          messages: this.history,
        });

        // Track token usage
        if (response.usage) {
          this.tokenUsage.inputTokens += response.usage.input_tokens;
          this.tokenUsage.outputTokens += response.usage.output_tokens;
          this.tokenUsage.totalTokens += response.usage.input_tokens + response.usage.output_tokens;
          this.tokenUsage.requestCount++;
          const cache = response.usage as unknown as Record<string, number>;
          if (cache.cache_read_input_tokens) this.tokenUsage.cacheReadTokens += cache.cache_read_input_tokens;
          if (cache.cache_creation_input_tokens) this.tokenUsage.cacheCreateTokens += cache.cache_creation_input_tokens;
          this.emitStatus({ type: "token_update" as any });
        }

        // Collect text blocks
        const textParts = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text);
        if (textParts.length > 0) {
          finalText = textParts.join("\n");
        }

        // Check for tool use
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        );

        if (toolUseBlocks.length === 0) {
          // No tools called, we're done – store assistant response
          this.history.push({ role: "assistant", content: response.content });
          break;
        }

        // Process tool calls – store the full response (may contain text + tool_use)
        this.history.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of toolUseBlocks) {
          const inputSummary = JSON.stringify(block.input).slice(0, 80);
          this.emitStatus({ type: "tool_start", tool: block.name, input: inputSummary });

          const result = await handleToolCall(
            block.name,
            block.input as Record<string, unknown>
          );
          console.log(`[agent] Tool ${block.name}: ${result.slice(0, 100)}`);

          this.emitStatus({ type: "tool_done", tool: block.name });

          toolResults.push({
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: result,
          });
        }

        this.history.push({ role: "user", content: toolResults });
        // Continue loop to let Claude generate a text response after tool results
      }

      // Sanitize history: ensure no assistant messages have empty content
      this.history = this.history.filter((msg) => {
        if (msg.role === "assistant") {
          if (typeof msg.content === "string") return msg.content.length > 0;
          if (Array.isArray(msg.content)) return msg.content.length > 0;
        }
        return true;
      });

      this.emitStatus({ type: "done" });
      return finalText || "I processed your request.";
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[agent] LLM error:", errMsg);
      // Clear corrupted history on error to prevent cascading failures
      this.history = this.history.slice(0, -4).filter((msg) => {
        if (msg.role === "assistant" && Array.isArray(msg.content)) {
          return msg.content.length > 0;
        }
        return true;
      });
      return `Error: ${errMsg}`;
    }
  }

  clearHistory(): void {
    this.history = [];
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  resetTokenUsage(): void {
    this.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, cacheReadTokens: 0, cacheCreateTokens: 0 };
  }
}
