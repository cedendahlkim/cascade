import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Send, Loader2, Zap, Brain, Globe, Terminal,
  Copy, Check, Code, Search, Eye, Database,
  Sparkles, Image, ChevronDown, Heart, HeartCrack,
  Mic, MicOff, Camera, Plus, X, PanelLeftOpen,
  FolderSearch, Volume2, Shield, DollarSign,
  Cpu, ChevronUp, Download, Star, StarOff,
  ThumbsUp, ThumbsDown, Paperclip, Activity,
  Gauge, BookmarkPlus, Play, RefreshCw,
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
  model?: string;
  engine?: string;
  images?: string[];
  reaction?: "up" | "down";
  favorite?: boolean;
}

interface ToolStatus {
  type: "thinking" | "tool_start" | "tool_done" | "done";
  tool?: string;
  input?: string;
  category?: string;
}

interface CognitiveState {
  emotion: string;
  secondaryEmotion: string | null;
  emotionIntensity: number;
  confidence: number;
  curiosity: number;
  fatigue: number;
  activeModules: string[];
  recentInsight: string | null;
}

interface Wellbeing {
  overall: number;
  satisfaction: number;
  energy: number;
  socialConnection: number;
  growth: number;
  frustration: number;
  mood: string;
  moodEmoji: string;
  description: string;
  factors: string[];
}

interface ModelDef {
  id: string;
  name: string;
  provider: string;
  icon: string;
  description: string;
  contextLength: number;
  pricing: { prompt: number; completion: number };
  supportsTools: boolean;
  color: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
  preview: string;
  model?: string;
}

// ─── Engine type ─────────────────────────────────────────────────────
type Engine = "openrouter" | "frankenstein";

const ENGINE_INFO: Record<Engine, { name: string; icon: string; desc: string; color: string }> = {
  openrouter:    { name: "OpenRouter",    icon: "🌐", desc: "200+ modeller via OpenRouter", color: "text-orange-400" },
  frankenstein:  { name: "Frankenstein",  icon: "🧬", desc: "Kognitiv AI med känslor & lärande", color: "text-emerald-400" },
};

// ─── Constants ───────────────────────────────────────────────────────
const REMARK_PLUGINS = [remarkGfm];

const EMOTION_EMOJI: Record<string, string> = {
  joy: "😊", concern: "😟", curiosity: "🤔", excitement: "🤩",
  focused: "🎯", reflective: "🪞", contemplative: "💭",
  determination: "💪", gratitude: "🙏", neutral: "😐",
};

const MODELS: ModelDef[] = [
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", icon: "🏛️", description: "Bäst på kod och resonering", contextLength: 200000, pricing: { prompt: 3, completion: 15 }, supportsTools: true, color: "from-orange-500 to-amber-500" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", icon: "🟢", description: "Snabb multimodal", contextLength: 128000, pricing: { prompt: 2.5, completion: 10 }, supportsTools: true, color: "from-green-500 to-emerald-500" },
  { id: "openai/o3-mini", name: "o3-mini", provider: "OpenAI", icon: "🧠", description: "Djup resonering", contextLength: 200000, pricing: { prompt: 1.1, completion: 4.4 }, supportsTools: true, color: "from-blue-500 to-indigo-500" },
  { id: "google/gemini-2.5-pro-preview", name: "Gemini 2.5 Pro", provider: "Google", icon: "💎", description: "1M context, stark på allt", contextLength: 1000000, pricing: { prompt: 1.25, completion: 10 }, supportsTools: true, color: "from-blue-400 to-purple-500" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", icon: "🐋", description: "Billig resoneringsmodell", contextLength: 64000, pricing: { prompt: 0.55, completion: 2.19 }, supportsTools: false, color: "from-cyan-500 to-blue-500" },
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", icon: "🦙", description: "Extremt billig, 1M context", contextLength: 1000000, pricing: { prompt: 0.2, completion: 0.6 }, supportsTools: true, color: "from-violet-500 to-purple-500" },
  { id: "mistralai/mistral-large-2411", name: "Mistral Large", provider: "Mistral", icon: "🌊", description: "Europas bästa — flerspråkig", contextLength: 128000, pricing: { prompt: 2, completion: 6 }, supportsTools: true, color: "from-orange-400 to-red-500" },
  { id: "qwen/qwen-2.5-coder-32b-instruct", name: "Qwen Coder 32B", provider: "Alibaba", icon: "🐉", description: "Bästa öppna kodmodellen", contextLength: 32768, pricing: { prompt: 0.07, completion: 0.16 }, supportsTools: true, color: "from-red-500 to-pink-500" },
  { id: "x-ai/grok-3-mini-beta", name: "Grok 3 Mini", provider: "xAI", icon: "⚡", description: "Snabb resonering", contextLength: 131072, pricing: { prompt: 0.3, completion: 0.5 }, supportsTools: true, color: "from-sky-400 to-blue-500" },
  { id: "perplexity/sonar-deep-research", name: "Sonar Research", provider: "Perplexity", icon: "🔍", description: "Djup webbforskning med källor", contextLength: 128000, pricing: { prompt: 2, completion: 8 }, supportsTools: false, color: "from-teal-500 to-cyan-500" },
];

