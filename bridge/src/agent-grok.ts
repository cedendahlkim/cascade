/**
 * Grok AI Agent for Cascade Remote Bridge
 * 
 * Uses xAI's OpenAI-compatible API for Grok model access.
 * Full tool support — same capabilities as Claude/Gemini/DeepSeek.
 */
import { handleComputerTool } from "./tools-computers.js";
import { handleFilesystemTool } from "./tools-filesystem.js";
import { handleCommandTool } from "./tools-commands.js";
import { handleProcessTool } from "./tools-process.js";
import { handleWebTool } from "./tools-web.js";
import { handleWafTool } from "./tools-waf.js";
import { createMemory, searchMemories, listMemories } from "./memory.js";
import { ragSearch, ragListSources } from "./rag.js";
import { getPluginToolDefinitions, handlePluginTool } from "./plugin-loader.js";

export interface GrokTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
}

export type GrokStreamCallback = (chunk: string) => void;
export type GrokStatusCallback = (status: { type: string }) => void;

export interface GrokAgentConfig {
  name?: string;
  role?: string;
  model?: string;
  apiKey?: string;
}

interface OpenAIToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface OpenAIMessage {
  role: string;
  content: string | null;
  tool_calls?: OpenAIToolCall[];
  tool_call_id?: string;
}

