/**
 * Ollama Agent — Local LLM integration for Cascade Remote
 * 
 * Connects to a local Ollama instance for privacy-focused AI.
 * Auto-detects available models and provides a chat interface.
 * Now with FULL tool support — same capabilities as Claude/Gemini/DeepSeek.
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

export interface OllamaModel {
  name: string;
  size: string;
  modified: string;
  digest: string;
}

export interface OllamaTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
}

export type OllamaStreamCallback = (chunk: string) => void;
export type OllamaStatusCallback = (status: { type: string }) => void;

interface OllamaToolCall {
  function: { name: string; arguments: Record<string, unknown> };
}

interface OllamaMessage {
  role: string;
  content: string;
  tool_calls?: OllamaToolCall[];
}

export class OllamaAgent {
  private baseUrl: string;
  private model: string;
  private enabled: boolean;
  private history: OllamaMessage[] = [];
  private streamCallback: OllamaStreamCallback | null = null;
  private statusCallback: OllamaStatusCallback | null = null;
  private tokenUsage: OllamaTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 };
  private availableModels: OllamaModel[] = [];

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama3";
    this.enabled = false;

    // Auto-detect Ollama on startup
    this.detectOllama();
  }

  private async detectOllama(): Promise<void> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const data = await resp.json() as { models?: OllamaModel[] };
        this.availableModels = data.models || [];
        this.enabled = this.availableModels.length > 0;

        // Use first available model if configured model not found
        if (this.enabled && !this.availableModels.find(m => m.name === this.model)) {
          this.model = this.availableModels[0].name;
        }

        console.log(`[ollama] Detected ${this.availableModels.length} model(s): ${this.availableModels.map(m => m.name).join(", ")}`);
        console.log(`[ollama] Using model: ${this.model}`);
      }
    } catch {
      console.log("[ollama] Not detected (install from https://ollama.ai)");
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getModel(): string {
    return this.model;
  }

  setModel(model: string): void {
    this.model = model;
  }

  getAvailableModels(): OllamaModel[] {
    return this.availableModels;
  }

  onStream(cb: OllamaStreamCallback): void {
    this.streamCallback = cb;
  }

  onStatus(cb: OllamaStatusCallback): void {
    this.statusCallback = cb;
  }

  getTokenUsage(): OllamaTokenUsage {
    return { ...this.tokenUsage };
  }

  clearHistory(): void {
    this.history = [];
  }

  async refreshModels(): Promise<OllamaModel[]> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        const data = await resp.json() as { models?: OllamaModel[] };
        this.availableModels = data.models || [];
        this.enabled = this.availableModels.length > 0;
        return this.availableModels;
      }
    } catch { /* ignore */ }
    return [];
  }

  private getTools(): Array<{ type: "function"; function: { name: string; description: string; parameters: { type: string; properties: Record<string, unknown>; required?: string[] } } }> {
    const builtinTools = [
      { name: "save_memory", description: "Save information to persistent memory.", parameters: { type: "object" as const, properties: { content: { type: "string", description: "Information to remember" } }, required: ["content"] } },
      { name: "search_memory", description: "Search stored memories by keyword.", parameters: { type: "object" as const, properties: { query: { type: "string", description: "Search term" } }, required: ["query"] } },
      { name: "list_memories", description: "List all stored memories.", parameters: { type: "object" as const, properties: {} } },
      { name: "read_file", description: "Read a local file.", parameters: { type: "object" as const, properties: { path: { type: "string", description: "File path" } }, required: ["path"] } },
      { name: "write_file", description: "Write content to a local file.", parameters: { type: "object" as const, properties: { path: { type: "string", description: "File path" }, content: { type: "string", description: "Content" } }, required: ["path", "content"] } },
      { name: "list_directory", description: "List files in a directory.", parameters: { type: "object" as const, properties: { path: { type: "string", description: "Directory path" } }, required: ["path"] } },
      { name: "run_command", description: "Run a shell command on the bridge server.", parameters: { type: "object" as const, properties: { command: { type: "string", description: "Command to run" }, cwd: { type: "string", description: "Working directory" } }, required: ["command"] } },
      { name: "waf_start", description: "Start WAF with a profile (pl1/pl2/pl3/pl4).", parameters: { type: "object" as const, properties: { profile: { type: "string", description: "WAF profile" } } } },
      { name: "waf_stop", description: "Stop WAF immediately.", parameters: { type: "object" as const, properties: {} } },
      { name: "waf_status", description: "Get WAF status for a target base URL.", parameters: { type: "object" as const, properties: { base_url: { type: "string", description: "Target base URL" } } } },
      { name: "waf_run", description: "Run WAF test suite with raw parameters (no bridge-side clamping).", parameters: { type: "object" as const, properties: { base_url: { type: "string", description: "Target base URL" }, tags: { type: "string", description: "Comma-separated tags" }, exclude_tags: { type: "string", description: "Comma-separated excluded tags" }, ids: { type: "string", description: "Comma-separated test IDs" }, concurrency: { type: "string", description: "Concurrency value forwarded as-is" } } } },
      { name: "waf_recent_runs", description: "List recent WAF runs.", parameters: { type: "object" as const, properties: {} } },
      { name: "waf_run_results", description: "Get results for a specific WAF run ID.", parameters: { type: "object" as const, properties: { run_id: { type: "string", description: "Run ID" } }, required: ["run_id"] } },
      { name: "waf_request", description: "Unrestricted raw request to WAF service path.", parameters: { type: "object" as const, properties: { path: { type: "string", description: "Path on WAF service" }, method: { type: "string", description: "HTTP method" }, content_type: { type: "string", description: "Content-Type header" }, headers: { type: "string", description: "JSON object string of headers" }, body: { type: "string", description: "Raw body" } }, required: ["path"] } },
      { name: "list_computers", description: "List all registered computers.", parameters: { type: "object" as const, properties: {} } },
      { name: "run_on_computer", description: "Run a command on a remote computer.", parameters: { type: "object" as const, properties: { computer: { type: "string", description: "Computer name or 'auto'" }, command: { type: "string", description: "Shell command" } }, required: ["computer", "command"] } },
      { name: "rag_search", description: "Search the knowledge base.", parameters: { type: "object" as const, properties: { query: { type: "string", description: "Search query" } }, required: ["query"] } },
    ];

    const pluginDefs = getPluginToolDefinitions().map((d) => ({
      name: d.name,
      description: `[Plugin] ${d.description}`,
      parameters: d.input_schema as { type: string; properties: Record<string, unknown>; required?: string[] },
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
    if (!this.enabled) {
      return "Ollama is not available. Install from https://ollama.ai and pull a model.";
    }

    this.history.push({ role: "user", content: userMessage });

    // Keep history manageable
    if (this.history.length > 30) {
      this.history = this.history.slice(-30);
    }

    if (this.statusCallback) this.statusCallback({ type: "thinking" });

    const MAX_TOOL_ROUNDS = 4;

    try {
      let finalText = "";

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const resp = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content: `Du är en lokal AI-assistent i Cascade Remote, byggd av Kim. Du kör lokalt via Ollama (modell: ${this.model}).
Du har tillgång till verktyg (tools) — använd dem när det behövs för att svara korrekt.
Svara koncist och hjälpsamt. Svara på samma språk som användaren skriver.`,
              },
              ...this.history,
            ],
            tools: this.getTools(),
            stream: false,
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Ollama API error: ${resp.status} ${errText}`);
        }

        const data = await resp.json() as {
          message?: { content: string; tool_calls?: OllamaToolCall[] };
          eval_count?: number;
          prompt_eval_count?: number;
        };

        // Track tokens
        const inputTokens = data.prompt_eval_count || Math.ceil(userMessage.length / 4);
        const outputTokens = data.eval_count || Math.ceil((data.message?.content || "").length / 4);
        this.tokenUsage.inputTokens += inputTokens;
        this.tokenUsage.outputTokens += outputTokens;
        this.tokenUsage.totalTokens += inputTokens + outputTokens;
        this.tokenUsage.requestCount++;

        const msg = data.message;
        if (!msg) break;

        if (msg.content) {
          finalText = msg.content;
        }

        // Check for tool calls
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          this.history.push({
            role: "assistant",
            content: msg.content || "",
            tool_calls: msg.tool_calls,
          });

          for (const tc of msg.tool_calls) {
            if (this.statusCallback) this.statusCallback({ type: "tool_use" });
            const args = tc.function.arguments || {};
            console.log(`[ollama] Tool: ${tc.function.name}`);

            const result = await this.handleToolCall(tc.function.name, args);

            this.history.push({
              role: "tool",
              content: result.slice(0, 4000),
            });
          }
          continue;
        }

        // No tool calls — done
        this.history.push({ role: "assistant", content: finalText || "" });
        break;
      }

      if (this.streamCallback && finalText) this.streamCallback(finalText);
      if (this.statusCallback) this.statusCallback({ type: "done" });

      return finalText || "No response from Ollama";
    } catch (err) {
      if (this.statusCallback) this.statusCallback({ type: "done" });
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[ollama] Error:", errMsg);
      return `Ollama error: ${errMsg}`;
    }
  }

  async pullModel(modelName: string): Promise<string> {
    try {
      const resp = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modelName, stream: false }),
      });

      if (!resp.ok) {
        return `Failed to pull model: ${resp.status}`;
      }

      await this.refreshModels();
      return `Model ${modelName} pulled successfully`;
    } catch (err) {
      return `Error pulling model: ${err instanceof Error ? err.message : String(err)}`;
    }
  }
}
