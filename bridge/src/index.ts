#!/usr/bin/env node
/**
 * Cascade Remote Bridge Server
 * 
 * Express + Socket.IO server that relays messages between
 * the MCP server (Cascade) and mobile/web clients.
 * Includes AI agent that auto-responds to mobile messages via Claude.
 */
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { Agent, getToolCategory } from "./agent.js";
import { getSecurityConfig, getAuditLog } from "./security.js";
import { listMemories, createMemory, updateMemory, deleteMemory } from "./memory.js";
import { ragListSources, ragStats, ragIndexText, ragIndexFile, ragDeleteSource } from "./rag.js";

const PORT = parseInt(process.env.PORT || "3031", 10);
const WORKSPACE_ROOT = process.env.CASCADE_REMOTE_WORKSPACE || join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "..");
const INBOX_FILE = join(WORKSPACE_ROOT, ".mobile-inbox");

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : "*"; // Allow all origins for LAN/mobile access

// In-memory state
interface Message {
  id: string;
  role: "cascade" | "user";
  content: string;
  timestamp: string;
  type: "message" | "notification" | "approval_request" | "approval_response";
}

interface PendingQuestion {
  id: string;
  question: string;
  resolve: (response: string) => void;
  timer: ReturnType<typeof setTimeout>;
}

const messages: Message[] = [];
const pendingQuestions: Map<string, PendingQuestion> = new Map();
let connectedClients = 0;
const sessionToken = uuidv4();
const agent = new Agent();

// Wire agent status events to Socket.IO
agent.onStatus((status) => {
  if ((status as any).type === "token_update") {
    io.emit("token_usage", agent.getTokenUsage());
    return;
  }
  const event = {
    ...status,
    category: status.type === "tool_start" || status.type === "tool_done"
      ? getToolCategory(status.tool)
      : status.type === "thinking" ? "thinking" : "idle",
    timestamp: new Date().toISOString(),
  };
  io.emit("agent_status", event);
});

function writeInbox(allMessages: Message[]) {
  try {
    const unread = allMessages.filter((m) => m.role === "user").slice(-20);
    if (unread.length === 0) return;
    const lines = unread
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.content}`)
      .join("\n");
    const header = `# Mobile Inbox (${unread.length} message${unread.length > 1 ? "s" : ""})\n# Last updated: ${new Date().toISOString()}\n\n`;
    writeFileSync(INBOX_FILE, header + lines + "\n", "utf-8");
    console.log(`[bridge] Wrote ${unread.length} message(s) to ${INBOX_FILE}`);
  } catch (err) {
    console.error("[bridge] Failed to write inbox file:", err);
  }
}

// Express setup
const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS === "*" ? true : ALLOWED_ORIGINS }));
app.use(express.json());

const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS === "*" ? true : ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
  },
});

// --- REST API (used by MCP server) ---

// Get connection status
app.get("/api/status", (_req, res) => {
  res.json({
    connected: connectedClients > 0,
    clientCount: connectedClients,
    messageCount: messages.length,
    sessionToken,
  });
});

// Send message from Cascade to mobile
app.post("/api/messages", (req, res) => {
  const { role, content, type } = req.body;
  const msg: Message = {
    id: uuidv4(),
    role: role || "cascade",
    content,
    type: type || "message",
    timestamp: new Date().toISOString(),
  };
  messages.push(msg);

  // Keep max 500 messages
  if (messages.length > 500) {
    messages.splice(0, messages.length - 500);
  }

  // Broadcast to all connected web/mobile clients
  io.emit("message", msg);
  res.json({ ok: true, id: msg.id });
});

// Get recent messages
app.get("/api/messages", (req, res) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const recent = messages.slice(-limit);
  res.json(recent);
});

// Ask mobile user a question (long-poll)
app.post("/api/ask", (req, res) => {
  const { question, timeout } = req.body;
  const timeoutMs = (timeout || 120) * 1000;
  const questionId = uuidv4();

  const msg: Message = {
    id: questionId,
    role: "cascade",
    content: question,
    type: "approval_request",
    timestamp: new Date().toISOString(),
  };
  messages.push(msg);
  io.emit("message", msg);
  io.emit("question", { id: questionId, question });

  const timer = setTimeout(() => {
    pendingQuestions.delete(questionId);
    res.json({ timeout: true, response: null });
  }, timeoutMs);

  pendingQuestions.set(questionId, {
    id: questionId,
    question,
    resolve: (response: string) => {
      clearTimeout(timer);
      pendingQuestions.delete(questionId);

      const responseMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: response,
        type: "approval_response",
        timestamp: new Date().toISOString(),
      };
      messages.push(responseMsg);
      io.emit("message", responseMsg);

      res.json({ timeout: false, response });
    },
    timer,
  });
});