const TOOL_CATEGORIES: Record<string, { icon: typeof Brain; label: string; color: string; bg: string }> = {
  thinking:   { icon: Brain,       label: "Tänker",      color: "text-purple-400", bg: "bg-purple-950/60 border-purple-800/40" },
  memory:     { icon: Sparkles,    label: "Minne",       color: "text-amber-400",  bg: "bg-amber-950/60 border-amber-800/40" },
  filesystem: { icon: FolderSearch, label: "Filer",      color: "text-blue-400",   bg: "bg-blue-950/60 border-blue-800/40" },
  command:    { icon: Terminal,    label: "Kommando",    color: "text-emerald-400", bg: "bg-emerald-950/60 border-emerald-800/40" },
  web:        { icon: Globe,       label: "Webb",        color: "text-green-400",  bg: "bg-green-950/60 border-green-800/40" },
  security:   { icon: Shield,     label: "Säkerhet",    color: "text-yellow-400", bg: "bg-yellow-950/60 border-yellow-800/40" },
  desktop:    { icon: Eye,        label: "Skärm",       color: "text-cyan-400",   bg: "bg-cyan-950/60 border-cyan-800/40" },
  knowledge:  { icon: Database,   label: "Kunskapsbas", color: "text-indigo-400", bg: "bg-indigo-950/60 border-indigo-800/40" },
  creative:   { icon: Sparkles,   label: "Skapar",      color: "text-pink-400",   bg: "bg-pink-950/60 border-pink-800/40" },
};

const QUICK_ACTIONS = [
  { icon: Camera,   label: "Screenshot",  msg: "Ta en screenshot och beskriv vad du ser" },
  { icon: Terminal, label: "System",      msg: "Visa systeminfo: CPU, RAM, disk, nätverk" },
  { icon: Shield,   label: "Säkerhet",    msg: "Kör en snabb säkerhetsskanning" },
  { icon: Brain,    label: "Minnen",      msg: "Lista alla sparade minnen" },
  { icon: Image,    label: "Bild",        msg: "Generera en bild av: " },
  { icon: RefreshCw, label: "Uppdatera",  msg: "Kör sudo apt-get update && sudo apt-get upgrade -y" },
  { icon: FolderSearch, label: "Filer",   msg: "Lista filerna i projektets rot-mapp" },
  { icon: Activity, label: "Docker",      msg: "Visa docker ps och docker system df" },
];

const SUGGESTIONS = [
  { icon: "🔍", text: "Analysera säkerheten på min server" },
  { icon: "💻", text: "Hjälp mig skriva en Python-funktion" },
  { icon: "�", text: "Byt till Frankenstein-motorn" },
  { icon: "📊", text: "Ge mig en översikt av systemet" },
  { icon: "�", text: "Generera en bild av en futuristisk stad" },
  { icon: "🔐", text: "Kör en penetrationstest mot min webbapp" },
  { icon: "🐳", text: "Visa alla Docker containers och deras status" },
  { icon: "🧠", text: "Vad har du lärt dig om mig?" },
];

