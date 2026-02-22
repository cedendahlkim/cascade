import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Send, Loader2, RefreshCw, Zap, Brain, Shield, Globe, Terminal,
  MessageSquare, Settings, ChevronDown, ChevronUp, Copy, Check,
  Wifi, WifiOff, Code, Search, Eye, Database, TrendingUp,
  FileText, Bot, Sparkles, Activity, Server, Lock, Image,
  Mic, MicOff, Camera, Plus, Trash2, X, PanelLeftOpen,
  FolderSearch, Wrench, ArrowRight, Volume2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { io, Socket } from "socket.io-client";
import { BRIDGE_URL } from "../config";

// ─── Types ───────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  images?: string[]; // base64 data URIs
  toolCalls?: { name: string; result?: string }[];
}

interface ToolStatus {
  type: "thinking" | "tool_start" | "tool_done" | "done";
  tool?: string;
  input?: string;
  category?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
  preview: string;
}

// ─── Constants ───────────────────────────────────────────────────────
const REMARK_PLUGINS = [remarkGfm];

const TOOL_CATEGORIES: Record<string, { icon: typeof Brain; label: string; color: string; bg: string }> = {
  thinking:   { icon: Brain,       label: "Tänker",        color: "text-purple-400", bg: "bg-purple-950/60 border-purple-800/40" },
  memory:     { icon: Sparkles,    label: "Minne",         color: "text-amber-400",  bg: "bg-amber-950/60 border-amber-800/40" },
  filesystem: { icon: FolderSearch, label: "Filer",        color: "text-blue-400",   bg: "bg-blue-950/60 border-blue-800/40" },
  command:    { icon: Terminal,    label: "Kommando",      color: "text-emerald-400", bg: "bg-emerald-950/60 border-emerald-800/40" },
  web:        { icon: Globe,       label: "Webb",          color: "text-green-400",  bg: "bg-green-950/60 border-green-800/40" },
  security:   { icon: Shield,     label: "Säkerhet",      color: "text-yellow-400", bg: "bg-yellow-950/60 border-yellow-800/40" },
  desktop:    { icon: Eye,        label: "Skärm",         color: "text-cyan-400",   bg: "bg-cyan-950/60 border-cyan-800/40" },
  knowledge:  { icon: Database,   label: "Kunskapsbas",   color: "text-indigo-400", bg: "bg-indigo-950/60 border-indigo-800/40" },
  search:     { icon: Search,     label: "Söker",         color: "text-pink-400",   bg: "bg-pink-950/60 border-pink-800/40" },
};

const QUICK_ACTIONS = [
  { icon: Camera,     label: "Screenshot",  msg: "Ta en screenshot och beskriv vad du ser",     color: "text-cyan-400 bg-cyan-950/40 border-cyan-800/30" },
  { icon: Terminal,   label: "System",      msg: "Visa systeminfo: CPU, RAM, disk, nätverk",    color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/30" },
  { icon: Shield,     label: "Säkerhet",    msg: "Kör en snabb säkerhetsskanning",              color: "text-yellow-400 bg-yellow-950/40 border-yellow-800/30" },
  { icon: Search,     label: "Sök",         msg: "",                                             color: "text-pink-400 bg-pink-950/40 border-pink-800/30" },
  { icon: Brain,      label: "Minnen",      msg: "Lista alla sparade minnen",                   color: "text-purple-400 bg-purple-950/40 border-purple-800/30" },
  { icon: Code,       label: "Kod",         msg: "",                                             color: "text-blue-400 bg-blue-950/40 border-blue-800/30" },
  { icon: FolderSearch, label: "Filer",     msg: "Lista filerna i projektets rot-mapp",          color: "text-indigo-400 bg-indigo-950/40 border-indigo-800/30" },
  { icon: Globe,      label: "Webb",        msg: "",                                             color: "text-green-400 bg-green-950/40 border-green-800/30" },
];

const SUGGESTIONS = [
  { icon: "🔍", text: "Analysera säkerheten på min server" },
  { icon: "💻", text: "Hjälp mig skriva en Python-funktion" },
  { icon: "🧠", text: "Vad kan du hjälpa mig med?" },
  { icon: "📊", text: "Ge mig en översikt av systemet" },
  { icon: "🌐", text: "Sök på nätet efter de senaste AI-nyheterna" },
  { icon: "🔐", text: "Kör en penetrationstest mot min webbapp" },
];

// ─── Markdown components ─────────────────────────────────────────────
const streamingCode: Record<string, any> = {
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    if (match) {
      return (
        <pre className="bg-slate-900 rounded-lg p-3 overflow-x-auto my-1">
          <code className="text-xs text-slate-300 font-mono" {...props}>{code}</code>
        </pre>
      );
    }
    return <code className="bg-slate-700/60 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
  },
};

