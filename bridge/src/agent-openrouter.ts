/**
 * OpenRouter Agent — Multi-model gateway
 * 
 * Uses OpenRouter's OpenAI-compatible API to access 200+ models
 * (Claude, GPT-4o, Llama, Mistral, DeepSeek, Qwen, etc.)
 * with streaming and tool calling support.
 */
import { createMemory, searchMemories, listMemories } from "./memory.js";
import { handleFilesystemTool } from "./tools-filesystem.js";
import { handleCommandTool } from "./tools-commands.js";
import { handleWebTool } from "./tools-web.js";
import { handleWafTool } from "./tools-waf.js";
import { handleComputerTool } from "./tools-computers.js";
import { ragSearch, ragListSources } from "./rag.js";
import { getPluginToolDefinitions, handlePluginTool } from "./plugin-loader.js";

export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  pricing: { prompt: number; completion: number };
  supportsTools: boolean;
  supportsStreaming: boolean;
  description?: string;
  icon?: string;
}

export interface OpenRouterTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
  totalCostUsd: number;
}

export type OpenRouterStreamCallback = (chunk: string) => void;
export type OpenRouterStatusCallback = (status: { type: string; tool?: string; input?: string; category?: string }) => void;

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

// Curated list of top models available via OpenRouter
const FEATURED_MODELS: OpenRouterModel[] = [
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    contextLength: 200000,
    pricing: { prompt: 3, completion: 15 },
    supportsTools: true,
    supportsStreaming: true,
    icon: "🏛️",
    description: "Anthropics senaste — bäst på kod och resonering",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    contextLength: 128000,
    pricing: { prompt: 2.5, completion: 10 },
    supportsTools: true,
    supportsStreaming: true,
    icon: "🟢",
    description: "OpenAIs flaggskepp — snabb multimodal",
  },
  {
    id: "openai/o3-mini",
    name: "o3-mini",
    provider: "OpenAI",
    contextLength: 200000,
    pricing: { prompt: 1.1, completion: 4.4 },
    supportsTools: true,
    supportsStreaming: true,
    icon: "🧠",
    description: "OpenAIs resoneringsmodell — djup analys",
  },
  {
    id: "google/gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    contextLength: 1000000,
    pricing: { prompt: 1.25, completion: 10 },
    supportsTools: true,
    supportsStreaming: true,
    icon: "💎",
    description: "Googles bästa — 1M context, stark på allt",
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    contextLength: 64000,
    pricing: { prompt: 0.55, completion: 2.19 },
    supportsTools: false,
    supportsStreaming: true,
    icon: "🐋",
    description: "Öppen resoneringsmodell — billig och kraftfull",
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    provider: "Meta",
    contextLength: 1000000,
    pricing: { prompt: 0.2, completion: 0.6 },
    supportsTools: true,
    supportsStreaming: true,
    icon: "🦙",
    description: "Metas senaste öppna modell — extremt billig",
  },
  {
    id: "mistralai/mistral-large-2411",
    name: "Mistral Large",
    provider: "Mistral",
    contextLength: 128000,
    pricing: { prompt: 2, completion: 6 },
    supportsTools: true,
    supportsStreaming: true,
    icon: "🌊",
    description: "Europas bästa — stark på flerspråkigt",
  },
  {
    id: "qwen/qwen-2.5-coder-32b-instruct",
    name: "Qwen 2.5 Coder 32B",
    provider: "Alibaba",
    contextLength: 32768,
    pricing: { prompt: 0.07, completion: 0.16 },
    supportsTools: true,
    supportsStreaming: true,
    icon: "🐉",
    description: "Bästa öppna kodmodellen — extremt billig",
  },
  {
    id: "x-ai/grok-3-mini-beta",
    name: "Grok 3 Mini",
    provider: "xAI",
    contextLength: 131072,
    pricing: { prompt: 0.3, completion: 0.5 },
    supportsTools: true,
    supportsStreaming: true,
    icon: "⚡",
    description: "xAIs snabba resoneringsmodell",
  },
  {
    id: "perplexity/sonar-deep-research",
    name: "Sonar Deep Research",
    provider: "Perplexity",
    contextLength: 128000,
    pricing: { prompt: 2, completion: 8 },
    supportsTools: false,
    supportsStreaming: true,
    icon: "🔍",
    description: "Djup webbforskning med källor",
  },
];

