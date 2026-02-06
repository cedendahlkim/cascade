import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import {
  Send,
  Wifi,
  WifiOff,
  MessageCircle,
  Bell,
  HelpCircle,
  CheckCircle,
  XCircle,
  Brain,
  Sparkles,
  FolderSearch,
  Search,
  Globe,
  Link,
  Copy,
  Terminal,
  Cog,
  Cpu,
  Shield,
  Eye,
  Wrench,
  Settings,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import ToolsView from "./components/ToolsView";
import SettingsView from "./components/SettingsView";

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
}

interface AgentStatusEvent {
  type: "thinking" | "tool_start" | "tool_done" | "done";
  tool?: string;
  input?: string;
  category: string;
  timestamp: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  thinking: { icon: Brain, label: "Tänker", color: "text-purple-400", bg: "bg-purple-950/60 border-purple-800" },
  memory: { icon: Sparkles, label: "Sparar minne", color: "text-amber-400", bg: "bg-amber-950/60 border-amber-800" },
  filesystem: { icon: FolderSearch, label: "Läser filer", color: "text-blue-400", bg: "bg-blue-950/60 border-blue-800" },
  search: { icon: Search, label: "Söker", color: "text-pink-400", bg: "bg-pink-950/60 border-pink-800" },
  command: { icon: Terminal, label: "Kör kommando", color: "text-emerald-400", bg: "bg-emerald-950/60 border-emerald-800" },
  process: { icon: Cog, label: "Processer", color: "text-orange-400", bg: "bg-orange-950/60 border-orange-800" },
  system: { icon: Cpu, label: "Systeminfo", color: "text-violet-400", bg: "bg-violet-950/60 border-violet-800" },
  security: { icon: Shield, label: "Säkerhet", color: "text-yellow-400", bg: "bg-yellow-950/60 border-yellow-800" },
  desktop: { icon: Eye, label: "Datorstyrning", color: "text-cyan-400", bg: "bg-cyan-950/60 border-cyan-800" },
  web: { icon: Search, label: "Söker på nätet", color: "text-green-400", bg: "bg-green-950/60 border-green-800" },
  knowledge: { icon: FolderSearch, label: "Kunskapsbas", color: "text-indigo-400", bg: "bg-indigo-950/60 border-indigo-800" },
};

const BRIDGE_URL =
  import.meta.env.VITE_BRIDGE_URL ||
  (window.location.port === "5173"
    ? `${window.location.protocol}//${window.location.hostname}:3031`
    : window.location.origin);