// Slash commands
const SLASH_COMMANDS = [
  { cmd: "/image", desc: "Generera bild", fill: "Generera en bild av: " },
  { cmd: "/sudo", desc: "Kör sudo-kommando", fill: "Kör kommandot: sudo " },
  { cmd: "/docker", desc: "Docker-kommando", fill: "Kör docker-kommandot: docker " },
  { cmd: "/search", desc: "Webbsökning", fill: "Sök på webben efter: " },
  { cmd: "/memory", desc: "Hantera minnen", fill: "Lista alla sparade minnen" },
  { cmd: "/system", desc: "Systeminfo", fill: "Visa systeminfo: CPU, RAM, disk, nätverk" },
  { cmd: "/frank", desc: "Byt till Frankenstein", fill: "" },
  { cmd: "/openrouter", desc: "Byt till OpenRouter", fill: "" },
  { cmd: "/clear", desc: "Rensa chatten", fill: "/clear" },
  { cmd: "/export", desc: "Exportera konversation", fill: "" },
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
          <button onClick={() => navigator.clipboard.writeText(code)} className="absolute right-2 top-2 p-1 rounded bg-slate-700/80 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs" title="Kopiera"><Copy className="w-3 h-3" /></button>
          <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: "0.5rem", fontSize: "0.75rem" }}>{code}</SyntaxHighlighter>
        </div>
      );
    }
    return <code className="bg-slate-700/60 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
  },
};

