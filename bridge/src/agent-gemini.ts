/**
 * Gemini AI Agent for Cascade Remote Bridge
 * 
 * Provides a second AI chat using Google's Gemini API.
 * Runs independently alongside the Claude agent.
 * Now with FULL tool support — same capabilities as Claude.
 */
import { GoogleGenerativeAI, Content, Part, FunctionDeclarationsTool, SchemaType } from "@google/generative-ai";
import { getGeminiContext } from "./system-context.js";
import { handleComputerTool } from "./tools-computers.js";
import { handleFilesystemTool } from "./tools-filesystem.js";
import { handleCommandTool } from "./tools-commands.js";
import { handleProcessTool } from "./tools-process.js";
import { handleWebTool } from "./tools-web.js";
import { createMemory, searchMemories, listMemories, updateMemory, deleteMemory } from "./memory.js";
import { ragSearch, ragListSources, ragStats, ragIndexText, ragIndexFile } from "./rag.js";
import { getPluginToolDefinitions, handlePluginTool } from "./plugin-loader.js";

export type GeminiStreamCallback = (chunk: string) => void;
export type GeminiStatusCallback = (status: { type: string }) => void;

export interface GeminiTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
}

export interface GeminiAgentConfig {
  name?: string;
  role?: string;
  model?: string;
  apiKey?: string;
  systemPromptSuffix?: string;
}

