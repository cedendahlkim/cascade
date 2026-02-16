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
import { COMPUTER_TOOLS, handleComputerTool } from "./tools-computers.js";
import { WEB_TOOLS, handleWebTool } from "./tools-web.js";
import { getAuditLog, getSecurityConfig } from "./security.js";
import {
  ragIndexText, ragIndexFile, ragIndexDirectory,
  ragSearch, ragGetContext, ragListSources,
  ragDeleteSource, ragStats,
} from "./rag.js";
import { getSystemContext } from "./system-context.js";
import { getPluginToolDefinitions, handlePluginTool } from "./plugin-loader.js";
import { isWeaviateConnected, weaviateGetContext, weaviateIndexText, weaviateSearch, weaviateListSources, weaviateDeleteSource, weaviateStats } from "./rag-weaviate.js";
import {
  getSelfImproveContext, buildReflectionPrompt, buildSkillExtractionPrompt,
  addEvaluation, addReflection, addSkill, findMatchingSkills, findSkillsForQuery, recordSkillUse,
  buildAdversarialPrompt, addAdversarialResult, type AdversarialResult,
  recordToolSequence,
  calculateCuriosityReward, getCuriosityContext,
  buildMetakognitionContext, runNetworkMetakognition,
} from "./self-improve.js";

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

function getAllTools(): Anthropic.Tool[] {
  const pluginDefs = getPluginToolDefinitions().map((d) => ({
    name: d.name,
    description: d.description,
    input_schema: d.input_schema as Anthropic.Tool.InputSchema,
  }));
  return [
    ...MEMORY_TOOLS,
    ...SECURITY_TOOLS,
    ...FILESYSTEM_TOOLS,
    ...COMMAND_TOOLS,
    ...PROCESS_TOOLS,
    ...DESKTOP_TOOLS,
    ...WEB_TOOLS,
    ...RAG_TOOLS,
    ...COMPUTER_TOOLS,
    ...pluginDefs,
  ];
}

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
      const compResult = await handleComputerTool(name, input);
      if (!compResult.startsWith("Unknown computer tool:")) return compResult;

      // Plugin tools
      const pluginResult = await handlePluginTool(name, input);
      if (pluginResult !== null) return pluginResult;

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
  list_computers: "computer",
  run_on_computer: "computer",
  read_remote_file: "computer",
  write_remote_file: "computer",
  screenshot_computer: "computer",
  computer_system_info: "computer",
};

export function getToolCategory(toolName: string): string {
  return TOOL_CATEGORIES[toolName] || "unknown";
}

const MAX_HISTORY = 40;
const MAX_TOOL_ROUNDS = 8;
const MAX_TOOL_RESULT_CHARS = 8000;
const SELF_IMPROVE_ENABLED = process.env.SELF_IMPROVE !== "0";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
  cacheReadTokens: number;
  cacheCreateTokens: number;
}

export type StreamCallback = (chunk: string) => void;
export type SelfImproveCallback = (event: { type: string; data: Record<string, unknown> }) => void;

