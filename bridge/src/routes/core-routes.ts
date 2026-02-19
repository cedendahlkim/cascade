import { Router } from "express";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import type { Server as SocketIOServer } from "socket.io";

export interface CoreMessage {
  id: string;
  role: "cascade" | "user";
  content: string;
  timestamp: string;
  type: "message" | "notification" | "approval_request" | "approval_response";
}

export interface PendingQuestion {
  id: string;
  question: string;
  resolve: (response: string) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface CoreRoutesOptions {
  io: SocketIOServer;
  port: number;
  connectedClients: () => number;
  messages: CoreMessage[];
  pendingQuestions: Map<string, PendingQuestion>;
  sessionToken: string;
  saveMessages: (messages: CoreMessage[]) => void;
  clearAgentHistory: () => void;
}

export function createCoreRoutes(options: CoreRoutesOptions): Router {
  const router = Router();

  router.get("/status", (_req, res) => {
    res.json({
      connected: options.connectedClients() > 0,
      clientCount: options.connectedClients(),
      messageCount: options.messages.length,
      sessionToken: options.sessionToken,
    });
  });

  router.post("/messages", (req, res) => {
    const { role, content, type } = req.body;
    const msg: CoreMessage = {
      id: uuidv4(),
      role: role || "cascade",
      content,
      type: type || "message",
      timestamp: new Date().toISOString(),
    };
    options.messages.push(msg);

    if (options.messages.length > 500) {
      options.messages.splice(0, options.messages.length - 500);
    }

    options.io.emit("message", msg);
    res.json({ ok: true, id: msg.id });
  });

  router.get("/messages", (req, res) => {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const recent = options.messages.slice(-limit);
    res.json(recent);
  });

  router.delete("/messages", (_req, res) => {
    options.messages.length = 0;
    options.clearAgentHistory();
    options.saveMessages(options.messages);
    options.io.emit("history", []);
    res.json({ ok: true });
  });

  router.post("/ask", (req, res) => {
    const { question, timeout } = req.body;
    const timeoutMs = (timeout || 120) * 1000;
    const questionId = uuidv4();

    const msg: CoreMessage = {
      id: questionId,
      role: "cascade",
      content: question,
      type: "approval_request",
      timestamp: new Date().toISOString(),
    };

    options.messages.push(msg);
    options.io.emit("message", msg);
    options.io.emit("question", { id: questionId, question });

    const timer = setTimeout(() => {
      options.pendingQuestions.delete(questionId);
      res.json({ timeout: true, response: null });
    }, timeoutMs);

    options.pendingQuestions.set(questionId, {
      id: questionId,
      question,
      resolve: (response: string) => {
        clearTimeout(timer);
        options.pendingQuestions.delete(questionId);

        const responseMsg: CoreMessage = {
          id: uuidv4(),
          role: "user",
          content: response,
          type: "approval_response",
          timestamp: new Date().toISOString(),
        };

        options.messages.push(responseMsg);
        options.io.emit("message", responseMsg);

        res.json({ timeout: false, response });
      },
      timer,
    });
  });

  router.get("/qr", async (_req, res) => {
    try {
      const pairUrl = `http://localhost:${options.port}?token=${options.sessionToken}`;
      const qrDataUrl = await QRCode.toDataURL(pairUrl, { width: 300 });
      res.json({ qr: qrDataUrl, url: pairUrl, token: options.sessionToken });
    } catch {
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  return router;
}