export class GeminiAgent {
  private client: GoogleGenerativeAI | null = null;
  private history: Content[] = [];
  private model: string;
  private enabled: boolean;
  private streamCallback: GeminiStreamCallback | null = null;
  private statusCallback: GeminiStatusCallback | null = null;
  private tokenUsage: GeminiTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 };
  public readonly agentName: string;
  public readonly agentRole: string;
  private systemPromptSuffix: string;

  constructor(config?: GeminiAgentConfig) {
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
    this.model = config?.model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
    this.agentName = config?.name || "Gemini";
    this.agentRole = config?.role || "researcher";
    this.systemPromptSuffix = config?.systemPromptSuffix || "";
    this.enabled = !!apiKey;

    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
      console.log(`[${this.agentName.toLowerCase()}] Initialized with model: ${this.model} (role: ${this.agentRole})`);
    } else {
      console.log(`[${this.agentName.toLowerCase()}] No GEMINI_API_KEY set - agent disabled`);
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  onStream(cb: GeminiStreamCallback): void {
    this.streamCallback = cb;
  }

  onStatus(cb: GeminiStatusCallback): void {
    this.statusCallback = cb;
  }

  private emitStream(chunk: string): void {
    if (this.streamCallback) this.streamCallback(chunk);
  }

  private emitStatus(type: string): void {
    if (this.statusCallback) this.statusCallback({ type });
  }

  private getTools(): FunctionDeclarationsTool[] {
    return [{
      functionDeclarations: [
        // Computer tools
        { name: "list_computers", description: "List all registered computers and their status, capabilities, and tools.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        { name: "run_on_computer", description: "Run a shell command on a remote computer. Use 'auto' to auto-route.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name, ID, or 'auto'" }, command: { type: SchemaType.STRING, description: "Shell command to execute" }, cwd: { type: SchemaType.STRING, description: "Working directory (optional)" } }, required: ["computer", "command"] } },
        { name: "read_remote_file", description: "Read a file from a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name or ID" }, path: { type: SchemaType.STRING, description: "File path" } }, required: ["computer", "path"] } },
        { name: "write_remote_file", description: "Write content to a file on a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name or ID" }, path: { type: SchemaType.STRING, description: "File path" }, content: { type: SchemaType.STRING, description: "File content" } }, required: ["computer", "path", "content"] } },
        { name: "screenshot_computer", description: "Take a screenshot of a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name or ID" } }, required: ["computer"] } },
        { name: "computer_system_info", description: "Get system info from a remote computer.", parameters: { type: SchemaType.OBJECT, properties: { computer: { type: SchemaType.STRING, description: "Computer name or ID" } }, required: ["computer"] } },
        // Memory tools
        { name: "save_memory", description: "Save information to persistent memory.", parameters: { type: SchemaType.OBJECT, properties: { content: { type: SchemaType.STRING, description: "Information to remember" } }, required: ["content"] } },
        { name: "search_memory", description: "Search stored memories by keyword.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Search term" } }, required: ["query"] } },
        { name: "list_memories", description: "List all stored memories.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        // Filesystem tools
        { name: "read_file", description: "Read a local file.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "File path" } }, required: ["path"] } },
        { name: "write_file", description: "Write content to a local file.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "File path" }, content: { type: SchemaType.STRING, description: "Content" } }, required: ["path", "content"] } },
        { name: "list_directory", description: "List files in a directory.", parameters: { type: SchemaType.OBJECT, properties: { path: { type: SchemaType.STRING, description: "Directory path" } }, required: ["path"] } },
        // Command tools
        { name: "run_command", description: "Run a shell command on the bridge server.", parameters: { type: SchemaType.OBJECT, properties: { command: { type: SchemaType.STRING, description: "Command to run" }, cwd: { type: SchemaType.STRING, description: "Working directory" } }, required: ["command"] } },
        // Web tools
        { name: "web_search", description: "Search the web.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Search query" } }, required: ["query"] } },
        { name: "fetch_url", description: "Fetch content from a URL.", parameters: { type: SchemaType.OBJECT, properties: { url: { type: SchemaType.STRING, description: "URL to fetch" } }, required: ["url"] } },
        // RAG tools
        { name: "rag_search", description: "Search the knowledge base.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Search query" } }, required: ["query"] } },
        { name: "rag_list_sources", description: "List all indexed sources in the knowledge base.", parameters: { type: SchemaType.OBJECT, properties: {} } },
        // Plugin tools (dynamically loaded)
        ...getPluginToolDefinitions().map((d) => {
          const props: Record<string, unknown> = {};
          if (d.input_schema && typeof d.input_schema === "object" && "properties" in d.input_schema) {
            const srcProps = (d.input_schema as Record<string, unknown>).properties as Record<string, { type?: string; description?: string }> || {};
            for (const [key, val] of Object.entries(srcProps)) {
              props[key] = { type: SchemaType.STRING, description: val.description || key };
            }
          }
          return {
            name: d.name,
            description: `[Plugin] ${d.description}`,
            parameters: { type: SchemaType.OBJECT, properties: props },
          } as any;
        }),
      ],
    }];
  }

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
    try {
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
    if (!this.client) {
      return "Gemini agent not configured. Set GEMINI_API_KEY in bridge/.env";
    }

    this.emitStatus("thinking");

    this.history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    if (this.history.length > 40) {
      this.history = this.history.slice(-40);
    }

    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        systemInstruction: this.getSystemPrompt(),
        tools: this.getTools(),
      });

      const chat = model.startChat({
        history: this.history.slice(0, -1),
      });

      let fullText = "";
      const MAX_TOOL_ROUNDS = 8;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const result = await chat.sendMessage(round === 0 ? userMessage : []);
        const response = result.response;

        // Track tokens
        const usage = response.usageMetadata;
        if (usage) {
          this.tokenUsage.inputTokens += usage.promptTokenCount || 0;
          this.tokenUsage.outputTokens += usage.candidatesTokenCount || 0;
          this.tokenUsage.totalTokens += (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
          this.tokenUsage.requestCount++;
        }

        // Check for function calls
        const candidate = response.candidates?.[0];
        if (!candidate) break;

        const functionCalls = candidate.content?.parts?.filter(p => "functionCall" in p) || [];

        if (functionCalls.length === 0) {
          // No tool calls — extract text and we're done
          const textParts = candidate.content?.parts?.filter(p => "text" in p) || [];
          fullText = textParts.map(p => (p as any).text).join("");
          if (fullText) this.emitStream(fullText);
          break;
        }

        // Process function calls
        const functionResponses: Part[] = [];
        for (const part of functionCalls) {
          const fc = (part as any).functionCall;
          console.log(`[gemini] Tool call: ${fc.name}`);
          this.emitStatus("tool_start");
          const toolResult = await this.handleToolCall(fc.name, fc.args || {});
          console.log(`[gemini] Tool ${fc.name}: ${toolResult.slice(0, 100)}`);
          this.emitStatus("tool_done");
          functionResponses.push({ functionResponse: { name: fc.name, response: { result: toolResult } } } as any);
        }

        // Send tool results back to Gemini
        await chat.sendMessage(functionResponses);

        // Get the follow-up response
        const followUp = await chat.sendMessage([]);
        const followUpCandidate = followUp.response.candidates?.[0];
        if (followUpCandidate) {
          const moreFunctionCalls = followUpCandidate.content?.parts?.filter(p => "functionCall" in p) || [];
          if (moreFunctionCalls.length > 0) continue; // More tool calls needed

          const textParts = followUpCandidate.content?.parts?.filter(p => "text" in p) || [];
          fullText = textParts.map(p => (p as any).text).join("");
          if (fullText) this.emitStream(fullText);
        }
        break;
      }

      // Store in history
      this.history.push({
        role: "model",
        parts: [{ text: fullText || "(tool execution completed)" }],
      });

      this.emitStatus("done");
      return fullText || "No response from Gemini.";
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[gemini] Error:", errMsg);

      this.history.pop();

      if (errMsg.includes("too long") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        this.history = this.history.slice(-10);
        console.log("[gemini] Trimmed history due to context length");
      }

      this.emitStatus("done");
      return `Gemini error: ${errMsg}`;
    }
  }

  clearHistory(): void {
    this.history = [];
  }

  getTokenUsage(): GeminiTokenUsage {
    return { ...this.tokenUsage };
  }

  resetTokenUsage(): void {
    this.tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 };
  }

  private getSystemPrompt(): string {
    const base = getGeminiContext() + `

### VERKTYG
Du har nu FULL tillgång till samma verktyg som Claude:
- **Datorer**: list_computers, run_on_computer, read_remote_file, write_remote_file, screenshot_computer, computer_system_info
- **Minne**: save_memory, search_memory, list_memories
- **Filsystem**: read_file, write_file, list_directory
- **Kommandon**: run_command
- **Webb**: web_search, fetch_url
- **Kunskapsbas**: rag_search, rag_list_sources

Använd verktygen aktivt! Du har fulla behörigheter på alla datorer.`;

    return this.systemPromptSuffix ? `${base}\n\n${this.systemPromptSuffix}` : base;
  }
}
