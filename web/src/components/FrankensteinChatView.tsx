import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Trash2, Brain, Zap, Eye, Shield, Wrench,
  Loader2, ChevronDown, ChevronUp, Sparkles, Activity,
  Heart, AlertTriangle, HelpCircle, Focus, Smile, Paperclip, X, FileText,
  Plus, MessageSquare, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { io, Socket } from "socket.io-client";
import { BRIDGE_URL } from "../config";

interface AttachedFile {
  name: string;
  content: string;
  type: string;
  size: number;
  encoding?: "text" | "base64";
}

interface Message {
  id: string;
  role: "user" | "cascade";
  content: string;
  type: string;
  timestamp: string;
  files?: AttachedFile[];
}

interface FrankSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

interface CognitiveState {
  emotion: string;
  confidence: number;
  curiosity: number;
  fatigue: number;
  activeModules: string[];
  recentInsight: string | null;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requestCount: number;
}

interface AgentStatus {
  type: string;
  tool?: string;
  input?: string;
}

const EMOTION_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  neutral: { icon: Brain, color: "text-slate-400", label: "Neutral" },
  joy: { icon: Smile, color: "text-emerald-400", label: "Glad" },
  curiosity: { icon: HelpCircle, color: "text-blue-400", label: "Nyfiken" },
  concern: { icon: AlertTriangle, color: "text-amber-400", label: "Orolig" },
  focused: { icon: Focus, color: "text-purple-400", label: "Fokuserad" },
  surprise: { icon: Sparkles, color: "text-yellow-400", label: "Förvånad" },
  reflective: { icon: Brain, color: "text-indigo-400", label: "Reflekterande" },
  excitement: { icon: Sparkles, color: "text-orange-400", label: "Entusiastisk" },
  contemplative: { icon: Brain, color: "text-teal-400", label: "Eftertänksam" },
  determination: { icon: Zap, color: "text-red-400", label: "Beslutsam" },
  gratitude: { icon: Heart, color: "text-pink-400", label: "Tacksam" },
};

const MODULE_LABELS: Record<string, { label: string; color: string }> = {
  hdc: { label: "HDC", color: "bg-blue-900/50 text-blue-300" },
  aif: { label: "AIF", color: "bg-purple-900/50 text-purple-300" },
  ebbinghaus: { label: "Minne", color: "bg-amber-900/50 text-amber-300" },
  gut_feeling: { label: "Intuition", color: "bg-emerald-900/50 text-emerald-300" },
  emotions: { label: "Emotioner", color: "bg-pink-900/50 text-pink-300" },
  stm: { label: "STM", color: "bg-cyan-900/50 text-cyan-300" },
};

const REMARK_PLUGINS = [remarkGfm];

