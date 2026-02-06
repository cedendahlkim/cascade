/**
 * Cascade Remote SDK Client
 * 
 * Usage:
 *   import { CascadeClient } from "./cascade-client";
 *   const ai = new CascadeClient("https://your-tunnel.trycloudflare.com", "your-api-key");
 *   const result = await ai.generateCode("Create a REST API with Express");
 *   console.log(result.response);
 */

export interface CascadeResponse {
  id: string;
  task: string;
  response: string;
  usage: { input_tokens: number; output_tokens: number };
  model: string;
  duration_ms: number;
}

export interface CascadeStatus {
  status: string;
  model: string;
  auth_required: boolean;
  endpoints: string[];
  metrics: {
    total_requests: number;
    total_tokens: number;
    avg_duration_ms: number;
    by_endpoint: Record<string, number>;
  };
}

export class CascadeClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey || "";
  }

  private async request(endpoint: string, body?: Record<string, unknown>): Promise<CascadeResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const resp = await fetch(`${this.baseUrl}/cascade/${endpoint}`, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    return data as CascadeResponse;
  }

  /** General AI chat */
  async chat(prompt: string, options?: { max_tokens?: number }): Promise<CascadeResponse> {
    return this.request("chat", { prompt, ...options });
  }

  /** Generate code from requirements */
  async generateCode(prompt: string, language?: string, options?: { max_tokens?: number }): Promise<CascadeResponse> {
    return this.request("code", { prompt, language, ...options });
  }

  /** Analyze code quality and issues */
  async analyzeCode(code: string, prompt?: string): Promise<CascadeResponse> {
    return this.request("analyze", { code, prompt });
  }

  /** Refactor code for better quality */
  async refactorCode(code: string, language?: string, prompt?: string): Promise<CascadeResponse> {
    return this.request("refactor", { code, language, prompt });
  }

  /** Code review (returns verdict: APPROVE/REQUEST_CHANGES/COMMENT) */
  async reviewCode(code: string, context?: string): Promise<CascadeResponse> {
    return this.request("review", { code, context });
  }

  /** Explain what code does */
  async explainCode(code: string): Promise<CascadeResponse> {
    return this.request("explain", { code });
  }

  /** Generate tests for code */
  async generateTests(code: string, language?: string): Promise<CascadeResponse> {
    return this.request("test", { code, language });
  }

  /** Send webhook event */
  async webhook(source: string, event: string, data: Record<string, unknown>): Promise<CascadeResponse> {
    return this.request("webhook", { source, event, data });
  }

  /** Get API status and metrics */
  async status(): Promise<CascadeStatus> {
    const resp = await fetch(`${this.baseUrl}/cascade/status`, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
    return resp.json() as Promise<CascadeStatus>;
  }
}

export default CascadeClient;