// QR code endpoint for pairing
app.get("/api/qr", async (_req, res) => {
  try {
    // Generate QR with the bridge URL + session token
    const pairUrl = `http://localhost:${PORT}?token=${sessionToken}`;
    const qrDataUrl = await QRCode.toDataURL(pairUrl, { width: 300 });
    res.json({ qr: qrDataUrl, url: pairUrl, token: sessionToken });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

// --- Global Rules API ---
const GLOBAL_RULES_FILE = join(WORKSPACE_ROOT, "bridge", "data", "global-rules.md");

app.get("/api/global-rules", (_req, res) => {
  try {
    if (existsSync(GLOBAL_RULES_FILE)) {
      res.json({ rules: readFileSync(GLOBAL_RULES_FILE, "utf-8") });
    } else {
      res.json({ rules: "" });
    }
  } catch { res.json({ rules: "" }); }
});

app.put("/api/global-rules", (req, res) => {
  try {
    const dir = dirname(GLOBAL_RULES_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(GLOBAL_RULES_FILE, req.body.rules || "", "utf-8");
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// --- Memories API ---
app.get("/api/memories", (_req, res) => {
  res.json(listMemories());
});

app.post("/api/memories", (req, res) => {
  const { content, tags } = req.body;
  const mem = createMemory(content, tags || []);
  res.json(mem);
});

app.put("/api/memories/:id", (req, res) => {
  const { content, tags } = req.body;
  const mem = updateMemory(req.params.id, content, tags);
  if (mem) res.json(mem);
  else res.status(404).json({ error: "Not found" });
});

app.delete("/api/memories/:id", (req, res) => {
  const ok = deleteMemory(req.params.id);
  res.json({ ok });
});

// --- Security & Tools API ---
app.get("/api/security", (_req, res) => {
  res.json(getSecurityConfig());
});

app.get("/api/audit", (req, res) => {
  const lines = parseInt(req.query.lines as string, 10) || 50;
  res.json({ log: getAuditLog(lines) });
});

app.get("/api/tools", (_req, res) => {
  res.json({
    web: ["web_search", "fetch_url", "http_request", "download_file"],
    code: ["run_javascript", "run_command"],
    desktop: ["take_screenshot", "desktop_action", "mouse_click", "type_text", "press_key", "focus_window", "list_windows"],
    filesystem: ["read_file", "write_file", "list_directory", "search_files", "file_info"],
    process: ["list_processes", "kill_process", "system_info", "network_info"],
    memory: ["save_memory", "search_memory", "list_memories", "update_memory", "delete_memory"],
    security: ["view_audit_log", "view_security_config"],
  });
});

app.get("/api/tokens", (_req, res) => {
  res.json(agent.getTokenUsage());
});

// --- RAG API ---
app.get("/api/rag/sources", (_req, res) => {
  res.json(ragListSources());
});

app.get("/api/rag/stats", (_req, res) => {
  res.json(ragStats());
});

app.post("/api/rag/index-text", (req, res) => {
  try {
    const src = ragIndexText(req.body.text, req.body.name);
    res.json(src);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.post("/api/rag/index-file", (req, res) => {
  try {
    const src = ragIndexFile(req.body.file_path);
    res.json(src);
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

app.delete("/api/rag/sources/:id", (req, res) => {
  const ok = ragDeleteSource(req.params.id);
  res.json({ ok });
});

// --- Socket.IO (used by web/mobile clients) ---

io.on("connection", (socket) => {
  connectedClients++;
  console.log(`[bridge] Client connected (${connectedClients} total)`);

  // Send recent messages on connect
  const recent = messages.slice(-50);
  socket.emit("history", recent);

  // Client sends a chat message
  socket.on("message", (data: { content: string }) => {
    const msg: Message = {
      id: uuidv4(),
      role: "user",
      content: data.content,
      type: "message",
      timestamp: new Date().toISOString(),
    };
    messages.push(msg);
    io.emit("message", msg);
    // Write to file so Cascade sees it immediately
    writeInbox(messages);

    // Auto-respond via AI agent
    if (agent.isEnabled()) {
      agent.respond(data.content).then((reply) => {
        const aiMsg: Message = {
          id: uuidv4(),
          role: "cascade",
          content: reply,
          type: "message",
          timestamp: new Date().toISOString(),
        };
        messages.push(aiMsg);
        io.emit("message", aiMsg);
        console.log(`[agent] Replied: "${reply.slice(0, 80)}..."`);
      }).catch((err) => {
        console.error("[agent] Failed to respond:", err);
      });
    }
  });

  // Client responds to a question
  socket.on("answer", (data: { questionId: string; response: string }) => {
    const pending = pendingQuestions.get(data.questionId);
    if (pending) {
      pending.resolve(data.response);
    }
  });

  socket.on("disconnect", () => {
    connectedClients--;
    console.log(`[bridge] Client disconnected (${connectedClients} total)`);
  });
});

// --- Serve web client (built PWA) ---
const WEB_DIST = join(WORKSPACE_ROOT, "web", "dist");
if (existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  app.get("*", (_req, res) => {
    const indexPath = join(WEB_DIST, "index.html");
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not found");
    }
  });
  console.log(`[bridge] Serving web client from ${WEB_DIST}`);
}

// --- Start ---

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[bridge] Cascade Remote Bridge running on http://0.0.0.0:${PORT}`);
  console.log(`[bridge] Session token: ${sessionToken}`);
  console.log(`[bridge] Waiting for mobile/web clients...`);
});
