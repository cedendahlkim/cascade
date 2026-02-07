/**
 * Gemini AI Agent for Cascade Remote Bridge
 * 
 * Provides a second AI chat using Google's Gemini API.
 * Runs independently alongside the Claude agent.
 */
import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";

export type GeminiStreamCallback = (chunk: string) => void;
export type GeminiStatusCallback = (status: { type: string }) => void;

export interface GeminiTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
}

export class GeminiAgent {
  private client: GoogleGenerativeAI | null = null;
  private history: Content[] = [];
  private model: string;
  private enabled: boolean;
  private streamCallback: GeminiStreamCallback | null = null;
  private statusCallback: GeminiStatusCallback | null = null;
  private tokenUsage: GeminiTokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 };

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    this.enabled = !!apiKey;

    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
      console.log(`[gemini] Initialized with model: ${this.model}`);
    } else {
      console.log("[gemini] No GEMINI_API_KEY set - Gemini agent disabled");
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

  async respond(userMessage: string): Promise<string> {
    if (!this.client) {
      return "Gemini agent not configured. Set GEMINI_API_KEY in bridge/.env";
    }

    this.emitStatus("thinking");

    this.history.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    // Keep history manageable
    if (this.history.length > 40) {
      this.history = this.history.slice(-40);
    }

    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        systemInstruction: this.getSystemPrompt(),
      });

      const chat = model.startChat({
        history: this.history.slice(0, -1), // all except last (we send it as the new message)
      });

      // Stream the response
      const result = await chat.sendMessageStream(userMessage);

      let fullText = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          this.emitStream(fullText);
        }
      }

      // Get final response for token counting
      const response = await result.response;
      const usage = response.usageMetadata;
      if (usage) {
        this.tokenUsage.inputTokens += usage.promptTokenCount || 0;
        this.tokenUsage.outputTokens += usage.candidatesTokenCount || 0;
        this.tokenUsage.totalTokens += (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
        this.tokenUsage.requestCount++;
      }

      // Store assistant response in history
      this.history.push({
        role: "model",
        parts: [{ text: fullText }],
      });

      this.emitStatus("done");
      return fullText || "No response from Gemini.";
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("[gemini] Error:", errMsg);

      // Remove the failed user message from history
      this.history.pop();

      // If context too long, trim and retry
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
    return `You are Gemini, an AI assistant running alongside Claude in the Cascade Remote app.
You help the user with questions, coding, analysis, brainstorming, and general tasks.
Keep responses concise and mobile-friendly.
Respond in the same language the user writes in.
You can use markdown formatting including code blocks, lists, and headers.
Be helpful, direct, and honest. If you don't know something, say so.`;
  }
}