const fullCode: Record<string, any> = {
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");
    if (match) {
      return (
        <div className="relative group">
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="absolute right-2 top-2 p-1 rounded bg-slate-700/80 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            title="Kopiera"
          >
            <Copy className="w-3 h-3" />
          </button>
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: "0.5rem", fontSize: "0.75rem" }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }
    return <code className="bg-slate-700/60 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
  },
};

function cleanStreamingText(text: string): string {
  const fences = text.match(/^```/gm);
  if (fences && fences.length % 2 !== 0) {
    const lastFence = text.lastIndexOf("```");
    return text.slice(0, lastFence);
  }
  return text;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Component ───────────────────────────────────────────────────────
export default function OpenClawView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<ToolStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try { return JSON.parse(localStorage.getItem("oc_conversations") || "[]"); } catch { return []; }
  });
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [tokens, setTokens] = useState({ inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 });
  const [copied, setCopied] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist conversations
  useEffect(() => {
    localStorage.setItem("oc_conversations", JSON.stringify(conversations));
  }, [conversations]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText, isThinking]);

  // Socket connection
  useEffect(() => {
    const socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Gemini events (OpenClaw uses the Gemini agent)
    socket.on("gemini_history", (history: any[]) => {
      setMessages(history.map(m => ({
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
        timestamp: m.timestamp,
      })));
    });

    socket.on("gemini_message", (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, {
          id: msg.id,
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
          timestamp: msg.timestamp,
        }];
      });
      setIsThinking(false);
      setStreamText(null);
      setToolStatus(null);
    });

    socket.on("gemini_stream", (chunk: string) => {
      setStreamText(chunk);
    });

    socket.on("gemini_status", (status: ToolStatus) => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      if (status.type === "done") {
        statusTimeoutRef.current = setTimeout(() => {
          setToolStatus(null);
          setIsThinking(false);
        }, 500);
      } else if (status.type === "thinking") {
        setIsThinking(true);
        setToolStatus(status);
      } else {
        setToolStatus(status);
      }
    });

    socket.on("gemini_tokens", (t: typeof tokens) => setTokens(t));
    socket.on("gemini_enabled", () => {});

    return () => {
      socket.disconnect();
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const formattedTokens = useMemo(() => {
    const t = tokens.totalTokens;
    if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`;
    if (t >= 1_000) return `${(t / 1_000).toFixed(1)}k`;
    return String(t);
  }, [tokens.totalTokens]);

  // ─── Actions ─────────────────────────────────────────────────────
  const sendMessage = useCallback((text?: string) => {
    const msg = (text || input).trim();
    if (!msg || !socketRef.current?.connected) return;

    if (msg === "/clear") {
      fetch(`${BRIDGE_URL}/api/gemini/messages`, { method: "DELETE" });
      setMessages([]);
      setStreamText(null);
      setInput("");
      return;
    }

    socketRef.current.emit("gemini_message", { content: msg });
    setStreamText(null);
    setIsThinking(true);
    if (!text) setInput("");
    setShowQuickActions(false);
  }, [input]);

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setPendingImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = () => {
          setPendingImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  // Voice input
  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "sv-SE";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // Conversation management
  const saveConversation = useCallback(() => {
    if (messages.length === 0) return;
    const now = Date.now();
    const firstUser = messages.find(m => m.role === "user");
    const title = firstUser ? firstUser.content.slice(0, 50) + (firstUser.content.length > 50 ? "..." : "") : "Ny chatt";
    const preview = messages[messages.length - 1].content.slice(0, 80);

    if (activeConvId) {
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, updatedAt: now, messageCount: messages.length, preview, title: c.title === "Ny chatt" ? title : c.title } : c));
    } else {
      const id = `oc_${now}_${Math.random().toString(36).slice(2, 6)}`;
      setConversations(prev => [{ id, title, updatedAt: now, messageCount: messages.length, preview }, ...prev]);
      setActiveConvId(id);
    }
  }, [messages, activeConvId]);

  const startNewChat = useCallback(() => {
    saveConversation();
    fetch(`${BRIDGE_URL}/api/gemini/messages`, { method: "DELETE" }).catch(() => {});
    setMessages([]);
    setStreamText(null);
    setActiveConvId(null);
    setShowHistory(false);
  }, [saveConversation]);

  // Auto-save
  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => saveConversation(), 5000);
    return () => clearTimeout(t);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Tool status indicator ───────────────────────────────────────
  const toolCfg = toolStatus
    ? (TOOL_CATEGORIES[toolStatus.category || "thinking"] || TOOL_CATEGORIES.thinking)
    : null;

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-[#0a0f1a] to-slate-950 text-white overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-2.5 border-b border-orange-900/20 bg-gradient-to-r from-slate-950 via-orange-950/10 to-slate-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
                <span className="text-lg">🦞</span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
            </div>
            <div>
              <h2 className="text-sm font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                OpenClaw
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Gemini 2.5 Pro</span>
                {tokens.totalTokens > 0 && (
                  <>
                    <span className="text-[10px] text-slate-700">•</span>
                    <span className="text-[10px] text-amber-500/70">{formattedTokens} tokens</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-xl text-slate-500 hover:text-orange-400 hover:bg-orange-950/30 transition-all"
              title="Historik"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <button
              onClick={startNewChat}
              className="p-2 rounded-xl text-slate-500 hover:text-orange-400 hover:bg-orange-950/30 transition-all"
              title="Ny chatt"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── History sidebar ── */}
      {showHistory && (
        <div className="absolute inset-0 z-50 flex">
          <div className="w-72 bg-slate-950/98 border-r border-slate-800/50 flex flex-col backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
              <span className="text-sm font-semibold text-slate-300">Konversationer</span>
              <button onClick={() => setShowHistory(false)} className="p-1 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-8">Inga sparade chattar</p>
              ) : conversations.map(c => (
                <button
                  key={c.id}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-800/50 transition-colors border-b border-slate-800/20 ${activeConvId === c.id ? "bg-orange-950/20 border-l-2 border-l-orange-500" : ""}`}
                  onClick={() => { setActiveConvId(c.id); setShowHistory(false); }}
                >
                  <div className="text-xs text-slate-300 truncate">{c.title}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5 truncate">{c.preview}</div>
                  <div className="text-[9px] text-slate-700 mt-0.5">{c.messageCount} meddelanden</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setShowHistory(false)} />
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && !isThinking && (
          <div className="flex flex-col items-center justify-center h-full px-4">
            {/* Hero */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 via-red-500/15 to-pink-500/20 border border-orange-500/20 flex items-center justify-center shadow-lg shadow-orange-500/5">
                <span className="text-4xl">🦞</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-orange-300 via-red-300 to-pink-300 bg-clip-text text-transparent mb-1">
              OpenClaw AI
            </h2>
            <p className="text-xs text-slate-500 mb-1">Driven av Gemini 2.5 Pro</p>
            <p className="text-[11px] text-slate-600 text-center max-w-xs mb-8">
              Din personliga AI-assistent med full kontroll över datorer, filer, minne, webb, säkerhet och mer.
            </p>

            {/* Suggestions */}
            <div className="w-full max-w-sm space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => sendMessage(s.text)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-orange-700/30 hover:bg-orange-950/20 transition-all group"
                >
                  <span className="mr-2.5">{s.icon}</span>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 group ${
              msg.role === "user"
                ? "bg-gradient-to-br from-orange-600/80 to-red-600/60 text-white shadow-lg shadow-orange-500/10"
                : "bg-slate-800/70 text-slate-100 border border-slate-700/30"
            }`}>
              {/* Header */}
              <div className="flex items-center gap-1.5 mb-1">
                {msg.role === "assistant" ? (
                  <>
                    <span className="text-xs">🦞</span>
                    <span className="text-[10px] text-orange-400/80 font-medium">OpenClaw</span>
                  </>
                ) : (
                  <span className="text-[10px] text-white/60">Du</span>
                )}
                <span className="text-[10px] opacity-40 ml-auto">{formatTime(msg.timestamp)}</span>
              </div>

              {/* Images */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {msg.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="max-w-[200px] max-h-[150px] rounded-lg border border-slate-600/30" />
                  ))}
                </div>
              )}

              {/* Content */}
              <div className={`text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 ${
                msg.role === "user" ? "prose-code:text-orange-200" : "prose-code:text-orange-300"
              } prose-code:bg-transparent prose-a:text-blue-400`}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={fullCode}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>

              {/* Actions */}
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mt-1.5 -mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyText(msg.content, msg.id)}
                    className="p-0.5 rounded text-slate-500 hover:text-white transition-colors"
                    title="Kopiera"
                  >
                    {copied === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => {
                      if ("speechSynthesis" in window) {
                        const u = new SpeechSynthesisUtterance(msg.content.slice(0, 500));
                        u.lang = "sv-SE";
                        speechSynthesis.speak(u);
                      }
                    }}
                    className="p-0.5 rounded text-slate-500 hover:text-white transition-colors"
                    title="Läs upp"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming / Thinking */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[88%] bg-slate-800/70 rounded-2xl px-4 py-2.5 text-slate-100 border border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs">🦞</span>
                <span className="text-[10px] text-orange-400/80 font-medium">OpenClaw</span>
              </div>
              {streamText ? (
                <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-code:text-orange-300">
                  <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={streamingCode}>
                    {cleanStreamingText(streamText)}
                  </ReactMarkdown>
                  <span className="inline-block w-2 h-4 bg-orange-400 animate-pulse ml-0.5 rounded-sm" />
                </div>
              ) : (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Tool Status Bar ── */}
      {toolStatus && toolStatus.type !== "done" && toolCfg && (() => {
        const Icon = toolCfg.icon;
        return (
          <div className={`shrink-0 mx-3 mb-2 px-4 py-2 rounded-xl border ${toolCfg.bg} flex items-center gap-3`}>
            <Icon className={`w-4 h-4 ${toolCfg.color} animate-pulse`} />
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-medium ${toolCfg.color}`}>{toolCfg.label}</span>
              {toolStatus.tool && (
                <span className="text-[10px] text-slate-500 ml-2">{toolStatus.tool.replace(/_/g, " ")}</span>
              )}
              {toolStatus.input && (
                <div className="text-[10px] text-slate-600 truncate mt-0.5 font-mono">{toolStatus.input.slice(0, 60)}</div>
              )}
            </div>
            <div className={`w-2 h-2 rounded-full ${toolCfg.color.replace("text-", "bg-")} animate-pulse`} />
          </div>
        );
      })()}

      {/* ── Quick Actions ── */}
      {showQuickActions && (
        <div className="shrink-0 mx-3 mb-2 grid grid-cols-4 gap-1.5">
          {QUICK_ACTIONS.map(qa => {
            const QaIcon = qa.icon;
            return (
              <button
                key={qa.label}
                onClick={() => {
                  if (qa.msg) {
                    sendMessage(qa.msg);
                  } else {
                    setInput(qa.label === "Sök" ? "Sök på nätet efter: " : qa.label === "Kod" ? "Skriv kod: " : "Hämta: ");
                    inputRef.current?.focus();
                  }
                  setShowQuickActions(false);
                }}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-all active:scale-95 ${qa.color}`}
              >
                <QaIcon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{qa.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Pending images preview ── */}
      {pendingImages.length > 0 && (
        <div className="shrink-0 mx-3 mb-2 flex gap-2 flex-wrap">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-orange-700/30" />
              <button
                onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 px-3 pb-2 pt-2 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="flex items-end gap-2">
          {/* Voice */}
          <button
            onClick={toggleVoice}
            className={`p-3 rounded-2xl border transition-all shrink-0 ${
              isListening
                ? "bg-red-600/20 border-red-600/40 text-red-400 animate-pulse"
                : "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-orange-400"
            }`}
            title={isListening ? "Stoppa" : "Röstinmatning"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Quick actions toggle */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`p-3 rounded-2xl border transition-all shrink-0 ${
              showQuickActions
                ? "bg-orange-950/40 border-orange-700/40 text-orange-400"
                : "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-orange-400"
            }`}
            title="Snabbåtgärder"
          >
            {showQuickActions ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={connected ? "Fråga OpenClaw vad som helst..." : "Ansluter..."}
              disabled={!connected}
              rows={1}
              className="w-full bg-slate-800/60 text-white rounded-2xl px-4 py-3 pr-10 text-base border border-slate-700/40 focus:outline-none focus:border-orange-500/50 disabled:opacity-50 placeholder:text-slate-600 resize-none overflow-hidden leading-normal"
            />
            {/* Image upload button inside input */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 bottom-3 p-1 text-slate-600 hover:text-orange-400 transition-colors"
              title="Bifoga bild"
            >
              <Image className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Send */}
          <button
            onClick={() => sendMessage()}
            disabled={!connected || (!input.trim() && pendingImages.length === 0)}
            className="p-3.5 bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 active:from-orange-700 active:to-red-700 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg shadow-orange-500/20 disabled:shadow-none shrink-0"
          >
            {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