export default function FrankensteinChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [cognitive, setCognitive] = useState<CognitiveState | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [showCognitive, setShowCognitive] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sessions, setSessions] = useState<FrankSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [loadingSession, setLoadingSession] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamText, scrollToBottom]);

  const fetchSessions = useCallback(() => {
    fetch(`${BRIDGE_URL}/api/frankenstein/chat/sessions`)
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || []);
        setCurrentSessionId(data.currentSessionId || "");
      })
      .catch(() => {});
  }, []);

  // Load initial data + setup socket
  useEffect(() => {
    // Fetch initial state
    fetch(`${BRIDGE_URL}/api/frankenstein/chat/status`)
      .then(r => r.json())
      .then(data => {
        setEnabled(data.enabled);
        setTokens(data.tokens);
        setCognitive(data.cognitive);
      })
      .catch(() => {});

    fetch(`${BRIDGE_URL}/api/frankenstein/chat/messages`)
      .then(r => r.json())
      .then(setMessages)
      .catch(() => {});

    fetchSessions();

    // Socket connection
    const socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("frank_message", (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.role === "cascade") {
        setIsThinking(false);
        setStreamText("");
        setStatus(null);
      }
    });

    socket.on("frank_stream", (data: { content: string }) => {
      setStreamText(data.content);
    });

    socket.on("frank_status", (s: AgentStatus) => {
      setStatus(s);
      if (s.type === "thinking") setIsThinking(true);
      if (s.type === "done") {
        setIsThinking(false);
        setStatus(null);
      }
    });

    socket.on("frank_tokens", (t: TokenUsage) => setTokens(t));
    socket.on("frank_cognitive", (c: CognitiveState) => setCognitive(c));
    socket.on("frank_cleared", () => {
      setMessages([]);
      setStreamText("");
    });

    return () => { socket.disconnect(); };
  }, []);

  const BINARY_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".zip", ".tar", ".gz", ".mp3", ".wav", ".mp4", ".webm", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];
  const isBinaryFile = (name: string): boolean => BINARY_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));

  const readFileContent = (file: File): Promise<AttachedFile | null> => {
    return new Promise((resolve) => {
      // Max 2MB for base64, 500KB for text
      const maxSize = isBinaryFile(file.name) ? 2 * 1024 * 1024 : 512000;
      if (file.size > maxSize) {
        resolve({ name: file.name, content: `[Filen är för stor: ${(file.size / 1024).toFixed(0)}KB, max ${Math.round(maxSize / 1024)}KB]`, type: file.type, size: file.size, encoding: "text" });
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      if (isBinaryFile(file.name)) {
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1] || "";
          resolve({ name: file.name, content: base64, type: file.type, size: file.size, encoding: "base64" });
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => resolve({ name: file.name, content: reader.result as string, type: file.type, size: file.size, encoding: "text" });
        reader.readAsText(file);
      }
    });
  };

  const addFiles = async (files: FileList | File[]) => {
    const newFiles: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      const af = await readFileContent(file);
      if (af) newFiles.push(af);
    }
    setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = () => {
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || isThinking) return;
    setInput("");
    setIsThinking(true);
    setStreamText("");
    socketRef.current?.emit("frank_message", { content: text, files: attachedFiles.length > 0 ? attachedFiles : undefined });
    setAttachedFiles([]);
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const clearChat = () => {
    socketRef.current?.emit("frank_clear");
    setMessages([]);
    setStreamText("");
    // Refresh sessions after a short delay (archive happens server-side)
    setTimeout(fetchSessions, 500);
  };

  const newChat = async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/frankenstein/chat/sessions/new`, { method: "POST" });
      const data = await res.json();
      setMessages([]);
      setStreamText("");
      setCurrentSessionId(data.sessionId);
      fetchSessions();
      setShowHistory(false);
    } catch { /* ok */ }
  };

  const loadSession = async (sessionId: string) => {
    if (sessionId === currentSessionId) { setShowHistory(false); return; }
    setLoadingSession(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/frankenstein/chat/sessions/${sessionId}/load`, { method: "POST" });
      if (res.ok) {
        const msgsRes = await fetch(`${BRIDGE_URL}/api/frankenstein/chat/messages`);
        const msgs = await msgsRes.json();
        setMessages(msgs);
        setCurrentSessionId(sessionId);
        fetchSessions();
        setShowHistory(false);
      }
    } catch { /* ok */ }
    setLoadingSession(false);
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${BRIDGE_URL}/api/frankenstein/chat/sessions/${sessionId}`, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch { /* ok */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await addFiles(files);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      await addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);

  const emotionInfo = cognitive ? EMOTION_ICONS[cognitive.emotion] || EMOTION_ICONS.neutral : EMOTION_ICONS.neutral;
  const EmotionIcon = emotionInfo.icon;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just nu";
    if (mins < 60) return `${mins}m sedan`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h sedan`;
    const days = Math.floor(hours / 24);
    return `${days}d sedan`;
  };

  return (
    <div className="flex h-full relative">
      {/* History sidebar */}
      {showHistory && (
        <div className="absolute inset-0 z-20 flex">
          <div className="w-72 bg-slate-900 border-r border-slate-700/50 flex flex-col h-full">
            <div className="shrink-0 px-3 py-2 border-b border-slate-800/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Historik</h3>
              <button onClick={() => setShowHistory(false)} className="p-1 text-slate-500 hover:text-white" title="Stäng historik">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={newChat}
                className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ny konversation
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
              {/* Current session */}
              {messages.length > 0 && (
                <div className="px-2 py-1.5 rounded-lg bg-purple-600/15 border border-purple-500/20">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="text-[11px] text-white font-medium truncate">
                      {messages.find(m => m.role === "user")?.content.slice(0, 40) || "Aktuell konversation"}
                    </span>
                  </div>
                  <div className="text-[9px] text-purple-400 mt-0.5 ml-4.5">Aktiv nu • {messages.length} meddelanden</div>
                </div>
              )}
              {/* Past sessions */}
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  disabled={loadingSession}
                  className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors group ${
                    s.id === currentSessionId ? "bg-slate-700/50" : "hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-[11px] text-slate-300 truncate">{s.title}</span>
                    </div>
                    <button
                      onClick={(e) => deleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all"
                      title="Ta bort"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-[9px] text-slate-600 mt-0.5 ml-4.5 flex items-center gap-2">
                    <span>{formatTimeAgo(s.updatedAt)}</span>
                    <span>{s.messageCount} msg</span>
                  </div>
                  {s.preview && (
                    <div className="text-[9px] text-slate-600 mt-0.5 ml-4.5 truncate">{s.preview}</div>
                  )}
                </button>
              ))}
              {sessions.length === 0 && messages.length === 0 && (
                <div className="text-center text-[11px] text-slate-600 py-6">Ingen historik ännu</div>
              )}
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setShowHistory(false)} />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* History toggle */}
            <button
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchSessions(); }}
              className={`p-1.5 rounded-lg transition-colors ${showHistory ? "bg-purple-600/30 text-purple-300" : "text-slate-500 hover:text-slate-300"}`}
              title="Historik"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <span className="text-lg">🧟</span>
            <div>
              <h2 className="text-sm font-bold text-white">Frankenstein AI</h2>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-emerald-400" : "bg-red-400"}`} />
                <span className="text-[10px] text-slate-500">
                  {enabled ? "Kognitiv agent aktiv" : "Ej konfigurerad"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* New chat */}
            <button onClick={newChat} className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors" title="Ny konversation">
              <Plus className="w-4 h-4" />
            </button>
            {/* Cognitive state toggle */}
            <button
              onClick={() => setShowCognitive(!showCognitive)}
              className={`p-1.5 rounded-lg transition-colors ${showCognitive ? "bg-purple-600/30 text-purple-300" : "text-slate-500 hover:text-slate-300"}`}
              title="Kognitivt tillstånd"
            >
              <Activity className="w-4 h-4" />
            </button>
            {/* Emotion indicator */}
            {cognitive && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/50 ${emotionInfo.color}`} title={`Emotion: ${emotionInfo.label}`}>
                <EmotionIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">{emotionInfo.label}</span>
              </div>
            )}
            {/* Clear */}
            <button onClick={clearChat} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Rensa konversation">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cognitive state panel */}
        {showCognitive && cognitive && (
          <div className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/30">
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-center">
                <div className="text-[10px] text-slate-500">Confidence</div>
                <div className="text-xs font-bold text-emerald-400">{Math.round(cognitive.confidence * 100)}%</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cognitive.confidence * 100}%` }} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500">Curiosity</div>
                <div className="text-xs font-bold text-blue-400">{Math.round(cognitive.curiosity * 100)}%</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cognitive.curiosity * 100}%` }} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500">Fatigue</div>
                <div className="text-xs font-bold text-amber-400">{Math.round(cognitive.fatigue * 100)}%</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${cognitive.fatigue * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {cognitive.activeModules.map(mod => {
                const info = MODULE_LABELS[mod] || { label: mod, color: "bg-slate-700 text-slate-300" };
                return (
                  <span key={mod} className={`text-[8px] px-1.5 py-0.5 rounded-full ${info.color}`}>
                    {info.label}
                  </span>
                );
              })}
            </div>
            {cognitive.recentInsight && (
              <div className="mt-1.5 text-[10px] text-slate-500 italic">
                💡 {cognitive.recentInsight}
              </div>
            )}
            {tokens && (
              <div className="mt-1.5 flex gap-3 text-[9px] text-slate-600">
                <span>{tokens.totalTokens.toLocaleString()} tokens</span>
                <span>{tokens.requestCount} requests</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 py-2 space-y-3">
        {messages.length === 0 && !isThinking && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-4xl mb-3">🧟</span>
            <h3 className="text-sm font-bold text-white mb-1">Frankenstein AI</h3>
            <p className="text-[11px] text-slate-500 max-w-xs mb-4">
              Kognitiv AI med HDC, Active Inference, Ebbinghaus-minne, Gut Feeling och Emotioner.
              Har ALLA verktyg + multi-modell konsensus.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {[
                { icon: Brain, label: "Multi-modell konsensus", desc: "Frågar Claude + DeepSeek" },
                { icon: Eye, label: "Kognitiv introspection", desc: "Rapporterar sitt tillstånd" },
                { icon: Zap, label: "Djup forskning", desc: "Multi-steg webbforskning" },
                { icon: Shield, label: "Alla verktyg", desc: "Filer, kommandon, datorer, RAG" },
              ].map(f => (
                <div key={f.label} className="bg-slate-800/40 rounded-lg p-2 text-left">
                  <f.icon className="w-3.5 h-3.5 text-purple-400 mb-1" />
                  <div className="text-[10px] font-medium text-white">{f.label}</div>
                  <div className="text-[9px] text-slate-600">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[95%] sm:max-w-[85%] min-w-0 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
              msg.role === "user"
                ? "bg-purple-600/30 text-white rounded-br-md"
                : "bg-slate-800/60 text-slate-100 rounded-bl-md border border-slate-700/30"
            }`}>
              {msg.role === "cascade" && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px]">🧟</span>
                  <span className="text-[10px] text-purple-400 font-medium">Frankenstein</span>
                </div>
              )}
              {msg.files && msg.files.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {msg.files.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-purple-900/30 rounded px-1.5 py-0.5">
                      <FileText className="w-2.5 h-2.5 text-purple-400" />
                      <span className="text-[9px] text-purple-300">{f.name}</span>
                    </span>
                  ))}
                </div>
              )}
              <div className="text-[13px] sm:text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-pre:my-2 prose-headings:my-2 prose-headings:text-white prose-li:my-0.5 prose-strong:text-white prose-code:text-purple-300 prose-a:text-purple-400 overflow-hidden [overflow-wrap:anywhere] [&_pre]:overflow-x-auto [&_pre]:max-w-[calc(100vw-4rem)] [&_pre]:text-[11px] [&_pre]:sm:text-xs [&_code]:break-all [&_pre_code]:break-normal [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full [&_img]:max-w-full [&_p]:max-w-full">
                <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                  {msg.content}
                </ReactMarkdown>
              </div>
              <div className="text-[9px] text-slate-500 mt-1.5 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming / thinking indicator */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="max-w-[95%] sm:max-w-[85%] min-w-0 rounded-2xl rounded-bl-md px-3 py-2 bg-slate-800/60 border border-slate-700/30">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px]">🧟</span>
                <span className="text-[10px] text-purple-400 font-medium">Frankenstein</span>
              </div>
              {streamText ? (
                <div className="text-[13px] sm:text-sm leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-pre:my-2 prose-headings:text-white prose-strong:text-white prose-code:text-purple-300 overflow-hidden [overflow-wrap:anywhere] [&_pre]:overflow-x-auto [&_pre]:max-w-[calc(100vw-4rem)] [&_pre]:text-[11px] [&_pre]:sm:text-xs [&_code]:break-all [&_pre_code]:break-normal">
                  <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                    {streamText}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {status?.type === "tool_start" ? (
                    <>
                      <Wrench className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span className="text-[11px] text-amber-400">
                        Använder {status.tool || "verktyg"}...
                      </span>
                      {status.input && (
                        <span className="text-[9px] text-slate-600 truncate max-w-[150px]">{status.input}</span>
                      )}
                    </>
                  ) : status?.type === "tool_done" ? (
                    <>
                      <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">
                        {status.tool} klar
                      </span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                      <span className="text-[11px] text-purple-400">Tänker...</span>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div
        className={`shrink-0 px-3 py-2 border-t transition-colors ${isDragOver ? "border-purple-500 bg-purple-900/10" : "border-slate-800/50"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Attached files */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1 bg-slate-800/70 rounded-lg px-2 py-1 border border-slate-700/50">
                <FileText className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-[10px] text-slate-300 truncate max-w-[120px]">{f.name}</span>
                <span className="text-[9px] text-slate-600">{(f.size / 1024).toFixed(0)}KB</span>
                <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 ml-0.5" title="Ta bort fil">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            aria-label="Välj filer att bifoga"
            onChange={async (e) => { if (e.target.files) { await addFiles(e.target.files); e.target.value = ""; } }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-500 hover:text-purple-400 transition-colors touch-manipulation shrink-0"
            title="Bifoga fil"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={attachedFiles.length > 0 ? "Kommentar till filerna (valfritt)..." : "Fråga Frankenstein AI..."}
            aria-label="Meddelande till Frankenstein"
            rows={1}
            className="flex-1 bg-slate-800/50 text-sm text-white rounded-xl px-3 py-2 border border-slate-700/50 focus:outline-none focus:border-purple-500 placeholder-slate-600 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={(!input.trim() && attachedFiles.length === 0) || isThinking}
            className="p-2.5 bg-purple-600 text-white rounded-xl active:bg-purple-700 disabled:opacity-40 transition-colors touch-manipulation shrink-0"
            title="Skicka"
          >
            {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-slate-600">
            📎 Klistra in / dra filer • Shift+Enter ny rad
          </span>
          {tokens && (
            <span className="text-[9px] text-slate-600">
              {tokens.totalTokens.toLocaleString()} tokens
            </span>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
