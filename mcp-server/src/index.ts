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

async function main() {
  // Start 24/7 Socket.IO listener to bridge
  connectToBridge();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[cascade-remote] MCP server started on stdio");
  console.error(`[cascade-remote] Inbox file: ${INBOX_FILE}`);
}

main().catch((error) => {
  console.error("[cascade-remote] Fatal error:", error);
  process.exit(1);
});
