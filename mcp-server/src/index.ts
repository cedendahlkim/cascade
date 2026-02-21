#!/usr/bin/env node
/**
 * Cascade Remote MCP Server
 * 
 * Provides tools for Cascade to communicate with mobile/web clients
 * via the bridge server. Runs as stdio MCP transport.
 * 
 * Also connects to bridge via Socket.IO to listen for mobile messages
 * 24/7 and writes them to .mobile-inbox in the workspace.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { io as ioClient } from "socket.io-client";
import { writeFileSync } from "fs";
import { join, dirname } from "path";

const BRIDGE_URL = process.env.CASCADE_REMOTE_BRIDGE_URL || "http://localhost:3031";
const WORKSPACE_ROOT = process.env.CASCADE_REMOTE_WORKSPACE || join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "..");
const INBOX_FILE = join(WORKSPACE_ROOT, ".mobile-inbox");

interface SessionMessage {
  id: string;
  role: "cascade" | "user";
  content: string;
  timestamp: string;
  type: "message" | "notification" | "approval_request" | "approval_response";
}

// --- 24/7 Socket.IO listener ---
const unreadMessages: SessionMessage[] = [];

function connectToBridge() {
  const socket = ioClient(BRIDGE_URL, { transports: ["websocket", "polling"] });

  socket.on("connect", () => {
    console.error("[cascade-remote] Connected to bridge via Socket.IO");
  });

  socket.on("message", (msg: SessionMessage) => {
    if (msg.role === "user") {
      unreadMessages.push(msg);
      writeInboxFile();
      console.error(`[cascade-remote] New mobile message: "${msg.content}"`);
    }
  });

  socket.on("disconnect", () => {
    console.error("[cascade-remote] Disconnected from bridge, will reconnect...");
  });

  socket.on("connect_error", (err: Error) => {
    console.error(`[cascade-remote] Bridge connection error: ${err.message}`);
  });
}

function writeInboxFile() {
  try {
    const msgs = unreadMessages.slice(-30);
    const lines = msgs
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.content}`)
      .join("\n");
    const header = `# Mobile Inbox (${msgs.length} unread message${msgs.length !== 1 ? "s" : ""})\n# Last updated: ${new Date().toISOString()}\n# This file is auto-updated when you send messages from your phone.\n\n`;
    writeFileSync(INBOX_FILE, header + lines + "\n", "utf-8");
  } catch (err) {
    console.error("[cascade-remote] Failed to write inbox:", err);
  }
}

async function bridgeFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${BRIDGE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

const server = new McpServer({
  name: "cascade-remote",
  version: "0.1.0",
});

// Tool: Send a message/notification to the mobile client
server.tool(
  "send_to_mobile",
  "Send a message or notification to the connected mobile/web client",
  {
    message: z.string().describe("The message content to send"),
    type: z.enum(["message", "notification"]).default("message").describe("Type of message"),
  },
  async ({ message, type }) => {
    try {
      const res = await bridgeFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          role: "cascade",
          content: message,
          type: type || "message",
        }),
      });

      if (!res.ok) {
        return { content: [{ type: "text", text: `Failed to send: ${res.statusText}` }] };
      }

      return {
        content: [{ type: "text", text: `Message sent to mobile client: "${message}"` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Bridge server not reachable at ${BRIDGE_URL}. Is it running?` }],
      };
    }
  }
);

// Tool: Read messages from the mobile client
server.tool(
  "read_mobile_messages",
  "Read recent messages from the mobile/web client",
  {
    limit: z.number().default(10).describe("Number of recent messages to retrieve"),
  },
  async ({ limit }) => {
    try {
      const res = await bridgeFetch(`/api/messages?limit=${limit}`);

      if (!res.ok) {
        return { content: [{ type: "text", text: `Failed to read: ${res.statusText}` }] };
      }

      const messages: SessionMessage[] = await res.json();

      if (messages.length === 0) {
        return { content: [{ type: "text", text: "No messages from mobile client yet." }] };
      }

      const formatted = messages
        .map((m) => `[${m.timestamp}] ${m.role}: ${m.content}`)
        .join("\n");

      return { content: [{ type: "text", text: formatted }] };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Bridge server not reachable at ${BRIDGE_URL}. Is it running?` }],
      };
    }
  }
);

// Tool: Ask the mobile user for input and wait for response
server.tool(
  "ask_mobile",
  "Ask the mobile/web user a question and wait for their response",
  {
    question: z.string().describe("The question to ask the mobile user"),
    timeout_seconds: z.number().default(120).describe("How long to wait for a response (seconds)"),
  },
  async ({ question, timeout_seconds }) => {
    try {
      const res = await bridgeFetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ question, timeout: timeout_seconds }),
      });

      if (!res.ok) {
        return { content: [{ type: "text", text: `Failed to ask: ${res.statusText}` }] };
      }

      const data = await res.json();

      if (data.timeout) {
        return { content: [{ type: "text", text: "Mobile user did not respond in time." }] };
      }

      return {
        content: [{ type: "text", text: `Mobile user responded: "${data.response}"` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Bridge server not reachable at ${BRIDGE_URL}. Is it running?` }],
      };
    }
  }
);

// Tool: Check mobile client connection status
server.tool(
  "mobile_status",
  "Check if a mobile/web client is currently connected",
  {},
  async () => {
    try {
      const res = await bridgeFetch("/api/status");
      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: data.connected
              ? `Mobile client connected. ${data.clientCount} client(s) online.`
              : "No mobile client connected.",
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Bridge server not reachable at ${BRIDGE_URL}. Is it running?` }],
      };
    }
  }
);

// Tool: Check unread messages (collected by the 24/7 Socket.IO listener)
server.tool(
  "check_unread",
  "Check for unread messages from the mobile client (collected in real-time via Socket.IO)",
  {
    clear: z.boolean().default(false).describe("Clear unread messages after reading"),
  },
  async ({ clear }) => {
    if (unreadMessages.length === 0) {
      return { content: [{ type: "text", text: "No unread mobile messages." }] };
    }

    const formatted = unreadMessages
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.content}`)
      .join("\n");

    const count = unreadMessages.length;
    if (clear) {
      unreadMessages.length = 0;
      writeInboxFile();
    }

    return {
      content: [{ type: "text", text: `${count} unread message(s):\n${formatted}` }],
    };
  }
);

// ═══════════════════════════════════════════════════════════════
// ── Frankenstein AI Tools ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

// Tool: Chat with Frankenstein AI
server.tool(
  "frank_chat",
  "Send a message to Frankenstein AI and get a response. Frankenstein is Kim's personal AI assistant with access to tools, knowledge base, and trading capabilities. Use this to ask Frankenstein questions, give instructions, or have conversations.",
  {
    message: z.string().describe("The message to send to Frankenstein AI"),
  },
  async ({ message }) => {
    try {
      // Send via Socket.IO for streaming, but use a Promise to wait for the full response
      const res = await bridgeFetch("/api/frankenstein/chat/messages", { method: "GET" });
      const prevMessages = res.ok ? (await res.json() as any[]) : [];
      const prevCount = prevMessages.length;

      // Send the message via Socket.IO
      const socket = ioClient(BRIDGE_URL, { transports: ["websocket", "polling"], forceNew: true });

      return new Promise((resolve) => {
        let responded = false;
        const timeout = setTimeout(() => {
          if (!responded) {
            responded = true;
            socket.disconnect();
            resolve({ content: [{ type: "text", text: "Frankenstein did not respond within 120 seconds." }] });
          }
        }, 120_000);

        socket.on("connect", () => {
          socket.emit("frank_message", { content: message });
        });

        // Listen for the AI response
        socket.on("frank_message", (msg: any) => {
          if (msg.role === "cascade" && !responded) {
            responded = true;
            clearTimeout(timeout);
            socket.disconnect();
            resolve({ content: [{ type: "text", text: msg.content }] });
          }
        });

        socket.on("connect_error", (err: Error) => {
          if (!responded) {
            responded = true;
            clearTimeout(timeout);
            resolve({ content: [{ type: "text", text: `Bridge not reachable: ${err.message}` }] });
          }
        });
      });
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
    }
  }
);

// Tool: Get Frankenstein status
server.tool(
  "frank_status",
  "Get Frankenstein AI's current status including cognitive state, token usage, model info, and wellbeing",
  {},
  async () => {
    try {
      const [statusRes, wellbeingRes] = await Promise.all([
        bridgeFetch("/api/frankenstein/chat/status"),
        bridgeFetch("/api/frankenstein/wellbeing").catch(() => null),
      ]);

      if (!statusRes.ok) {
        return { content: [{ type: "text", text: `Failed to get status: ${statusRes.statusText}` }] };
      }

      const status = await statusRes.json();
      const wellbeing = wellbeingRes?.ok ? await wellbeingRes.json() : null;

      let text = `## Frankenstein AI Status\n`;
      text += `- **Enabled:** ${status.enabled}\n`;
      text += `- **Model:** ${status.model}\n`;
      text += `- **Tokens:** ${status.tokens?.totalTokens ?? 0} total (${status.tokens?.requestCount ?? 0} requests)\n`;

      if (status.cognitive) {
        const c = status.cognitive;
        text += `\n### Cognitive State\n`;
        text += `- Emotion: ${c.emotion}${c.secondaryEmotion ? ` / ${c.secondaryEmotion}` : ""} (intensity: ${c.emotionIntensity})\n`;
        text += `- Confidence: ${c.confidence}, Curiosity: ${c.curiosity}, Fatigue: ${c.fatigue}\n`;
        if (c.recentInsight) text += `- Recent insight: ${c.recentInsight}\n`;
      }

      if (wellbeing) {
        text += `\n### Wellbeing\n`;
        text += `- Overall: ${wellbeing.overall}/1.0 ${wellbeing.moodEmoji} ${wellbeing.mood}\n`;
        text += `- ${wellbeing.description}\n`;
      }

      return { content: [{ type: "text", text }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Get Frankenstein chat history
server.tool(
  "frank_history",
  "Get recent Frankenstein AI chat messages",
  {
    limit: z.number().default(20).describe("Number of recent messages to retrieve"),
  },
  async ({ limit }) => {
    try {
      const res = await bridgeFetch(`/api/frankenstein/chat/messages?limit=${limit}`);
      if (!res.ok) return { content: [{ type: "text", text: `Failed: ${res.statusText}` }] };

      const messages = await res.json() as any[];
      if (messages.length === 0) return { content: [{ type: "text", text: "No chat history." }] };

      const formatted = messages.map((m: any) =>
        `[${new Date(m.timestamp).toLocaleString("sv-SE")}] **${m.role === "user" ? "Kim" : "Frank"}:** ${m.content.slice(0, 500)}${m.content.length > 500 ? "..." : ""}`
      ).join("\n\n");

      return { content: [{ type: "text", text: formatted }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Clear Frankenstein chat
server.tool(
  "frank_clear",
  "Clear Frankenstein AI chat history and start a new conversation",
  {},
  async () => {
    try {
      const res = await bridgeFetch("/api/frankenstein/chat/sessions/new", { method: "POST" });
      if (!res.ok) return { content: [{ type: "text", text: `Failed: ${res.statusText}` }] };
      const data = await res.json();
      return { content: [{ type: "text", text: `New session started: ${data.sessionId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Get trading bot status
server.tool(
  "trader_status",
  "Get the current status of the Frankenstein trading bot (running, positions, equity, signals)",
  {},
  async () => {
    try {
      const [statusRes, stateRes, liveRes] = await Promise.all([
        bridgeFetch("/api/trader/status"),
        bridgeFetch("/api/trader/state"),
        bridgeFetch("/api/trader/live?limit=10"),
      ]);

      const status = statusRes.ok ? await statusRes.json() : {};
      const stateData = stateRes.ok ? await stateRes.json() : {};
      const live = liveRes.ok ? await liveRes.json() : {};

      const state = stateData?.state;
      let text = `## Trading Bot Status\n`;
      text += `- **Running:** ${status.running ? "Yes" : "No"}\n`;
      text += `- **PID:** ${status.pid || "—"}\n`;

      if (state) {
        text += `- **Total USD:** $${state.total_usd || 0}\n`;
        text += `- **Cash:** $${state.usdt_cash || 0}\n`;
        text += `- **Tick count:** ${state.tick_count || 0}\n`;
        text += `- **Last tick:** ${state.last_tick_at || "—"}\n`;
        text += `- **Strategy:** ${state.strategy || "inference"}\n`;

        const positions = state.positions || {};
        const posCount = Object.keys(positions).length;
        text += `- **Positions:** ${posCount}\n`;
        if (posCount > 0) {
          text += `\n### Open Positions\n`;
          for (const [sym, p] of Object.entries(positions) as [string, any][]) {
            text += `- ${sym}: qty ${p.quantity}, avg ${p.avg_entry ?? "—"}, value $${p.value_usd ?? "—"}, unrealized ${typeof p.unrealized_pct === "number" ? p.unrealized_pct.toFixed(2) + "%" : "—"}\n`;
          }
        }
      }

      if (live?.events?.length > 0) {
        text += `\n### Recent Events (${live.events.length})\n`;
        for (const ev of live.events.slice(-5)) {
          text += `- [${ev.ts ? new Date(ev.ts).toLocaleTimeString("sv-SE") : "—"}] ${ev.type || "event"} ${ev.symbol || ""}\n`;
        }
      }

      return { content: [{ type: "text", text }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Start trading bot
server.tool(
  "trader_start",
  "Start the Frankenstein trading bot with specified parameters",
  {
    exchange: z.enum(["kraken", "binance"]).default("kraken").describe("Exchange to trade on"),
    symbols: z.string().default("XBTUSDT,ETHUSDT").describe("Comma-separated trading symbols"),
    paper_mode: z.boolean().default(true).describe("Paper trading mode (recommended)"),
    interval_seconds: z.number().default(30).describe("Trading interval in seconds"),
    risk_per_trade: z.number().default(0.02).describe("Risk per trade (0.02 = 2%)"),
    strategy: z.enum(["inference", "grid"]).default("inference").describe("Trading strategy"),
  },
  async ({ exchange, symbols, paper_mode, interval_seconds, risk_per_trade, strategy }) => {
    try {
      const res = await bridgeFetch("/api/trader/start", {
        method: "POST",
        body: JSON.stringify({
          exchange,
          symbols,
          paperMode: paper_mode,
          intervalSeconds: interval_seconds,
          riskPerTrade: risk_per_trade,
          strategy,
        }),
      });

      const data = await res.json();
      if (!res.ok) return { content: [{ type: "text", text: `Failed to start: ${data.error || res.statusText}` }] };
      return { content: [{ type: "text", text: `Trading bot started! PID: ${data.pid}, Strategy: ${strategy}, Exchange: ${exchange}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Stop trading bot
server.tool(
  "trader_stop",
  "Stop the running Frankenstein trading bot",
  {},
  async () => {
    try {
      const res = await bridgeFetch("/api/trader/stop", { method: "POST" });
      const data = await res.json();
      return { content: [{ type: "text", text: data.status === "stopped" ? "Trading bot stopped." : "Trading bot was not running." }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Get recent trades
server.tool(
  "trader_trades",
  "Get recent trades from the trading bot",
  {
    limit: z.number().default(20).describe("Number of recent trades to retrieve"),
  },
  async ({ limit }) => {
    try {
      const res = await bridgeFetch(`/api/trader/trades?limit=${limit}`);
      if (!res.ok) return { content: [{ type: "text", text: `Failed: ${res.statusText}` }] };

      const data = await res.json();
      const trades = data.trades || data || [];
      if (trades.length === 0) return { content: [{ type: "text", text: "No trades recorded yet." }] };

      const formatted = trades.slice(-limit).map((t: any) => {
        const sig = t.signal || {};
        const ord = t.order || {};
        return `[${sig.timestamp ? new Date(sig.timestamp).toLocaleString("sv-SE") : "—"}] ${sig.symbol || "?"} ${sig.action || "?"} conf:${sig.confidence ? Math.round(sig.confidence * 100) + "%" : "—"} realized:${typeof ord.realized_pct === "number" ? ord.realized_pct.toFixed(2) + "%" : "—"}`;
      }).join("\n");

      return { content: [{ type: "text", text: `## Recent Trades (${trades.length})\n${formatted}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Get trader log
server.tool(
  "trader_log",
  "Get recent log output from the trading bot",
  {
    lines: z.number().default(50).describe("Number of log lines to retrieve"),
  },
  async ({ lines }) => {
    try {
      const res = await bridgeFetch(`/api/trader/log?lines=${lines}`);
      if (!res.ok) return { content: [{ type: "text", text: `Failed: ${res.statusText}` }] };
      const data = await res.json();
      const logLines = data.lines || [];
      if (logLines.length === 0) return { content: [{ type: "text", text: "No log output." }] };
      return { content: [{ type: "text", text: logLines.join("\n") }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Search knowledge base (Archon RAG)
server.tool(
  "knowledge_search",
  "Search the Frankenstein knowledge base (Archon RAG) for relevant information. Uses vector similarity search.",
  {
    query: z.string().describe("Search query"),
    limit: z.number().default(5).describe("Number of results"),
  },
  async ({ query, limit }) => {
    try {
      const res = await bridgeFetch("/api/archon/search", {
        method: "POST",
        body: JSON.stringify({ query, limit }),
      });
      if (!res.ok) return { content: [{ type: "text", text: `Failed: ${res.statusText}` }] };

      const data = await res.json();
      const results = data.results || data || [];
      if (results.length === 0) return { content: [{ type: "text", text: "No results found." }] };

      const formatted = results.map((r: any, i: number) =>
        `### ${i + 1}. ${r.title || "Untitled"} (score: ${r.similarity?.toFixed(3) || "—"})\n${(r.content || "").slice(0, 400)}${(r.content || "").length > 400 ? "..." : ""}`
      ).join("\n\n");

      return { content: [{ type: "text", text: `## Knowledge Base Results\n\n${formatted}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable or Archon not configured at ${BRIDGE_URL}` }] };
    }
  }
);

// Tool: Bridge health check
server.tool(
  "bridge_health",
  "Check the health of the Gracestack bridge server and all connected services",
  {},
  async () => {
    try {
      const [healthRes, readyRes] = await Promise.all([
        bridgeFetch("/healthz").catch(() => null),
        bridgeFetch("/readyz").catch(() => null),
      ]);

      let text = `## Bridge Health\n`;
      text += `- **URL:** ${BRIDGE_URL}\n`;
      text += `- **Health:** ${healthRes?.ok ? "✅ OK" : "❌ Unreachable"}\n`;
      text += `- **Ready:** ${readyRes?.ok ? "✅ OK" : "❌ Not ready"}\n`;

      if (healthRes?.ok) {
        try {
          const data = await healthRes.json();
          text += `- **Uptime:** ${data.uptime ? Math.round(data.uptime) + "s" : "—"}\n`;
        } catch { /* ok */ }
      }

      return { content: [{ type: "text", text }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Bridge not reachable at ${BRIDGE_URL}` }] };
    }
  }
);

async function main() {
  // Start 24/7 Socket.IO listener to bridge
  connectToBridge();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[cascade-remote] MCP server started on stdio");
  console.error(`[cascade-remote] Bridge URL: ${BRIDGE_URL}`);
  console.error(`[cascade-remote] Inbox file: ${INBOX_FILE}`);
  console.error("[cascade-remote] Frankenstein AI tools: frank_chat, frank_status, frank_history, frank_clear");
  console.error("[cascade-remote] Trading tools: trader_status, trader_start, trader_stop, trader_trades, trader_log");
  console.error("[cascade-remote] Knowledge tools: knowledge_search");
}

main().catch((error) => {
  console.error("[cascade-remote] Fatal error:", error);
  process.exit(1);
});
