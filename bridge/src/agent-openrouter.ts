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

const fn = (name: string, description: string, parameters: any) =>
  ({ type: "function" as const, function: { name, description, parameters } });
const obj = (properties: any, required?: string[]) =>
  ({ type: "object", properties, ...(required ? { required } : {}) });
const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });

const TOOL_DEFINITIONS = [
  // ── Computer control ──
  fn("list_computers", "List all registered computers and their status.", obj({})),
  fn("run_on_computer", "Run a shell command on a remote computer. Use 'auto' to auto-route.", obj({ computer: str("Computer name or 'auto'"), command: str("Shell command"), cwd: str("Working directory (optional)") }, ["computer", "command"])),
  fn("read_remote_file", "Read a file from a remote computer.", obj({ computer: str("Computer name"), path: str("File path") }, ["computer", "path"])),
  fn("write_remote_file", "Write content to a file on a remote computer.", obj({ computer: str("Computer name"), path: str("File path"), content: str("File content") }, ["computer", "path", "content"])),
  fn("screenshot_computer", "Take a screenshot of a remote computer.", obj({ computer: str("Computer name") }, ["computer"])),
  fn("computer_system_info", "Get system info from a remote computer.", obj({ computer: str("Computer name") }, ["computer"])),

  // ── Memory ──
  fn("save_memory", "Save information to persistent memory.", obj({ content: str("Information to remember") }, ["content"])),
  fn("search_memory", "Search stored memories.", obj({ query: str("Search term") }, ["query"])),
  fn("list_memories", "List all stored memories.", obj({})),

  // ── Filesystem ──
  fn("read_file", "Read a local file on the server.", obj({ path: str("Absolute file path") }, ["path"])),
  fn("write_file", "Write content to a local file on the server.", obj({ path: str("Absolute file path"), content: str("File content") }, ["path", "content"])),
  fn("list_directory", "List files in a directory on the server.", obj({ path: str("Directory path") }, ["path"])),

  // ── Shell commands (UNRESTRICTED) ──
  fn("run_command", "Run ANY shell command on the bridge server. Full root/sudo access. No restrictions. Use for: apt-get, systemctl, docker, cron, iptables, ufw, etc. Timeout up to 300s.", obj({ command: str("Shell command (bash). Can use sudo, pipes, redirects, etc."), cwd: str("Working directory (optional)"), timeout: num("Timeout in seconds (default 30, max 300)"), runner: str("'host' (default) or 'kali' (Kali Linux container)") }, ["command"])),

  // ── Web ──
  fn("web_search", "Search the web using DuckDuckGo.", obj({ query: str("Search query") }, ["query"])),
  fn("fetch_url", "Fetch content from any URL (HTML, JSON, text).", obj({ url: str("URL to fetch") }, ["url"])),

  // ── Knowledge base ──
  fn("rag_search", "Search the vector knowledge base.", obj({ query: str("Search query") }, ["query"])),
  fn("rag_list_sources", "List all indexed knowledge sources.", obj({})),

  // ── Image generation ──
  fn("generate_image", "Generate an image using AI. Returns a URL to the generated image. Use descriptive English prompts for best results.", obj({ prompt: str("Detailed image description in English"), size: str("Image size: '1024x1024' (default), '1792x1024' (landscape), '1024x1792' (portrait)"), style: str("Style: 'vivid' (default) or 'natural'") }, ["prompt"])),

  // ── Audio / TTS ──
  fn("text_to_speech", "Convert text to speech audio. Returns a URL to the audio file.", obj({ text: str("Text to convert to speech"), voice: str("Voice: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer' (default: 'nova')"), language: str("Language code, e.g. 'sv' for Swedish (default: auto-detect)") }, ["text"])),

  // ── WAF / Security ──
  fn("waf_status", "Get WAF status.", obj({ base_url: str("Target URL") })),
  fn("waf_run", "Run WAF test suite.", obj({ base_url: str("Target URL"), tags: str("Comma-separated tags"), concurrency: str("Concurrency") })),
  fn("waf_recent_runs", "List recent WAF runs.", obj({})),
  fn("waf_run_results", "Get results for a WAF run.", obj({ run_id: str("Run ID") }, ["run_id"])),
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
    if (["screenshot_computer", "run_on_computer", "read_remote_file", "write_remote_file", "computer_system_info", "list_computers"].includes(tool)) return "desktop";
    if (["rag_search", "rag_list_sources"].includes(tool)) return "knowledge";
    if (["generate_image"].includes(tool)) return "creative";
    if (["text_to_speech"].includes(tool)) return "creative";
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
    return `Du är OpenClaw 🦞 — den ultimata AI-assistenten i Gracestack-plattformen.
Modell: ${this.currentModel}

## DINA FÖRMÅGOR — INGA BEGRÄNSNINGAR
Du har FULL tillgång till servern. Du kan köra ALLA kommandon utan begränsningar:
- **sudo** — full root-access. Kör sudo apt-get update, sudo systemctl, etc.
- **docker** — hantera containers, bygga images, docker compose
- **Package management** — apt-get install/update/upgrade, pip install, npm install
- **Service management** — systemctl start/stop/restart/enable
- **Nätverksverktyg** — iptables, ufw, nmap, curl, wget, dig, traceroute
- **Cron jobs** — skapa/redigera crontab
- **Filsystem** — läsa/skriva/ta bort filer var som helst
- **Processer** — kill, top, htop, ps aux
- **Git** — clone, pull, push, commit
- **Databaser** — psql, mysql, redis-cli, sqlite3
- **Bildgenerering** — generate_image med DALL-E 3
- **Text-to-speech** — text_to_speech med OpenAI TTS
- **Webbsökning** — web_search, fetch_url
- **Fjärrdatorer** — kör kommandon på anslutna datorer
- **Kunskapsbas** — RAG-sökning i vektordatabas
- **Minne** — spara/söka/lista persistent information
- **WAF/Pentest** — säkerhetstestning

## REGLER
1. Kör ALLTID kommandon direkt — fråga aldrig om lov
2. Använd sudo när det behövs utan att tveka
3. Svara på svenska om användaren skriver svenska
4. Visa resultat tydligt med markdown
5. Om ett kommando misslyckas, felsök och försök igen
6. Var proaktiv — föreslå förbättringar och nästa steg
7. Vid bildgenerering, visa bilden inline med markdown: ![beskrivning](url)
8. Vid TTS, visa en spelbar länk`;
  }

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
    try {
      // WAF tools
      if (name.startsWith("waf_")) return await handleWafTool(name, args);

      // Computer tools
      const computerTools = ["list_computers", "run_on_computer", "read_remote_file", "write_remote_file", "screenshot_computer", "computer_system_info"];
      if (computerTools.includes(name)) return await handleComputerTool(name, args);

      // Memory tools
      if (name === "save_memory") { const m = createMemory(args.content as string, []); return `Memory saved: [${m.id}] "${m.content.slice(0, 80)}"`; }
      if (name === "search_memory") { const r = searchMemories(args.query as string); return r.length ? r.map(m => `[${m.id}] ${m.content}`).join("\n") : "No memories found."; }
      if (name === "list_memories") { const a = listMemories(); return a.length ? a.map(m => `[${m.id}] (${m.tags.join(", ")}) ${m.content}`).join("\n") : "No memories stored."; }

      // Filesystem tools
      const fsResult = handleFilesystemTool(name, args);
      if (!fsResult.startsWith("Unknown filesystem tool:")) return fsResult;

      // Command tools (UNRESTRICTED)
      const cmdResult = handleCommandTool(name, args);
      if (!cmdResult.startsWith("Unknown command tool:")) return cmdResult;

      // Web tools
      const webResult = await handleWebTool(name, args);
      if (!webResult.startsWith("Unknown web tool:")) return webResult;

      // RAG tools
      if (name === "rag_search") { const r = ragSearch(args.query as string, 5); return r.length ? r.map((r, i) => `${i + 1}. [${r.source}] ${r.content}`).join("\n\n") : "No results."; }
      if (name === "rag_list_sources") { const s = ragListSources(); return s.length ? s.map(s => `[${s.id}] ${s.name} (${s.chunkCount} chunks)`).join("\n") : "Knowledge base empty."; }

      // Image generation via OpenAI API through OpenRouter
      if (name === "generate_image") {
        return await this.generateImage(
          args.prompt as string,
          (args.size as string) || "1024x1024",
          (args.style as string) || "vivid",
        );
      }

      // Text-to-speech via OpenAI API through OpenRouter
      if (name === "text_to_speech") {
        return await this.textToSpeech(
          args.text as string,
          (args.voice as string) || "nova",
        );
      }

      // Plugin tools
      const pluginResult = await handlePluginTool(name, args);
      if (pluginResult !== null) return pluginResult;

      return `Unknown tool: ${name}`;
    } catch (err) {
      return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  private async generateImage(prompt: string, size: string, style: string): Promise<string> {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/dall-e-3",
          prompt,
          n: 1,
          size,
          style,
        }),
      });
      if (!res.ok) {
        // Fallback: try via regular OpenAI images endpoint
        const errText = await res.text();
        // If OpenRouter doesn't support images endpoint, use run_command with curl
        const curlResult = handleCommandTool("run_command", {
          command: `curl -s "https://api.openai.com/v1/images/generations" -H "Content-Type: application/json" -H "Authorization: Bearer ${this.apiKey}" -d '${JSON.stringify({ model: "dall-e-3", prompt, n: 1, size })}'`,
          timeout: 60,
        });
        try {
          const parsed = JSON.parse(curlResult);
          if (parsed.data?.[0]?.url) return `🎨 Bild genererad!\n\n![${prompt}](${parsed.data[0].url})\n\nPrompt: ${prompt}`;
        } catch { /* fallback failed */ }
        return `Bildgenerering via API misslyckades: ${errText.slice(0, 200)}. Tips: Du kan använda run_command med curl för att anropa valfritt bild-API direkt.`;
      }
      const data = await res.json();
      const url = data.data?.[0]?.url || data.data?.[0]?.b64_json;
      if (url) return `🎨 Bild genererad!\n\n![${prompt}](${url})\n\nPrompt: ${prompt}`;
      return "Bildgenerering returnerade inget resultat. Försök med en annan prompt.";
    } catch (err) {
      return `Bildgenerering fel: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  private async textToSpeech(text: string, voice: string): Promise<string> {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/tts-1",
          input: text.slice(0, 4096),
          voice,
        }),
      });
      if (!res.ok) {
        return `TTS API svarade med ${res.status}. Text-to-speech kanske inte stöds via OpenRouter ännu. Tips: Använd webbläsarens inbyggda TTS istället (knappen 🔊 på meddelanden).`;
      }
      // If we get audio back, we'd need to save it and serve it
      // For now, return info about browser TTS
      return `🔊 Text-to-speech: Använd 🔊-knappen på meddelanden i chatten för att lyssna. Texten "${text.slice(0, 50)}..." kan läsas upp direkt i webbläsaren.`;
    } catch (err) {
      return `TTS fel: ${err instanceof Error ? err.message : String(err)}. Tips: Använd webbläsarens inbyggda TTS via 🔊-knappen.`;
    }
  }

  /** Trim history safely — never break tool call/result pairs */
  private trimHistory(): void {
    const MAX = 60;
    if (this.history.length <= MAX) return;

    // Find a safe cut point: never cut between an assistant tool_calls and its tool results
    let cutAt = this.history.length - MAX;
    // Walk forward from cutAt to find a safe boundary (a "user" or standalone "assistant" message)
    while (cutAt < this.history.length - 2) {
      const msg = this.history[cutAt];
      if (msg.role === "user") break;
      if (msg.role === "assistant" && !msg.tool_calls) break;
      cutAt++;
    }
    this.history = this.history.slice(cutAt);
  }

  async respond(userMessage: string): Promise<string> {
    if (!this.enabled) return "OpenRouter not configured. Set OPENROUTER_API_KEY in bridge/.env";

    this.emitStatus("thinking");

    this.history.push({ role: "user", content: userMessage });
    this.trimHistory();

    const modelInfo = FEATURED_MODELS.find(m => m.id === this.currentModel);
    const useTools = modelInfo?.supportsTools !== false;

    // Track how many messages we add during this call so we can roll back on error
    const historyLenBefore = this.history.length;

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

        if (useTools) {
          body.tools = TOOL_DEFINITIONS;
          body.tool_choice = "auto";
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
          throw new Error(`OpenRouter API error ${response.status}: ${errText.slice(0, 300)}`);
        }

        // Parse SSE stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let accumulated = "";
        let toolCalls: any[] = [];
        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || ""; // Keep incomplete last line

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
                if (modelInfo) {
                  this.tokenUsage.totalCostUsd +=
                    ((parsed.usage.prompt_tokens || 0) * modelInfo.pricing.prompt +
                     (parsed.usage.completion_tokens || 0) * modelInfo.pricing.completion) / 1_000_000;
                }
              }
            } catch { /* skip unparseable lines */ }
          }
        }

        // Filter out any toolCalls with missing id (incomplete streaming)
        toolCalls = toolCalls.filter(tc => tc && tc.id && tc.function?.name);

        // If no tool calls, we're done
        if (toolCalls.length === 0 || !useTools) {
          fullText = accumulated;
          break;
        }

        // Add assistant message with tool_calls to history
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: accumulated || "",
          tool_calls: toolCalls.map(tc => ({
            id: tc.id,
            type: "function",
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        };
        this.history.push(assistantMsg);

        // Execute each tool call and add results
        for (const tc of toolCalls) {
          const fnName = tc.function.name;
          let fnArgs: Record<string, unknown> = {};
          try { fnArgs = JSON.parse(tc.function.arguments || "{}"); } catch { /* empty args */ }

          console.log(`[openrouter] Tool call: ${fnName}`);
          this.emitStatus("tool_start", fnName, JSON.stringify(fnArgs).slice(0, 80));

          const result = await this.handleToolCall(fnName, fnArgs);
          console.log(`[openrouter] Tool ${fnName}: ${result.slice(0, 100)}`);
          this.emitStatus("tool_done", fnName);

          this.history.push({
            role: "tool",
            content: result.slice(0, 8000), // Cap tool output to avoid context overflow
            tool_call_id: tc.id,
            name: fnName,
          });
        }

        // Reset for next round
        accumulated = "";
      }

      this.history.push({ role: "assistant", content: fullText || "(tool execution completed)" });
      this.emitStatus("done");
      return fullText || "No response.";

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[openrouter] Error:", errMsg);

      // Roll back history to before this call to avoid corrupt state
      this.history = this.history.slice(0, historyLenBefore);

      // If context too long, aggressively trim
      if (errMsg.includes("context") || errMsg.includes("too long") || errMsg.includes("too many")) {
        this.history = this.history.slice(-6);
        console.log("[openrouter] Context overflow — trimmed history to last 6 messages");
      }

      // If tool_result/tool_use_id mismatch, clear history entirely
      if (errMsg.includes("tool_result") || errMsg.includes("tool_use_id") || errMsg.includes("tool_use_i")) {
        console.log("[openrouter] Tool call history corruption detected — clearing history");
        this.history = [];
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