type Tab = "chat" | "tools" | "settings";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatusEvent | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [tokenUsage, setTokenUsage] = useState({ inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 });
  const [tokenPulse, setTokenPulse] = useState(false);
  const [sendRipple, setSendRipple] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [showTunnel, setShowTunnel] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<{ used: number; budget: number } | null>(null);
  const [showSlash, setShowSlash] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const socket = io(BRIDGE_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("history", (history: Message[]) => {
      setMessages(history);
    });

    socket.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("question", (q: PendingQuestion) => {
      setPendingQuestion(q);
      if (navigator.vibrate) navigator.vibrate(200);
    });

    socket.on("agent_status", (status: AgentStatusEvent) => {
      if (status.type === "done") {
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => setAgentStatus(null), 500);
      } else {
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        setAgentStatus(status);
      }
    });

    socket.on("token_usage", (usage: typeof tokenUsage) => {
      setTokenUsage(usage);
      setTokenPulse(true);
      setTimeout(() => setTokenPulse(false), 400);
    });

    socket.on("tunnel_url", (url: string) => {
      setTunnelUrl(url);
    });

    socket.on("agent_stream", (chunk: string) => {
      setStreamingText(chunk);
    });

    socket.on("budget_warning", (data: { used: number; budget: number }) => {
      setBudgetWarning(data);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    });

    // Fetch current tunnel URL on connect
    fetch(`${BRIDGE_URL}/api/tunnel`)
      .then((r) => r.json())
      .then((d) => { if (d.url) setTunnelUrl(d.url); })
      .catch(() => {});

    return () => {
      socket.disconnect();
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "chat") scrollToBottom();
  }, [messages, scrollToBottom, activeTab]);

  const formattedTokens = useMemo(() => {
    const t = tokenUsage.totalTokens;
    if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`;
    if (t >= 1_000) return `${(t / 1_000).toFixed(1)}k`;
    return String(t);
  }, [tokenUsage.totalTokens]);

  const SLASH_COMMANDS = [
    { cmd: "/screenshot", desc: "Ta en skärmdump", action: "Ta en screenshot och beskriv vad du ser" },
    { cmd: "/search", desc: "Sök på nätet", action: "" },
    { cmd: "/files", desc: "Lista filer", action: "Lista filerna i projektets rot-mapp" },
    { cmd: "/status", desc: "Systemstatus", action: "Visa systeminfo: CPU, RAM, disk, nätverk" },
    { cmd: "/clear", desc: "Rensa chatten", action: "__clear__" },
    { cmd: "/memory", desc: "Visa minnen", action: "Lista alla sparade minnen" },
    { cmd: "/rag", desc: "Kunskapsbas", action: "Visa RAG-statistik och källor" },
  ];

  const clearConversation = async () => {
    try {
      await fetch(`${BRIDGE_URL}/api/messages`, { method: "DELETE" });
      setMessages([]);
      setStreamingText(null);
    } catch { /* ignore */ }
  };

  const sendMessage = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || !socketRef.current) return;

    // Handle slash commands
    if (msg === "/clear") {
      clearConversation();
      setInput("");
      setShowSlash(false);
      return;
    }
    const slashMatch = SLASH_COMMANDS.find((s) => msg.startsWith(s.cmd) && s.action && s.action !== "__clear__");
    const finalMsg = slashMatch
      ? (msg.length > slashMatch.cmd.length ? slashMatch.action + ": " + msg.slice(slashMatch.cmd.length).trim() : slashMatch.action)
      : msg;

    socketRef.current.emit("message", { content: finalMsg });
    setStreamingText(null);
    if (!text) {
      setInput("");
      setSendRipple(true);
      setTimeout(() => setSendRipple(false), 500);
    }
    setShowSlash(false);
    setActiveTab("chat");
  };

  const isThinking = agentStatus && agentStatus.type !== "done";

  const answerQuestion = (response: string) => {
    if (!pendingQuestion || !socketRef.current) return;
    socketRef.current.emit("answer", {
      questionId: pendingQuestion.id,
      response,
    });
    setPendingQuestion(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageIcon = (msg: Message) => {
    switch (msg.type) {
      case "notification":
        return <Bell className="w-4 h-4 text-amber-400" />;
      case "approval_request":
        return <HelpCircle className="w-4 h-4 text-blue-400" />;
      case "approval_response":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "tools", label: "Verktyg", icon: Wrench },
    { id: "settings", label: "Inställningar", icon: Settings },
  ];

  return (
    <div className="flex flex-col bg-slate-950" style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Cascade
          </div>
          {tunnelUrl && (
            <button
              onClick={() => setShowTunnel(!showTunnel)}
              className="p-1 rounded-full bg-green-950/60 border border-green-800/50 text-green-400 active:bg-green-900/60"
              title="Tunnel URL"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {tokenUsage.totalTokens > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/50 ${tokenPulse ? 'token-update' : ''}`}>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-mono text-amber-300">{formattedTokens}</span>
            </div>
          )}
          {connected ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <Wifi className="w-3.5 h-3.5" />
              <span className="animate-pulse-dot">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-400 text-xs">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </header>

      {/* Tunnel URL banner */}
      {showTunnel && tunnelUrl && (
        <div className="mx-3 mt-2 p-2.5 bg-green-950/60 border border-green-800/50 rounded-xl shrink-0 msg-cascade">
          <div className="flex items-center gap-2">
            <Link className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span className="text-xs text-green-300 font-mono truncate flex-1">{tunnelUrl}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tunnelUrl);
                if (navigator.share) {
                  navigator.share({ title: "Cascade Remote", url: tunnelUrl }).catch(() => {});
                }
              }}
              className="p-1.5 rounded-lg bg-green-900/50 active:bg-green-800/50 text-green-300 touch-manipulation shrink-0"
              title="Kopiera URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-green-600 mt-1">Tryck kopiera för att dela. URL ändras vid omstart.</p>
        </div>
      )}

      {/* Pending question banner */}
      {pendingQuestion && (
        <div className="mx-3 mt-2 p-3 bg-blue-950/80 border border-blue-700 rounded-xl shrink-0">
          <p className="text-blue-200 text-sm font-medium mb-2">
            {pendingQuestion.question}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="Skriv svar..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  answerQuestion((e.target as HTMLInputElement).value);
                }
              }}
            />
            <button
              onClick={() => answerQuestion("yes")}
              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 active:bg-emerald-500 text-white text-sm rounded-lg transition-colors touch-manipulation"
            >
              <CheckCircle className="w-4 h-4" />
              Ja
            </button>
            <button
              onClick={() => answerQuestion("no")}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 active:bg-red-500 text-white text-sm rounded-lg transition-colors touch-manipulation"
            >
              <XCircle className="w-4 h-4" />
              Nej
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "chat" && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4">
                <div className="w-16 h-16 mb-5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-400/60" />
                </div>
                <p className="text-lg font-semibold text-slate-200 mb-1">Hej! Vad kan jag hjälpa dig med?</p>
                <p className="text-xs opacity-50 mb-6">Skriv fritt eller välj ett förslag</p>
                <div className="w-full max-w-sm space-y-2">
                  {[
                    { icon: "🔍", text: "Analysera mitt system och föreslå förbättringar" },
                    { icon: "🧠", text: "Bygg en plan för mitt nästa projekt" },
                    { icon: "💡", text: "Utforska lösningar på ett svårt problem" },
                    { icon: "📸", text: "Ta en screenshot och beskriv vad du ser" },
                  ].map((s) => (
                    <button
                      key={s.text}
                      onClick={() => sendMessage(s.text)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/40 active:bg-slate-700/60 transition-all touch-manipulation group"
                    >
                      <span className="mr-2">{s.icon}</span>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${msg.role === "user" ? "msg-user" : "msg-cascade"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : msg.type === "notification"
                        ? "bg-amber-950/60 border border-amber-800 text-amber-100"
                        : msg.type === "approval_request"
                          ? "bg-blue-950/60 border border-blue-800 text-blue-100"
                          : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {getMessageIcon(msg)}
                    <span className="text-xs opacity-60">
                      {msg.role === "cascade" ? "Cascade" : "Du"} &middot;{" "}
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-code:text-emerald-300 prose-code:bg-transparent prose-a:text-blue-400">
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
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
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Streaming preview or typing indicator */}
            {isThinking && (
              <div className="flex justify-start msg-cascade">
                <div className="max-w-[85%] bg-slate-800 rounded-2xl px-4 py-2.5 text-slate-100">
                  {streamingText ? (
                    <div className="text-sm break-words prose prose-invert prose-sm max-w-none prose-p:my-1 prose-code:text-emerald-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                      <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
                      <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
                      <div className="typing-dot w-2 h-2 rounded-full bg-blue-400" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Agent Status Bar */}
          {agentStatus && (() => {
            const cfg = STATUS_CONFIG[agentStatus.category] || STATUS_CONFIG.thinking;
            const Icon = cfg.icon;
            const toolLabel = agentStatus.tool
              ? agentStatus.tool.replace(/_/g, " ")
              : "";
            return (
              <div
                className={`status-${agentStatus.category} status-bar-enter status-glow-${agentStatus.category} shrink-0 mx-3 mb-2 px-4 py-2.5 rounded-xl border ${cfg.bg} flex items-center gap-3`}
              >
                <div className="relative">
                  <Icon className={`status-icon w-5 h-5 ${cfg.color}`} />
                  {agentStatus.category === "filesystem" && (
                    <div className="scan-line" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${cfg.color} flex items-center gap-1`}>
                    {cfg.label}
                    {agentStatus.type === "tool_start" && toolLabel && (
                      <span className="text-xs opacity-60 font-normal truncate">
                        — {toolLabel}
                      </span>
                    )}
                    <span className="status-dots" />
                    {agentStatus.category === "command" && (
                      <span className="cursor-blink" />
                    )}
                  </div>
                  {agentStatus.input && (
                    <div className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                      {agentStatus.input.slice(0, 60)}
                    </div>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${cfg.color.replace('text-', 'bg-')} animate-pulse`} />
              </div>
            );
          })()}

          {/* Budget warning */}
          {budgetWarning && (
            <div className="mx-3 mb-1 px-3 py-2 bg-amber-950/60 border border-amber-800/50 rounded-xl text-amber-300 text-xs flex items-center justify-between">
              <span>⚠️ Token-budget 80% ({Math.round(budgetWarning.used / 1000)}k / {Math.round(budgetWarning.budget / 1000)}k)</span>
              <button onClick={() => setBudgetWarning(null)} className="text-amber-500 ml-2" title="Stäng">✕</button>
            </div>
          )}

          {/* Slash commands menu */}
          {showSlash && (
            <div className="mx-3 mb-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              {SLASH_COMMANDS.filter((s) => !input || s.cmd.startsWith(input)).map((s) => (
                <button
                  key={s.cmd}
                  onClick={() => { setInput(s.cmd + " "); setShowSlash(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700 active:bg-slate-600 flex items-center gap-2 border-b border-slate-700/50 last:border-0"
                >
                  <span className="text-blue-400 font-mono text-xs">{s.cmd}</span>
                  <span className="text-slate-400 text-xs">{s.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 px-3 pb-1 pt-2 bg-slate-950 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSlash(e.target.value === "/");
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  connected ? "Skriv till Cascade... ( / för kommandon)" : "Ansluter..."
                }
                disabled={!connected}
                autoComplete="off"
                enterKeyHint="send"
                className="flex-1 bg-slate-800 text-white rounded-2xl px-4 py-3.5 text-base border border-slate-700 focus:outline-none focus:border-blue-500 disabled:opacity-50 placeholder:text-slate-500"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!connected || !input.trim()}
                className="relative p-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-2xl transition-colors touch-manipulation overflow-hidden"
              >
                <Send className="w-5 h-5 relative z-10" />
                {sendRipple && <div className="send-ripple" />}
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "tools" && (
        <ToolsView onRunTool={(msg) => sendMessage(msg)} />
      )}

      {activeTab === "settings" && (
        <SettingsView />
      )}

      {/* Bottom Tab Bar */}
      <nav className="shrink-0 flex border-t border-slate-800 bg-slate-900" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors touch-manipulation ${
                isActive ? "text-blue-400" : "text-slate-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