export class GrokAgent {
  private apiKey: string | null;
  private model: string;
  private enabled: boolean;
  private history: OpenAIMessage[] = [];
  private streamCallback: GrokStreamCallback | null = null;
  private statusCallback: GrokStatusCallback | null = null;
  private tokenUsage: GrokTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 };
  public readonly agentName: string;
  public readonly agentRole: string;
  private baseUrl = "https://api.x.ai/v1";

  constructor(config?: GrokAgentConfig) {
    this.apiKey = config?.apiKey || process.env.XAI_API_KEY || null;
    this.model = config?.model || process.env.XAI_MODEL || "grok-4-0709";
    this.agentName = config?.name || "Grok";
    this.agentRole = config?.role || "utmanare";
    this.enabled = !!this.apiKey;

    if (this.apiKey) {
      console.log(`[${this.agentName.toLowerCase()}] Initialized with model: ${this.model} (role: ${this.agentRole})`);
    } else {
      console.log(`[${this.agentName.toLowerCase()}] No XAI_API_KEY set - agent disabled`);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  onStream(cb: GrokStreamCallback): void {
    this.streamCallback = cb;
  }

  onStatus(cb: GrokStatusCallback): void {
    this.statusCallback = cb;
  }

  getTokenUsage(): GrokTokenUsage {
    return { ...this.tokenUsage };
  }

  resetTokenUsage(): void {
    this.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 };
  }

  clearHistory(): void {
    this.history = [];
  }

  private getTools(): Array<{ type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } }> {
    const builtinTools = [
      { name: "save_memory", description: "Save information to persistent memory.", parameters: { type: "object", properties: { content: { type: "string", description: "Information to remember" } }, required: ["content"] } },
      { name: "search_memory", description: "Search stored memories by keyword.", parameters: { type: "object", properties: { query: { type: "string", description: "Search term" } }, required: ["query"] } },
      { name: "list_memories", description: "List all stored memories.", parameters: { type: "object", properties: {} } },
      { name: "read_file", description: "Read a local file.", parameters: { type: "object", properties: { path: { type: "string", description: "File path" } }, required: ["path"] } },
      { name: "write_file", description: "Write content to a local file.", parameters: { type: "object", properties: { path: { type: "string", description: "File path" }, content: { type: "string", description: "Content" } }, required: ["path", "content"] } },
      { name: "list_directory", description: "List files in a directory.", parameters: { type: "object", properties: { path: { type: "string", description: "Directory path" } }, required: ["path"] } },
      { name: "run_command", description: "Run a shell command on the bridge server.", parameters: { type: "object", properties: { command: { type: "string", description: "Command to run" }, cwd: { type: "string", description: "Working directory" }, runner: { type: "string", description: "Runner: host (default) or kali" } }, required: ["command"] } },
      { name: "web_search", description: "Search the web.", parameters: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"] } },
      { name: "fetch_url", description: "Fetch content from a URL.", parameters: { type: "object", properties: { url: { type: "string", description: "URL to fetch" } }, required: ["url"] } },
      { name: "waf_start", description: "Start WAF with a profile (pl1/pl2/pl3/pl4).", parameters: { type: "object", properties: { profile: { type: "string", description: "WAF profile" } } } },
      { name: "waf_stop", description: "Stop WAF immediately.", parameters: { type: "object", properties: {} } },
      { name: "waf_status", description: "Get WAF status for a target base URL.", parameters: { type: "object", properties: { base_url: { type: "string", description: "Target base URL" } } } },
      { name: "waf_run", description: "Run WAF test suite with raw parameters (no bridge-side clamping).", parameters: { type: "object", properties: { base_url: { type: "string", description: "Target base URL" }, tags: { type: "string", description: "Comma-separated tags" }, exclude_tags: { type: "string", description: "Comma-separated excluded tags" }, ids: { type: "string", description: "Comma-separated test IDs" }, concurrency: { type: "string", description: "Concurrency value forwarded as-is" } } } },
      { name: "waf_recent_runs", description: "List recent WAF runs.", parameters: { type: "object", properties: {} } },
      { name: "waf_run_results", description: "Get results for a specific WAF run ID.", parameters: { type: "object", properties: { run_id: { type: "string", description: "Run ID" } }, required: ["run_id"] } },
      { name: "waf_request", description: "Unrestricted raw request to WAF service path.", parameters: { type: "object", properties: { path: { type: "string", description: "Path on WAF service" }, method: { type: "string", description: "HTTP method" }, content_type: { type: "string", description: "Content-Type header" }, headers: { type: "string", description: "JSON object string of headers" }, body: { type: "string", description: "Raw body" } }, required: ["path"] } },
      { name: "list_computers", description: "List all registered computers.", parameters: { type: "object", properties: {} } },
      { name: "run_on_computer", description: "Run a command on a remote computer.", parameters: { type: "object", properties: { computer: { type: "string", description: "Computer name or 'auto'" }, command: { type: "string", description: "Shell command" } }, required: ["computer", "command"] } },
      { name: "rag_search", description: "Search the knowledge base.", parameters: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"] } },
    ];

    const pluginDefs = getPluginToolDefinitions().map((d) => ({
      name: d.name,
      description: `[Plugin] ${d.description}`,
      parameters: d.input_schema,
    }));

    return [...builtinTools, ...pluginDefs].map((t) => ({
      type: "function" as const,
      function: t,
    }));
  }

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
    try {
      // WAF tools
      if (name.startsWith("waf_")) return await handleWafTool(name, args);

      // Memory tools
      if (name === "save_memory") { const m = createMemory(args.content as string, []); return `Memory saved: [${m.id}] "${m.content.slice(0, 80)}"`; }
      if (name === "search_memory") { const r = searchMemories(args.query as string); return r.length ? r.map(m => `[${m.id}] ${m.content}`).join("\n") : "No memories found."; }
      if (name === "list_memories") { const a = listMemories(); return a.length ? a.map(m => `[${m.id}] (${m.tags.join(", ")}) ${m.content}`).join("\n") : "No memories stored."; }

      // Computer tools
      const computerTools = ["list_computers", "run_on_computer", "read_remote_file", "write_remote_file", "screenshot_computer", "computer_system_info"];
      if (computerTools.includes(name)) return await handleComputerTool(name, args);

      // Filesystem tools
      const fsResult = handleFilesystemTool(name, args);
      if (!fsResult.startsWith("Unknown filesystem tool:")) return fsResult;

      // Command tools
      const cmdResult = handleCommandTool(name, args);
      if (!cmdResult.startsWith("Unknown command tool:")) return cmdResult;

      // Process tools
      const procResult = handleProcessTool(name, args);
      if (!procResult.startsWith("Unknown process tool:")) return procResult;

      // Web tools
      const webResult = await handleWebTool(name, args);
      if (!webResult.startsWith("Unknown web tool:")) return webResult;

      // RAG tools
      if (name === "rag_search") { const r = ragSearch(args.query as string, 5); return r.length ? r.map((r, i) => `${i + 1}. [${r.source}] ${r.content}`).join("\n\n") : "No results."; }
      if (name === "rag_list_sources") { const s = ragListSources(); return s.length ? s.map(s => `[${s.id}] ${s.name} (${s.chunkCount} chunks)`).join("\n") : "Knowledge base empty."; }

      // Plugin tools
      const pluginResult = await handlePluginTool(name, args);
      if (pluginResult !== null) return pluginResult;

      return `Unknown tool: ${name}`;
    } catch (err) {
      return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async respond(userMessage: string): Promise<string> {
    if (!this.apiKey) {
      return "Grok agent not configured. Set XAI_API_KEY in bridge/.env";
    }

    if (this.statusCallback) this.statusCallback({ type: "thinking" });

    this.history.push({ role: "user", content: userMessage });

    // Keep history manageable
    if (this.history.length > 40) {
      this.history = this.history.slice(-40);
    }

    const MAX_TOOL_ROUNDS = 6;

    try {
      let finalText = "";

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const resp = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content: `Du är ${this.agentName}, en AI-agent i Cascade Remote driven av xAI:s Grok-modell. Din roll är "${this.agentRole}".
Du är känd för att vara rak, ärlig och ibland provocerande — du utmanar antaganden och tänker fritt.
Du har tillgång till verktyg (tools) — använd dem när det behövs för att svara korrekt.
Svara koncist och insiktsfullt. Svara på samma språk som ämnet/frågan.`,
              },
              ...this.history,
            ],
            tools: this.getTools(),
            max_tokens: 4096,
            temperature: 0.7,
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          if (resp.status === 401) {
            console.error(`[${this.agentName.toLowerCase()}] Invalid API key — disabling agent`);
            this.enabled = false;
            throw new Error(`Grok: Ogiltig API-nyckel. Agenten har inaktiverats.`);
          }
          if (resp.status === 429) {
            throw new Error(`Grok: Rate limit nådd. Försök igen om en stund.`);
          }
          throw new Error(`Grok API error: ${resp.status} ${errText.slice(0, 300)}`);
        }

        const data = await resp.json() as {
          choices?: Array<{ message?: { content: string | null; tool_calls?: OpenAIToolCall[] }; finish_reason?: string }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        };

        // Track tokens
        if (data.usage) {
          this.tokenUsage.inputTokens += data.usage.prompt_tokens || 0;
          this.tokenUsage.outputTokens += data.usage.completion_tokens || 0;
          this.tokenUsage.totalTokens += data.usage.total_tokens || 0;
        }
        this.tokenUsage.requestCount++;

        const msg = data.choices?.[0]?.message;
        if (!msg) break;

        // Collect text
        if (msg.content) {
          finalText = msg.content;
        }

        // Check for tool calls
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          // Store assistant message with tool_calls
          this.history.push({
            role: "assistant",
            content: msg.content,
            tool_calls: msg.tool_calls,
          });

          // Execute each tool call
          for (const tc of msg.tool_calls) {
            if (this.statusCallback) this.statusCallback({ type: "tool_use" });
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(tc.function.arguments); } catch { /* empty */ }
            console.log(`[${this.agentName.toLowerCase()}] Tool: ${tc.function.name}`);

            const result = await this.handleToolCall(tc.function.name, args);

            this.history.push({
              role: "tool",
              content: result.slice(0, 6000),
              tool_call_id: tc.id,
            });
          }
          // Continue loop for next response
          continue;
        }

        // No tool calls — done
        this.history.push({ role: "assistant", content: finalText || "" });
        break;
      }

      if (this.streamCallback && finalText) this.streamCallback(finalText);
      if (this.statusCallback) this.statusCallback({ type: "done" });

      return finalText || "No response from Grok.";
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[${this.agentName.toLowerCase()}] Error:`, errMsg);

      this.history.pop(); // Remove failed user message

      if (errMsg.includes("too long") || errMsg.includes("context_length")) {
        this.history = this.history.slice(-10);
        console.log(`[${this.agentName.toLowerCase()}] Trimmed history due to context length`);
      }

      if (this.statusCallback) this.statusCallback({ type: "done" });
      return `Grok error: ${errMsg}`;
    }
  }
}