function cleanStreamingText(text: string): string {
  const fences = text.match(/^```/gm);
  if (fences && fences.length % 2 !== 0) return text.slice(0, text.lastIndexOf("```"));
  return text;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatCtx(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  return `${(n / 1_000).toFixed(0)}k`;
}

// ─── Component ───────────────────────────────────────────────────────
export default function OpenClawView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<ToolStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentModel, setCurrentModel] = useState(MODELS[0].id);
  const [engine, setEngine] = useState<Engine>("openrouter");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showCognitive, setShowCognitive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try { return JSON.parse(localStorage.getItem("oc_conversations") || "[]"); } catch { return []; }
  });
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [tokens, setTokens] = useState({ inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0, totalCostUsd: 0 });
  const [copied, setCopied] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [orEnabled, setOrEnabled] = useState(false);
  const [cognitive, setCognitive] = useState<CognitiveState | null>(null);
  const [wellbeing, setWellbeing] = useState<Wellbeing | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeModel = useMemo(() => MODELS.find(m => m.id === currentModel) || MODELS[0], [currentModel]);
  const engineInfo = ENGINE_INFO[engine];

  useEffect(() => { localStorage.setItem("oc_conversations", JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamText, isThinking]);

  // Filtered slash commands
  const filteredSlash = useMemo(() => {
    if (!input.startsWith("/")) return [];
    return SLASH_COMMANDS.filter(s => s.cmd.startsWith(input.toLowerCase()));
  }, [input]);

  useEffect(() => { setShowSlashMenu(filteredSlash.length > 0 && input.startsWith("/")); }, [filteredSlash, input]);

  // Search filter
  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

  const favoriteMessages = useMemo(() => messages.filter(m => m.favorite), [messages]);

  // Socket connection
  useEffect(() => {
    const socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("openrouter_enabled", (enabled: boolean) => setOrEnabled(enabled));
    socket.on("openrouter_model", (model: string) => setCurrentModel(model));

    socket.on("openrouter_history", (history: any[]) => {
      setMessages(history.map(m => ({
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
        timestamp: m.timestamp,
      })));
    });

    socket.on("openrouter_message", (msg: any) => {
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

    socket.on("openrouter_stream", (chunk: string) => setStreamText(chunk));

    socket.on("openrouter_status", (status: ToolStatus) => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      if (status.type === "done") {
        statusTimeoutRef.current = setTimeout(() => { setToolStatus(null); setIsThinking(false); }, 500);
      } else if (status.type === "thinking") {
        setIsThinking(true);
        setToolStatus(status);
      } else {
        setToolStatus(status);
      }
    });

    socket.on("openrouter_tokens", (t: any) => setTokens(t));
    socket.on("openclaw_cognitive", (c: CognitiveState) => setCognitive(c));
    socket.on("openclaw_wellbeing", (w: Wellbeing) => setWellbeing(w));

    return () => { socket.disconnect(); if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current); };
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

    // Slash command handling
    if (msg === "/clear") {
      fetch(`${BRIDGE_URL}/api/openrouter/messages`, { method: "DELETE" });
      setMessages([]); setStreamText(null); setInput(""); return;
    }
    if (msg === "/frank" || msg.startsWith("/frank ")) {
      setEngine("frankenstein"); setInput(""); setShowSlashMenu(false); return;
    }
    if (msg === "/openrouter" || msg.startsWith("/openrouter ")) {
      setEngine("openrouter"); setInput(""); setShowSlashMenu(false); return;
    }
    if (msg === "/export") {
      exportConversation(); setInput(""); return;
    }

    // Route to correct engine
    if (engine === "frankenstein") {
      socketRef.current.emit("openclaw_frank_message", { content: msg });
    } else {
      socketRef.current.emit("openrouter_message", { content: msg, model: currentModel });
    }
    setStreamText(null);
    setIsThinking(true);
    if (!text) setInput("");
    setShowQuickActions(false);
    setShowModelPicker(false);
    setShowSlashMenu(false);
  }, [input, currentModel, engine]);

  const switchModel = useCallback((modelId: string) => {
    setCurrentModel(modelId);
    setEngine("openrouter");
    socketRef.current?.emit("openrouter_set_model", { model: modelId });
    setShowModelPicker(false);
  }, []);

  const switchToFrank = useCallback(() => {
    setEngine("frankenstein");
    setShowModelPicker(false);
  }, []);

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === "Tab" && showSlashMenu && filteredSlash.length > 0) {
      e.preventDefault();
      const cmd = filteredSlash[0];
      if (cmd.fill) { setInput(cmd.fill); } else { setInput(cmd.cmd + " "); }
      setShowSlashMenu(false);
    }
  }, [sendMessage, showSlashMenu, filteredSlash]);

  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    if (isListening) { setIsListening(false); return; }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SR();
    recognition.lang = "sv-SE";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => { setInput(prev => prev + event.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const toggleReaction = useCallback((id: string, reaction: "up" | "down") => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, reaction: m.reaction === reaction ? undefined : reaction } : m));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, favorite: !m.favorite } : m));
  }, []);

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[#*`_~\[\]()]/g, "").slice(0, 1000));
    u.lang = "sv-SE";
    u.rate = 1.1;
    speechSynthesis.speak(u);
  }, []);

  const exportConversation = useCallback(() => {
    if (messages.length === 0) return;
    const md = messages.map(m => `## ${m.role === "user" ? "Du" : "AI"} (${formatTime(m.timestamp)})\n\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([`# OpenClaw Konversation\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `openclaw-${new Date().toISOString().slice(0, 10)}.md`;
    a.click(); URL.revokeObjectURL(url);
  }, [messages]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const isImage = file.type.startsWith("image/");
        if (isImage) {
          setInput(prev => prev + `\n[Bifogad bild: ${file.name}]`);
        } else {
          setInput(prev => prev + `\n\nInnehåll från ${file.name}:\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\``);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  }, []);

  const saveConversation = useCallback(() => {
    if (messages.length === 0) return;
    const now = Date.now();
    const firstUser = messages.find(m => m.role === "user");
    const title = firstUser ? firstUser.content.slice(0, 50) + (firstUser.content.length > 50 ? "..." : "") : "Ny chatt";
    const preview = messages[messages.length - 1].content.slice(0, 80);
    if (activeConvId) {
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, updatedAt: now, messageCount: messages.length, preview } : c));
    } else {
      const id = `oc_${now}_${Math.random().toString(36).slice(2, 6)}`;
      setConversations(prev => [{ id, title, updatedAt: now, messageCount: messages.length, preview, model: currentModel }, ...prev]);
      setActiveConvId(id);
    }
  }, [messages, activeConvId, currentModel]);

  const startNewChat = useCallback(() => {
    saveConversation();
    fetch(`${BRIDGE_URL}/api/openrouter/messages`, { method: "DELETE" }).catch(() => {});
    setMessages([]); setStreamText(null); setActiveConvId(null); setShowHistory(false);
  }, [saveConversation]);

  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => saveConversation(), 5000);
    return () => clearTimeout(t);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const toolCfg = toolStatus ? (TOOL_CATEGORIES[toolStatus.category || "thinking"] || TOOL_CATEGORIES.thinking) : null;

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-[#0a0f1a] to-slate-950 text-white overflow-hidden">

      {/* ── Header ── */}
      <div className={`shrink-0 px-4 py-2.5 border-b ${engine === "frankenstein" ? "border-emerald-900/20 bg-gradient-to-r from-slate-950 via-emerald-950/10 to-slate-950" : "border-orange-900/20 bg-gradient-to-r from-slate-950 via-orange-950/10 to-slate-950"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${engine === "frankenstein" ? "from-emerald-500/20 to-cyan-500/20 border-emerald-500/30" : "from-orange-500/20 to-red-500/20 border-orange-500/30"} border flex items-center justify-center`}>
                <span className="text-lg">{engine === "frankenstein" ? "🧬" : "🦞"}</span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
            </div>
            <div>
              <h2 className={`text-sm font-bold bg-gradient-to-r ${engine === "frankenstein" ? "from-emerald-400 via-cyan-400 to-teal-400" : "from-orange-400 via-red-400 to-pink-400"} bg-clip-text text-transparent`}>
                OpenClaw {engine === "frankenstein" ? "× Frank" : ""}
              </h2>
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className={`flex items-center gap-1 text-[10px] ${engine === "frankenstein" ? "text-emerald-400/70 hover:text-emerald-400" : "text-slate-400 hover:text-orange-400"} transition-colors`}
              >
                <span>{engine === "frankenstein" ? "🧬" : activeModel.icon}</span>
                <span>{engine === "frankenstein" ? "Frankenstein AI" : activeModel.name}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Cognitive state indicator (Frankenstein) */}
            {engine === "frankenstein" && cognitive && (
              <button onClick={() => setShowCognitive(!showCognitive)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/30 border border-emerald-800/30 text-[10px] mr-1" title="Kognitiv status">
                <span>{EMOTION_EMOJI[cognitive.emotion] || "😐"}</span>
                <Gauge className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">{Math.round(cognitive.confidence * 100)}%</span>
              </button>
            )}
            {tokens.totalCostUsd > 0 && engine === "openrouter" && (
              <div className="flex items-center gap-0.5 text-[10px] text-emerald-500/70 mr-1">
                <DollarSign className="w-3 h-3" />
                <span>{tokens.totalCostUsd.toFixed(4)}</span>
              </div>
            )}
            {tokens.totalTokens > 0 && (
              <span className="text-[10px] text-amber-500/50 mr-1">{formattedTokens} tok</span>
            )}
            <button onClick={exportConversation} className="p-2 rounded-xl text-slate-500 hover:text-orange-400 hover:bg-orange-950/30 transition-all" title="Exportera">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="p-2 rounded-xl text-slate-500 hover:text-orange-400 hover:bg-orange-950/30 transition-all" title="Historik">
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <button onClick={startNewChat} className="p-2 rounded-xl text-slate-500 hover:text-orange-400 hover:bg-orange-950/30 transition-all" title="Ny chatt">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Cognitive State Bar (Frankenstein) ── */}
      {showCognitive && cognitive && (
        <div className="shrink-0 px-3 py-2 border-b border-emerald-800/30 bg-emerald-950/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Frankensteins kognitiva tillstånd</span>
            <button onClick={() => setShowCognitive(false)} className="text-slate-500 hover:text-white"><X className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="text-lg">{EMOTION_EMOJI[cognitive.emotion] || "😐"}</div>
              <div className="text-[9px] text-slate-400">{cognitive.emotion}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">Confidence</div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${cognitive.confidence * 100}%` }} /></div>
              <div className="text-[9px] text-emerald-400 mt-0.5">{Math.round(cognitive.confidence * 100)}%</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">Curiosity</div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${cognitive.curiosity * 100}%` }} /></div>
              <div className="text-[9px] text-cyan-400 mt-0.5">{Math.round(cognitive.curiosity * 100)}%</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 mb-0.5">Fatigue</div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${cognitive.fatigue * 100}%` }} /></div>
              <div className="text-[9px] text-red-400 mt-0.5">{Math.round(cognitive.fatigue * 100)}%</div>
            </div>
          </div>
          {wellbeing && (
            <div className="flex items-center gap-2 pt-1 border-t border-emerald-800/20">
              <span className="text-sm">{wellbeing.moodEmoji}</span>
              <span className="text-[10px] text-slate-400">{wellbeing.description}</span>
              <span className="text-[10px] text-emerald-500 ml-auto">Energi: {Math.round(wellbeing.energy * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* ── Model/Engine Picker ── */}
      {showModelPicker && (
        <div className="shrink-0 border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-xl max-h-[50vh] overflow-y-auto">
          <div className="px-3 py-2">
            {/* Engine selector */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => { setEngine("openrouter"); }} className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${engine === "openrouter" ? "bg-orange-950/40 border-orange-700/40 text-orange-300" : "bg-slate-800/30 border-slate-700/20 text-slate-400 hover:border-slate-600/40"}`}>
                🌐 OpenRouter
              </button>
              <button onClick={switchToFrank} className={`flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${engine === "frankenstein" ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-300" : "bg-slate-800/30 border-slate-700/20 text-slate-400 hover:border-slate-600/40"}`}>
                🧬 Frankenstein
              </button>
            </div>

            {engine === "frankenstein" ? (
              <div className="px-2 py-3 text-center">
                <div className="text-2xl mb-2">🧬</div>
                <div className="text-xs font-semibold text-emerald-300 mb-1">Frankenstein AI</div>
                <div className="text-[10px] text-slate-500">Kognitiv AI med känslor, lärande, minne och verktyg. Drivs av Gemini 2.5 Flash.</div>
                {cognitive && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-[10px]">
                    <span>{EMOTION_EMOJI[cognitive.emotion] || "😐"} {cognitive.emotion}</span>
                    <span className="text-emerald-400">Confidence: {Math.round(cognitive.confidence * 100)}%</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Välj modell</span>
                  <span className="text-[10px] text-slate-600">via OpenRouter</span>
                </div>
                <div className="space-y-1">
                  {MODELS.map(m => (
                    <button key={m.id} onClick={() => switchModel(m.id)} className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${currentModel === m.id ? "bg-gradient-to-r from-orange-950/40 to-red-950/30 border-orange-700/40" : "bg-slate-800/30 border-slate-700/20 hover:border-slate-600/40 hover:bg-slate-800/50"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{m.icon}</span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white">{m.name}</span>
                              <span className="text-[9px] text-slate-600">{m.provider}</span>
                              {m.supportsTools && <span title="Tool calling"><Cpu className="w-2.5 h-2.5 text-slate-600" /></span>}
                            </div>
                            <span className="text-[10px] text-slate-500">{m.description}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className="text-[9px] text-slate-600">{formatCtx(m.contextLength)} ctx</div>
                          <div className="text-[9px] text-emerald-600">${m.pricing.prompt}/{m.pricing.completion}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── History sidebar ── */}
      {showHistory && (
        <div className="absolute inset-0 z-50 flex">
          <div className="w-72 bg-slate-950/98 border-r border-slate-800/50 flex flex-col backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
              <span className="text-sm font-semibold text-slate-300">Konversationer</span>
              <button onClick={() => setShowHistory(false)} className="p-1 text-slate-500 hover:text-white" title="Stäng"><X className="w-4 h-4" /></button>
            </div>
            {/* Search in history */}
            <div className="px-3 py-2 border-b border-slate-800/30">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <Search className="w-3 h-3 text-slate-500" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Sök..." className="bg-transparent text-xs text-white placeholder:text-slate-600 outline-none flex-1" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-8">Inga sparade chattar</p>
              ) : conversations.map(c => (
                <button key={c.id} className={`w-full text-left px-4 py-2.5 hover:bg-slate-800/50 transition-colors border-b border-slate-800/20 ${activeConvId === c.id ? "bg-orange-950/20 border-l-2 border-l-orange-500" : ""}`} onClick={() => { setActiveConvId(c.id); setShowHistory(false); }}>
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
            <div className="relative mb-6">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${engine === "frankenstein" ? "from-emerald-500/20 via-cyan-500/15 to-teal-500/20 border-emerald-500/20" : "from-orange-500/20 via-red-500/15 to-pink-500/20 border-orange-500/20"} border flex items-center justify-center shadow-lg`}>
                <span className="text-4xl">{engine === "frankenstein" ? "🧬" : "🦞"}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h2 className={`text-xl font-bold bg-gradient-to-r ${engine === "frankenstein" ? "from-emerald-300 via-cyan-300 to-teal-300" : "from-orange-300 via-red-300 to-pink-300"} bg-clip-text text-transparent mb-1`}>
              {engine === "frankenstein" ? "Frankenstein AI" : "OpenClaw AI"}
            </h2>
            <p className="text-xs text-slate-500 mb-1">
              {engine === "frankenstein" ? "Kognitiv AI med känslor & lärande" : "10 modeller • Alla leverantörer • En chatt"}
            </p>
            <p className="text-[11px] text-slate-600 text-center max-w-xs mb-6">
              {engine === "frankenstein"
                ? "Frankenstein lär sig av varje konversation, har känslor och minne. Skriv /openrouter för att byta motor."
                : "Byt modell eller skriv /frank för Frankenstein AI. Skriv / för alla kommandon."}
            </p>

            {/* Engine + Model chips */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-6 max-w-sm">
              <button onClick={switchToFrank} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] transition-all ${engine === "frankenstein" ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-300" : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-emerald-600/50"}`}>
                <span>🧬</span><span>Frankenstein</span>
              </button>
              {MODELS.slice(0, 5).map(m => (
                <button key={m.id} onClick={() => switchModel(m.id)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] transition-all ${engine === "openrouter" && currentModel === m.id ? "bg-orange-950/40 border-orange-700/40 text-orange-300" : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600/50"}`}>
                  <span>{m.icon}</span><span>{m.name.split(" ").slice(0, 2).join(" ")}</span>
                </button>
              ))}
            </div>

            {/* Suggestions */}
            <div className="w-full max-w-sm space-y-2">
              {SUGGESTIONS.map(s => (
                <button key={s.text} onClick={() => {
                  if (s.text.includes("Frankenstein")) { switchToFrank(); return; }
                  sendMessage(s.text);
                }} className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-orange-700/30 hover:bg-orange-950/20 transition-all group">
                  <span className="mr-2.5">{s.icon}</span>
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {filteredMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 group ${
              msg.role === "user"
                ? `bg-gradient-to-br ${engine === "frankenstein" ? "from-emerald-600/80 to-cyan-600/60" : "from-orange-600/80 to-red-600/60"} text-white shadow-lg`
                : "bg-slate-800/70 text-slate-100 border border-slate-700/30"
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                {msg.role === "assistant" ? (
                  <>
                    <span className="text-xs">{engine === "frankenstein" ? "🧬" : activeModel.icon}</span>
                    <span className={`text-[10px] ${engine === "frankenstein" ? "text-emerald-400/80" : "text-orange-400/80"} font-medium`}>
                      {engine === "frankenstein" ? "Frankenstein" : activeModel.name}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-white/60">Du</span>
                )}
                <span className="text-[10px] opacity-40 ml-auto">{formatTime(msg.timestamp)}</span>
              </div>
              <div className={`text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 ${msg.role === "user" ? "prose-code:text-orange-200" : "prose-code:text-orange-300"} prose-code:bg-transparent prose-a:text-blue-400 prose-img:rounded-xl prose-img:max-h-64`}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={fullCode}>{msg.content}</ReactMarkdown>
                )}
              </div>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mt-1.5 -mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyText(msg.content, msg.id)} className="p-0.5 rounded text-slate-500 hover:text-white transition-colors" title="Kopiera">
                    {copied === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button onClick={() => speakText(msg.content)} className="p-0.5 rounded text-slate-500 hover:text-white transition-colors" title="Läs upp">
                    <Volume2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => toggleReaction(msg.id, "up")} className={`p-0.5 rounded transition-colors ${msg.reaction === "up" ? "text-emerald-400" : "text-slate-500 hover:text-emerald-400"}`} title="Bra svar">
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => toggleReaction(msg.id, "down")} className={`p-0.5 rounded transition-colors ${msg.reaction === "down" ? "text-red-400" : "text-slate-500 hover:text-red-400"}`} title="Dåligt svar">
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                  <button onClick={() => toggleFavorite(msg.id)} className={`p-0.5 rounded transition-colors ${msg.favorite ? "text-amber-400" : "text-slate-500 hover:text-amber-400"}`} title="Favorit">
                    {msg.favorite ? <Star className="w-3 h-3 fill-amber-400" /> : <StarOff className="w-3 h-3" />}
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
                <span className="text-xs">{engine === "frankenstein" ? "🧬" : activeModel.icon}</span>
                <span className={`text-[10px] ${engine === "frankenstein" ? "text-emerald-400/80" : "text-orange-400/80"} font-medium`}>
                  {engine === "frankenstein" ? "Frankenstein" : activeModel.name}
                </span>
              </div>
              {streamText ? (
                <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-code:text-orange-300 prose-img:rounded-xl prose-img:max-h-64">
                  <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={streamingCode}>{cleanStreamingText(streamText)}</ReactMarkdown>
                  <span className={`inline-block w-2 h-4 ${engine === "frankenstein" ? "bg-emerald-400" : "bg-orange-400"} animate-pulse ml-0.5 rounded-sm`} />
                </div>
              ) : (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <div key={d} className={`w-2 h-2 rounded-full ${engine === "frankenstein" ? "bg-emerald-400" : "bg-orange-400"} animate-bounce`} style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  {toolStatus?.tool && <span className="text-[10px] text-slate-500 ml-1">{toolStatus.tool.replace(/_/g, " ")}...</span>}
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
              {toolStatus.tool && <span className="text-[10px] text-slate-500 ml-2">{toolStatus.tool.replace(/_/g, " ")}</span>}
              {toolStatus.input && <div className="text-[10px] text-slate-600 truncate mt-0.5 font-mono">{toolStatus.input.slice(0, 60)}</div>}
            </div>
            <div className={`w-2 h-2 rounded-full ${toolCfg.color.replace("text-", "bg-")} animate-pulse`} />
          </div>
        );
      })()}

      {/* ── Slash Command Menu ── */}
      {showSlashMenu && (
        <div className="shrink-0 mx-3 mb-2 bg-slate-900/95 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-xl">
          {filteredSlash.map(s => (
            <button key={s.cmd} onClick={() => { if (s.fill) { setInput(s.fill); } else if (s.cmd === "/frank") { switchToFrank(); setInput(""); } else if (s.cmd === "/openrouter") { setEngine("openrouter"); setInput(""); } else if (s.cmd === "/export") { exportConversation(); setInput(""); } setShowSlashMenu(false); inputRef.current?.focus(); }} className="w-full text-left px-4 py-2 hover:bg-slate-800/50 transition-colors flex items-center gap-3 border-b border-slate-800/30 last:border-0">
              <span className="text-xs font-mono text-orange-400">{s.cmd}</span>
              <span className="text-[10px] text-slate-500">{s.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Quick Actions ── */}
      {showQuickActions && (
        <div className="shrink-0 mx-3 mb-2 grid grid-cols-4 gap-1.5">
          {QUICK_ACTIONS.map(qa => {
            const QaIcon = qa.icon;
            return (
              <button key={qa.label} onClick={() => {
                if (qa.msg.endsWith(": ")) { setInput(qa.msg); inputRef.current?.focus(); } else { sendMessage(qa.msg); }
                setShowQuickActions(false);
              }} className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border ${engine === "frankenstein" ? "border-emerald-700/30 hover:border-emerald-600/40 hover:text-emerald-400" : "border-slate-700/30 hover:border-orange-700/30 hover:text-orange-400"} bg-slate-800/40 text-slate-400 transition-all active:scale-95`}>
                <QaIcon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{qa.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Input ── */}
      <div className="shrink-0 px-3 pb-2 pt-2 bg-gradient-to-t from-slate-950 to-transparent">
        <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.py,.js,.ts,.json,.csv,.log,.pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} title="Välj filer att bifoga" />
        <div className="flex items-end gap-2">
          <button onClick={toggleVoice} className={`p-3 rounded-2xl border transition-all shrink-0 ${isListening ? "bg-red-600/20 border-red-600/40 text-red-400 animate-pulse" : "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-orange-400"}`} title={isListening ? "Stoppa" : "Röstinmatning"}>
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-2xl border bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-orange-400 transition-all shrink-0" title="Bifoga fil">
            <Paperclip className="w-5 h-5" />
          </button>
          <button onClick={() => setShowQuickActions(!showQuickActions)} className={`p-3 rounded-2xl border transition-all shrink-0 ${showQuickActions ? "bg-orange-950/40 border-orange-700/40 text-orange-400" : "bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-orange-400"}`} title="Snabbåtgärder">
            {showQuickActions ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
              onKeyDown={handleKeyDown}
              placeholder={connected ? (engine === "frankenstein" ? "Fråga Frankenstein... (/ för kommandon)" : `Fråga ${activeModel.name}... (/ för kommandon)`) : "Ansluter..."}
              disabled={!connected}
              rows={1}
              className={`w-full bg-slate-800/60 text-white rounded-2xl px-4 py-3 text-base border ${engine === "frankenstein" ? "border-emerald-700/40 focus:border-emerald-500/50" : "border-slate-700/40 focus:border-orange-500/50"} focus:outline-none disabled:opacity-50 placeholder:text-slate-600 resize-none overflow-hidden leading-normal`}
            />
          </div>
          <button onClick={() => sendMessage()} disabled={!connected || !input.trim()} className={`p-3.5 bg-gradient-to-br ${engine === "frankenstein" ? "from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-500/20" : "from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-500/20"} active:scale-95 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg disabled:shadow-none shrink-0`}>
            {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