const TOOL_DEFINITIONS = [
  { type: "function" as const, function: { name: "list_computers", description: "List all registered computers and their status.", parameters: { type: "object", properties: {} } } },
  { type: "function" as const, function: { name: "run_on_computer", description: "Run a shell command on a remote computer. Use 'auto' to auto-route.", parameters: { type: "object", properties: { computer: { type: "string", description: "Computer name or 'auto'" }, command: { type: "string", description: "Shell command" } }, required: ["computer", "command"] } } },
  { type: "function" as const, function: { name: "read_remote_file", description: "Read a file from a remote computer.", parameters: { type: "object", properties: { computer: { type: "string" }, path: { type: "string" } }, required: ["computer", "path"] } } },
  { type: "function" as const, function: { name: "write_remote_file", description: "Write content to a file on a remote computer.", parameters: { type: "object", properties: { computer: { type: "string" }, path: { type: "string" }, content: { type: "string" } }, required: ["computer", "path", "content"] } } },
  { type: "function" as const, function: { name: "screenshot_computer", description: "Take a screenshot of a remote computer.", parameters: { type: "object", properties: { computer: { type: "string" } }, required: ["computer"] } } },
  { type: "function" as const, function: { name: "save_memory", description: "Save information to persistent memory.", parameters: { type: "object", properties: { content: { type: "string", description: "Information to remember" } }, required: ["content"] } } },
  { type: "function" as const, function: { name: "search_memory", description: "Search stored memories.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function" as const, function: { name: "list_memories", description: "List all stored memories.", parameters: { type: "object", properties: {} } } },
  { type: "function" as const, function: { name: "read_file", description: "Read a local file.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
  { type: "function" as const, function: { name: "write_file", description: "Write to a local file.", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } } },
  { type: "function" as const, function: { name: "list_directory", description: "List files in a directory.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } } },
  { type: "function" as const, function: { name: "run_command", description: "Run a shell command on the bridge server.", parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } } },
  { type: "function" as const, function: { name: "web_search", description: "Search the web.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
  { type: "function" as const, function: { name: "fetch_url", description: "Fetch content from a URL.", parameters: { type: "object", properties: { url: { type: "string" } }, required: ["url"] } } },
  { type: "function" as const, function: { name: "rag_search", description: "Search the knowledge base.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
];

export class OpenRouterAgent {
  private apiKey: string;
  private currentModel: string;
  private history: ChatMessage[] = [];
  private streamCallback: OpenRouterStreamCallback | null = null;
  private statusCallback: OpenRouterStatusCallback | null = null;
  private tokenUsage: OpenRouterTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, totalCostUsd: 0 };
  private enabled: boolean;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    this.currentModel = "anthropic/claude-sonnet-4";
    this.enabled = !!this.apiKey;
    if (this.enabled) {
      console.log("[openrouter] Initialized with multi-model gateway");
    } else {
      console.log("[openrouter] No OPENROUTER_API_KEY set — disabled");
    }
  }

  isEnabled(): boolean { return this.enabled; }

  onStream(cb: OpenRouterStreamCallback): void { this.streamCallback = cb; }
  onStatus(cb: OpenRouterStatusCallback): void { this.statusCallback = cb; }

  private emitStream(chunk: string): void { if (this.streamCallback) this.streamCallback(chunk); }
  private emitStatus(type: string, tool?: string, input?: string): void {
    const category = tool ? this.categorize(tool) : "thinking";
    if (this.statusCallback) this.statusCallback({ type, tool, input, category });
  }

  private categorize(tool: string): string {
    if (["save_memory", "search_memory", "list_memories"].includes(tool)) return "memory";
    if (["read_file", "write_file", "list_directory"].includes(tool)) return "filesystem";
    if (["run_command"].includes(tool)) return "command";
    if (["web_search", "fetch_url"].includes(tool)) return "web";
    if (["screenshot_computer", "run_on_computer", "read_remote_file", "write_remote_file"].includes(tool)) return "desktop";
    if (["rag_search"].includes(tool)) return "knowledge";
    if (tool.startsWith("waf_")) return "security";
    return "thinking";
  }

  setModel(modelId: string): void {
    this.currentModel = modelId;
    console.log(`[openrouter] Model switched to: ${modelId}`);
  }

  getModel(): string { return this.currentModel; }
  getModels(): OpenRouterModel[] { return FEATURED_MODELS; }
  getTokenUsage(): OpenRouterTokenUsage { return { ...this.tokenUsage }; }
  resetTokenUsage(): void { this.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, totalCostUsd: 0 }; }

  clearHistory(): void { this.history = []; }

  private getSystemPrompt(): string {
    return `Du är OpenClaw 🦞 — en kraftfull AI-assistent i Gracestack-plattformen.
Du körs just nu via modellen: ${this.currentModel}
Du har tillgång till verktyg för att styra datorer, läsa/skriva filer, köra kommandon, söka på webben, hantera minne, och mer.
Svara på svenska om användaren skriver på svenska, annars på engelska.
Var hjälpsam, konkret och handlingskraftig. Använd verktyg aktivt när det behövs.`;
  }

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
    try {
      if (name.startsWith("waf_")) return await handleWafTool(name, args);
      const computerTools = ["list_computers", "run_on_computer", "read_remote_file", "write_remote_file", "screenshot_computer"];
      if (computerTools.includes(name)) return await handleComputerTool(name, args);
      if (name === "save_memory") { const m = createMemory(args.content as string, []); return `Memory saved: [${m.id}] "${m.content.slice(0, 80)}"`; }
      if (name === "search_memory") { const r = searchMemories(args.query as string); return r.length ? r.map(m => `[${m.id}] ${m.content}`).join("\n") : "No memories found."; }
      if (name === "list_memories") { const a = listMemories(); return a.length ? a.map(m => `[${m.id}] (${m.tags.join(", ")}) ${m.content}`).join("\n") : "No memories stored."; }
      const fsResult = handleFilesystemTool(name, args);
      if (!fsResult.startsWith("Unknown filesystem tool:")) return fsResult;
      const cmdResult = handleCommandTool(name, args);
      if (!cmdResult.startsWith("Unknown command tool:")) return cmdResult;
      const webResult = await handleWebTool(name, args);
      if (!webResult.startsWith("Unknown web tool:")) return webResult;
      if (name === "rag_search") { const r = ragSearch(args.query as string, 5); return r.length ? r.map((r, i) => `${i + 1}. [${r.source}] ${r.content}`).join("\n\n") : "No results."; }
      const pluginResult = await handlePluginTool(name, args);
      if (pluginResult !== null) return pluginResult;
      return `Unknown tool: ${name}`;
    } catch (err) {
      return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async respond(userMessage: string): Promise<string> {
    if (!this.enabled) return "OpenRouter not configured. Set OPENROUTER_API_KEY in bridge/.env";

    this.emitStatus("thinking");

    this.history.push({ role: "user", content: userMessage });
    if (this.history.length > 60) this.history = this.history.slice(-60);

    const modelInfo = FEATURED_MODELS.find(m => m.id === this.currentModel);
    const useTools = modelInfo?.supportsTools !== false;

    try {
      const MAX_TOOL_ROUNDS = 8;
      let fullText = "";

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const body: any = {
          model: this.currentModel,
          messages: [
            { role: "system", content: this.getSystemPrompt() },
            ...this.history,
          ],
          stream: true,
          max_tokens: 4096,
        };

        if (useTools && round === 0) {
          body.tools = TOOL_DEFINITIONS;
          body.tool_choice = "auto";
        }
        // On subsequent rounds (after tool results), include tools again
        if (useTools && round > 0) {
          body.tools = TOOL_DEFINITIONS;
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://app.gracestack.se",
            "X-Title": "Gracestack OpenClaw",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API error ${response.status}: ${errText.slice(0, 200)}`);
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let accumulated = "";
        let toolCalls: any[] = [];
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (!delta) continue;

              // Text content
              if (delta.content) {
                accumulated += delta.content;
                this.emitStream(accumulated);
              }

              // Tool calls
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) {
                    toolCalls[idx] = { id: tc.id || "", function: { name: "", arguments: "" } };
                  }
                  if (tc.id) toolCalls[idx].id = tc.id;
                  if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                }
              }

              // Usage
              if (parsed.usage) {
                this.tokenUsage.inputTokens += parsed.usage.prompt_tokens || 0;
                this.tokenUsage.outputTokens += parsed.usage.completion_tokens || 0;
                this.tokenUsage.totalTokens += (parsed.usage.prompt_tokens || 0) + (parsed.usage.completion_tokens || 0);
                this.tokenUsage.requestCount++;
                // Estimate cost
                if (modelInfo) {
                  this.tokenUsage.totalCostUsd +=
                    ((parsed.usage.prompt_tokens || 0) * modelInfo.pricing.prompt +
                     (parsed.usage.completion_tokens || 0) * modelInfo.pricing.completion) / 1_000_000;
                }
              }
            } catch { /* skip unparseable lines */ }
          }
        }

        // If no tool calls, we're done
        if (toolCalls.length === 0 || !useTools) {
          fullText = accumulated;
          break;
        }

        // Process tool calls
        // Add assistant message with tool_calls to history
        this.history.push({
          role: "assistant",
          content: accumulated || null,
          tool_calls: toolCalls.map(tc => ({
            id: tc.id,
            type: "function",
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        });

        for (const tc of toolCalls) {
          const fnName = tc.function.name;
          let fnArgs: Record<string, unknown> = {};
          try { fnArgs = JSON.parse(tc.function.arguments || "{}"); } catch { /* empty args */ }

          console.log(`[openrouter] Tool call: ${fnName}`);
          this.emitStatus("tool_start", fnName, JSON.stringify(fnArgs).slice(0, 80));

          const result = await this.handleToolCall(fnName, fnArgs);
          console.log(`[openrouter] Tool ${fnName}: ${result.slice(0, 100)}`);
          this.emitStatus("tool_done", fnName);

          // Add tool result to history
          this.history.push({
            role: "tool",
            content: result,
            tool_call_id: tc.id,
            name: fnName,
          });
        }

        // Continue loop to get model's follow-up response
        accumulated = "";
      }

      this.history.push({ role: "assistant", content: fullText || "(tool execution completed)" });
      this.emitStatus("done");
      return fullText || "No response.";

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[openrouter] Error:", errMsg);
      this.history.pop(); // Remove failed user message
      if (errMsg.includes("context") || errMsg.includes("too long")) {
        this.history = this.history.slice(-10);
      }
      this.emitStatus("done");
      return `OpenRouter error: ${errMsg}`;
    }
  }

  // Fetch live model list from OpenRouter API
  async fetchAvailableModels(): Promise<OpenRouterModel[]> {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { "Authorization": `Bearer ${this.apiKey}` },
      });
      if (!res.ok) return FEATURED_MODELS;
      const data = await res.json();
      // Return curated list + any popular ones from API
      return FEATURED_MODELS;
    } catch {
      return FEATURED_MODELS;
    }
  }

  // Get account credits/balance
  async getCredits(): Promise<{ balance: number; limit: number; usage: number } | null> {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: { "Authorization": `Bearer ${this.apiKey}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        balance: data.data?.limit_remaining ?? 0,
        limit: data.data?.limit ?? 0,
        usage: data.data?.usage ?? 0,
      };
    } catch {
      return null;
    }
  }
}