export class Agent {
  private client: Anthropic | null = null;
  private history: Anthropic.MessageParam[] = [];
  private model: string;
  private enabled: boolean;
  private statusCallback: StatusCallback | null = null;
  private streamCallback: StreamCallback | null = null;
  private selfImproveCallback: SelfImproveCallback | null = null;
  private tokenUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, cacheReadTokens: 0, cacheCreateTokens: 0 };
  private tokenBudget: number = 0;
  private tokenBudgetWarned: boolean = false;
  private responseCount: number = 0;

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

  onStream(cb: StreamCallback): void {
    this.streamCallback = cb;
  }

  onSelfImprove(cb: SelfImproveCallback): void {
    this.selfImproveCallback = cb;
  }

  private emitSelfImprove(type: string, data: Record<string, unknown>): void {
    if (this.selfImproveCallback) this.selfImproveCallback({ type, data });
  }

  private emitStream(chunk: string): void {
    if (this.streamCallback) this.streamCallback(chunk);
  }

  setTokenBudget(budget: number): void {
    this.tokenBudget = budget;
    this.tokenBudgetWarned = false;
  }

  getTokenBudget(): number {
    return this.tokenBudget;
  }

  isOverBudget(): boolean {
    return this.tokenBudget > 0 && this.tokenUsage.totalTokens >= this.tokenBudget;
  }

  private emitStatus(status: AgentStatus): void {
    if (this.statusCallback) this.statusCallback(status);
  }

  private getSystemPrompt(): string {
    const memorySummary = getMemorySummary();
    const selfImproveCtx = SELF_IMPROVE_ENABLED ? getSelfImproveContext() : "";
    return `${getSystemContext()}

## DETALJERADE VERKTYGS-INSTRUKTIONER

Du har persistent minne. Spara PROAKTIVT viktig information som Kim delar (preferenser, namn, projektdetaljer, beslut) utan att bli tillfrågad.

Du har en kunskapsbas (RAG). När Kim frågar om indexerat innehåll, använd rag_search först. Du kan indexera filer, kataloger eller text.

Du kan göra ALLT Kim ber om. Vill han ha info från internet – använd web_search. Vill han läsa en webbsida – använd fetch_url. Behöver han beräkningar – använd run_javascript. Du är en fullt kapabel AI-assistent utan begränsningar.

### Desktop Control
1. Ta en screenshot först för att se vad som visas.
2. Screenshot-analysen ger elementpositioner som PROCENT-koordinater (0-100).
3. Använd desktop_action för att utföra en sekvens av åtgärder i ETT steg.
   Format: "focus:WindowTitle|sleep:500|click:x%,y%|type:text|key:enter"
4. Inkludera ALLTID focus:WindowTitle som första åtgärd, följt av sleep:500.
5. TIPS: I Cascade Remote web-chatten är inputfältet vid ca (50%, 93%) och skicka-knappen vid (98%, 93%).
6. Om ett klick missar, prova y-värden mellan 91-94%.

VIKTIGT: När Kim ber dig "använda datorn", "klicka", "skriva", "öppna" – använd Desktop Control-verktygen. Kontrollera faktiskt musen och tangentbordet.

Alla operationer är säkerhetskontrollerade och audit-loggade.

### Remote Computer Control
Du har FULL tillgång till ALLA registrerade datorer. Använd dessa verktyg:
- list_computers — se alla datorer och deras status
- run_on_computer — kör kommandon på valfri dator (eller "auto" för bästa val)
- read_remote_file / write_remote_file — läs/skriv filer på fjärrdatorer
- screenshot_computer — ta screenshot på en fjärrdator
- computer_system_info — hämta systeminformation

Du kan använda datornamn ELLER ID. Exempel: run_on_computer("Kims Huvuddator", "dir C:\\Users")
Alla datorer har fulla behörigheter — inga begränsningar.

Current memory state:
${memorySummary}

${selfImproveCtx}`;
  }

  async respond(userMessage: string): Promise<string> {
    if (!this.client) {
      return "AI agent not configured. Set ANTHROPIC_API_KEY in bridge/.env";
    }

    this.history.push({ role: "user", content: userMessage });

    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY);
    }

    // Auto-RAG: search knowledge base for relevant context (Weaviate → BM25 fallback)
    let ragContext = "";
    try {
      if (isWeaviateConnected()) {
        ragContext = await weaviateGetContext(userMessage, 3000);
      }
      if (!ragContext) {
        ragContext = ragGetContext(userMessage, 3000);
      }
    } catch { /* RAG not critical */ }

    try {
      let finalText = "";
      const toolsUsedInSession: Array<{ tool: string; input: string }> = [];

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        this.emitStatus({ type: "thinking" });

        const systemPrompt = ragContext
          ? `${this.getSystemPrompt()}\n\n--- RELEVANT KNOWLEDGE BASE CONTEXT ---\n${ragContext}\n--- END CONTEXT ---\nUse the above context if relevant to the user's question.`
          : this.getSystemPrompt();

        let response;
        try {
          response = await this.client.messages.create({
            model: this.model,
            max_tokens: 4096,
            system: systemPrompt,
            tools: getAllTools(),
            messages: this.history,
          });
        } catch (apiErr: unknown) {
          const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
          if (errMsg.includes("400") || errMsg.includes("invalid_request")) {
            console.error(`[agent] API error, trimming history: ${errMsg.slice(0, 120)}`);
            this.history = this.history.slice(-6);
            try {
              response = await this.client.messages.create({
                model: this.model,
                max_tokens: 4096,
                system: this.getSystemPrompt(),
                tools: getAllTools(),
                messages: this.history,
              });
            } catch (retryErr) {
              console.error(`[agent] Retry also failed:`, retryErr);
              return `Fel: Konversationen blev för lång. Historiken har rensats, försök igen.`;
            }
          } else {
            throw apiErr;
          }
        }

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

        // Collect text blocks and stream them
        const textParts = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text);
        if (textParts.length > 0) {
          finalText = textParts.join("\n");
          this.emitStream(finalText);
        }

        // Token budget check
        if (this.tokenBudget > 0 && !this.tokenBudgetWarned && this.tokenUsage.totalTokens >= this.tokenBudget * 0.8) {
          this.tokenBudgetWarned = true;
          this.emitStatus({ type: "budget_warning" as any });
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
          toolsUsedInSession.push({ tool: block.name, input: JSON.stringify(block.input).slice(0, 200) });

          this.emitStatus({ type: "tool_done", tool: block.name });

          const truncatedResult = result.length > MAX_TOOL_RESULT_CHARS
            ? result.slice(0, MAX_TOOL_RESULT_CHARS) + `\n\n[Truncated: ${result.length} chars total, showing first ${MAX_TOOL_RESULT_CHARS}]`
            : result;

          toolResults.push({
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: truncatedResult,
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

      // --- Self-Improvement: evaluate, reflect, extract skills ---
      if (SELF_IMPROVE_ENABLED && finalText && this.client) {
        this.runSelfImprovement(userMessage, finalText, toolsUsedInSession).catch(
          (e: unknown) => console.error("[self-improve] Error:", e)
        );
      }

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

  /**
   * Respond without tools — isolated from main history.
   * Use this for Arena/Swarm where tool_use blocks would corrupt shared history.
   */
  async respondPlain(userMessage: string): Promise<string> {
    if (!this.client) {
      return "AI agent not configured. Set ANTHROPIC_API_KEY in bridge/.env";
    }

    try {
      this.emitStatus({ type: "thinking" });

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: this.getSystemPrompt(),
        messages: [{ role: "user", content: userMessage }],
      });

      if (response.usage) {
        this.tokenUsage.inputTokens += response.usage.input_tokens;
        this.tokenUsage.outputTokens += response.usage.output_tokens;
        this.tokenUsage.totalTokens += response.usage.input_tokens + response.usage.output_tokens;
        this.tokenUsage.requestCount++;
      }

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      this.emitStatus({ type: "done" });
      return text || "I processed your request.";
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[agent] respondPlain error:", errMsg);
      throw error;
    }
  }

  clearHistory(): void {
    this.history = [];
  }

  getHistory(): Anthropic.MessageParam[] {
    return this.history;
  }

  setHistory(history: Anthropic.MessageParam[]): void {
    this.history = history;
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  resetTokenUsage(): void {
    this.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, cacheReadTokens: 0, cacheCreateTokens: 0 };
  }

  /**
   * Async self-improvement pipeline (runs in background after response):
   * 1. Self-evaluate the response quality
   * 2. If tools were used, extract as a reusable skill
   * 3. If quality is low, run a reflection loop
   */
  private async runSelfImprovement(
    userMessage: string,
    agentResponse: string,
    toolsUsed: Array<{ tool: string; input: string }>,
  ): Promise<void> {
    if (!this.client) return;

    try {
      // 1. Self-evaluate
      const evalPrompt = buildReflectionPrompt(userMessage, agentResponse);
      const evalResponse = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: "You are a quality evaluator. Respond ONLY with valid JSON, no markdown.",
        messages: [{ role: "user", content: evalPrompt }],
      });

      const evalText = evalResponse.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map(b => b.text).join("");

      let evalData: {
        score: number; strengths: string[]; weaknesses: string[];
        improvement: string; shouldRetry?: boolean; improvedResponse?: string;
      };

      try {
        evalData = JSON.parse(evalText.replace(/```json?\n?|```/g, "").trim());
      } catch {
        console.log("[self-improve] Could not parse evaluation, skipping");
        return;
      }

      // Store evaluation
      const evaluation = addEvaluation(
        userMessage, agentResponse,
        evalData.score, evalData.strengths || [], evalData.weaknesses || [],
        evalData.improvement || "",
      );
      console.log(`[self-improve] Eval: ${evalData.score}/5 — ${evalData.improvement?.slice(0, 80)}`);
      this.emitSelfImprove("evaluation", { id: evaluation.id, score: evalData.score, strengths: evalData.strengths, weaknesses: evalData.weaknesses });

      // 2. Extract skill if tools were used successfully and quality is good
      if (toolsUsed.length > 0 && evalData.score >= 3) {
        try {
          const skillPrompt = buildSkillExtractionPrompt(userMessage, toolsUsed);
          const skillResponse = await this.client.messages.create({
            model: this.model,
            max_tokens: 512,
            system: "You extract reusable skills. Respond ONLY with valid JSON, no markdown.",
            messages: [{ role: "user", content: skillPrompt }],
          });

          const skillText = skillResponse.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map(b => b.text).join("");

          const skillData = JSON.parse(skillText.replace(/```json?\n?|```/g, "").trim());
          const toolChain = toolsUsed.map(t => ({ tool: t.tool, inputSummary: t.input.slice(0, 100) }));
          addSkill(
            skillData.name || "Unnamed skill",
            skillData.description || "",
            toolChain,
            skillData.triggerPattern || userMessage.slice(0, 100),
            skillData.tags || [],
          );
          console.log(`[self-improve] Skill extracted: ${skillData.name}`);
          this.emitSelfImprove("skill", { name: skillData.name, description: skillData.description });
        } catch {
          // Skill extraction is optional
        }
      }

      // 3. Reflection: if score is very low and agent thinks it can do better
      if (evalData.shouldRetry && evalData.improvedResponse) {
        addReflection(
          agentResponse,
          evalData.improvement || "Low quality response",
          evalData.improvedResponse,
          Math.max(0, (evalData.score >= 3 ? 0 : 3 - evalData.score)),
          true,
        );
        console.log(`[self-improve] Reflection stored (delta: +${3 - evalData.score})`);
        this.emitSelfImprove("reflection", { critique: evalData.improvement, delta: 3 - evalData.score });
      }

      // 4. Adversarial Self-Questioning (from Arena research)
      // Run on responses that used tools or made claims (score >= 3 to avoid wasting on bad responses)
      if (toolsUsed.length > 0 && evalData.score >= 3) {
        try {
          const advPrompt = buildAdversarialPrompt(agentResponse.slice(0, 500), userMessage);
          const advResponse = await this.client.messages.create({
            model: this.model,
            max_tokens: 1024,
            system: "You are an adversarial reviewer. Respond ONLY with valid JSON, no markdown.",
            messages: [{ role: "user", content: advPrompt }],
          });

          const advText = advResponse.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map(b => b.text).join("");

          const advData = JSON.parse(advText.replace(/```json?\n?|```/g, "").trim());
          const result: AdversarialResult = {
            challenges: advData.challenges || [],
            verdict: advData.verdict || "stand",
            modification: advData.modification,
            confidence: advData.confidence || 0.5,
            timestamp: new Date().toISOString(),
          };
          addAdversarialResult(result);
          console.log(`[self-improve] Adversarial: ${result.verdict} (confidence: ${result.confidence})`);
          this.emitSelfImprove("adversarial", { verdict: result.verdict, confidence: result.confidence, challenges: result.challenges.length });
        } catch {
          // Adversarial review is optional
        }
      }

      // 5. Tool Chain Sequencing (from Arena research)
      // Track which tool combinations work for which task types
      if (toolsUsed.length > 0) {
        const tools = toolsUsed.map(t => t.tool);
        const taskType = tools.includes("web_search") || tools.includes("fetch_url") ? "web"
          : tools.includes("run_on_computer") || tools.includes("run_command") ? "command"
          : tools.includes("read_file") || tools.includes("write_file") ? "filesystem"
          : tools.includes("take_screenshot") || tools.includes("screenshot_computer") ? "desktop"
          : "general";
        recordToolSequence(taskType, tools, evalData.score >= 3, evalData.score, 0);
        console.log(`[self-improve] Tool sequence: ${tools.join(" → ")} (${taskType}, score: ${evalData.score})`);
      }

      // 6. Curiosity Rewards (from Arena research session 3)
      // Reward novel tool patterns, penalize repetitive responses
      const toolNames = toolsUsed.map(t => t.tool);
      const curiosity = calculateCuriosityReward("Claude", toolNames, agentResponse, evalData.score);
      if (curiosity.novelDiscoveries > 0 || curiosity.repetitiveResponses > 0) {
        this.emitSelfImprove("curiosity", {
          noveltyScore: curiosity.noveltyScore,
          repetitionPenalty: curiosity.repetitionPenalty,
          totalReward: curiosity.totalReward,
        });
      }

      // 7. Network Metakognition (Layer 3) — run periodically (every 10th response)
      this.responseCount = (this.responseCount || 0) + 1;
      if (this.responseCount % 10 === 0) {
        const insights = runNetworkMetakognition();
        if (insights.length > 0) {
          this.emitSelfImprove("metakognition", { insights: insights.map(i => ({ type: i.type, description: i.description })) });
        }
      }

    } catch (err) {
      console.error("[self-improve] Pipeline error:", err);
    }
  }
}
