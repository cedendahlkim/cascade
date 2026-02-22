import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Loader2, RefreshCw, Zap, Brain, Shield, Globe, Terminal,
  MessageSquare, Settings, ChevronDown, ChevronUp, Copy, Check,
  Wifi, WifiOff, Code, Search, Eye, Database, TrendingUp,
  FileText, Bot, Sparkles, Activity, Server, Lock,
} from "lucide-react";
import { BRIDGE_URL } from "../config";

interface OpenClawMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  timestamp: string;
  channel: string;
  source?: string;
}

interface Skill {
  name: string;
  description: string;
  enabled: boolean;
}

interface OpenClawStatus {
  installed: boolean;
  gatewayOnline: boolean;
  gatewayUrl: string;
  model: string;
  channels: string[];
  conversationCount: number;
  skillCount: number;
  geminiEnabled: boolean;
  lastCheck: number;
}

const SKILL_ICONS: Record<string, typeof Brain> = {
  "gemini-chat": Zap,
  "frankenstein": Brain,
  "kali-tools": Shield,
  "code-editor": Code,
  "web-search": Search,
  "file-manager": FileText,
  "rag-search": Database,
  "trading": TrendingUp,
  "vision": Eye,
  "memory": Database,
};

const QUICK_PROMPTS = [
  { icon: "🔍", text: "Analysera säkerheten på min server" },
  { icon: "💻", text: "Hjälp mig skriva en Python-funktion" },
  { icon: "🧠", text: "Vad kan Frankenstein hjälpa mig med?" },
  { icon: "📊", text: "Ge mig en översikt av mina projekt" },
  { icon: "🦞", text: "Vilka skills har du tillgängliga?" },
  { icon: "🔐", text: "Kör en snabb säkerhetsskanning med Kali" },
];

export default function OpenClawView() {
  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [messages, setMessages] = useState<OpenClawMessage[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<"chat" | "skills" | "config">("chat");
  const [showSkills, setShowSkills] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch status + conversations + skills on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statusRes, convRes, skillsRes] = await Promise.all([
          fetch(`${BRIDGE_URL}/api/openclaw/status`).catch(() => null),
          fetch(`${BRIDGE_URL}/api/openclaw/conversations?limit=50`).catch(() => null),
          fetch(`${BRIDGE_URL}/api/openclaw/skills`).catch(() => null),
        ]);
        if (statusRes?.ok) setStatus(await statusRes.json());
        if (convRes?.ok) {
          const data = await convRes.json();
          setMessages(data.conversations || []);
        }
        if (skillsRes?.ok) {
          const data = await skillsRes.json();
          setSkills(data.skills || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/openclaw/status`);
      if (res.ok) setStatus(await res.json());
    } catch { /* ignore */ }
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);

    // Optimistic add
    const userMsg: OpenClawMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      message: msg,
      timestamp: new Date().toISOString(),
      channel: "webchat",
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${BRIDGE_URL}/api/openclaw/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, channel: "webchat" }),
      });
      const data = await res.json();
      if (res.ok && data.response) {
        const assistantMsg: OpenClawMessage = {
          id: `msg-${Date.now()}-reply`,
          role: "assistant",
          message: data.response,
          timestamp: new Date().toISOString(),
          channel: "webchat",
          source: data.source,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          message: `❌ ${data.error || "Kunde inte nå OpenClaw"}`,
          timestamp: new Date().toISOString(),
          channel: "webchat",
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-err`,
        role: "assistant",
        message: "❌ Kunde inte ansluta till servern",
        timestamp: new Date().toISOString(),
        channel: "webchat",
      }]);
    } finally {
      setSending(false);
    }
  }, [input, sending]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-950 to-slate-900">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Ansluter till OpenClaw...</p>
      </div>
    );
  }

  const isOnline = status?.gatewayOnline;
  const hasGemini = status?.geminiEnabled;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-orange-900/30 bg-gradient-to-r from-slate-900 via-orange-950/20 to-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="text-2xl">🦞</span>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                isOnline ? "bg-emerald-400" : hasGemini ? "bg-amber-400" : "bg-red-400"
              }`} />
            </div>
            <div>
              <h2 className="text-sm font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                OpenClaw
              </h2>
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <Wifi className="w-2.5 h-2.5" /> Gateway aktiv
                  </span>
                ) : hasGemini ? (
                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> Gemini-läge
                  </span>
                ) : (
                  <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                    <WifiOff className="w-2.5 h-2.5" /> Offline
                  </span>
                )}
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-slate-500">{status?.model || "gemini-2.0-flash"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={refreshStatus} className="p-1.5 text-slate-500 hover:text-orange-400 transition-colors" title="Uppdatera status">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActivePanel("skills")}
              className={`p-1.5 rounded-lg transition-colors ${activePanel === "skills" ? "bg-orange-600/20 text-orange-300" : "text-slate-500 hover:text-orange-400"}`}
              title="Skills"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActivePanel("config")}
              className={`p-1.5 rounded-lg transition-colors ${activePanel === "config" ? "bg-orange-600/20 text-orange-300" : "text-slate-500 hover:text-orange-400"}`}
              title="Inställningar"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActivePanel("chat")}
              className={`p-1.5 rounded-lg transition-colors ${activePanel === "chat" ? "bg-orange-600/20 text-orange-300" : "text-slate-500 hover:text-orange-400"}`}
              title="Chatt"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="shrink-0 px-3 py-1.5 border-b border-slate-800/40 bg-slate-900/40 flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <Server className="w-3 h-3 text-slate-600" />
          <span className={isOnline ? "text-emerald-400" : "text-slate-500"}>
            Gateway: {isOnline ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-slate-600" />
          <span className={hasGemini ? "text-amber-400" : "text-slate-500"}>
            Gemini: {hasGemini ? "Aktiv" : "Ej konfigurerad"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-slate-600" />
          <span className="text-purple-400">Frankenstein: Ansluten</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Activity className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500">{skills.length} skills</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        {activePanel === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-5xl mb-4">🦞</span>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-1">
                    OpenClaw + Gemini
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-6 text-center max-w-xs">
                    Din personliga AI-assistent. Drivs av Google Gemini med Frankenstein AI-integration.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                    {QUICK_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(p.text)}
                        disabled={sending}
                        title={p.text}
                        className="flex items-center gap-2 p-2.5 bg-slate-800/50 hover:bg-orange-900/20 border border-slate-700/30 hover:border-orange-700/30 rounded-xl transition-all text-left disabled:opacity-40"
                      >
                        <span className="text-base">{p.icon}</span>
                        <span className="text-[10px] text-slate-300 line-clamp-2">{p.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] group ${
                    msg.role === "user"
                      ? "bg-orange-900/30 border border-orange-700/20 rounded-2xl rounded-br-md"
                      : "bg-slate-800/50 border border-slate-700/20 rounded-2xl rounded-bl-md"
                  } px-3 py-2`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">🦞</span>
                        <span className="text-[9px] text-orange-400 font-medium">OpenClaw</span>
                        {msg.source && (
                          <span className="text-[8px] text-slate-600 bg-slate-800 px-1 rounded">
                            via {msg.source === "gemini-fallback" ? "Gemini" : msg.source}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[8px] text-slate-600">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => copyText(msg.message, msg.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-white transition-all"
                          title="Kopiera"
                        >
                          {copied === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/50 border border-slate-700/20 rounded-2xl rounded-bl-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                      <span className="text-[11px] text-orange-400 animate-pulse">OpenClaw tänker...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-3 py-2 border-t border-slate-800/50 bg-slate-900/60">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Skriv till OpenClaw..."
                  disabled={sending}
                  className="flex-1 bg-slate-800/60 border border-orange-900/20 rounded-xl px-3 py-2 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/40"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending}
                  title="Skicka meddelande"
                  className="px-3 py-2 bg-gradient-to-r from-orange-600/40 to-red-600/40 hover:from-orange-600/60 hover:to-red-600/60 text-orange-200 rounded-xl disabled:opacity-30 transition-all"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Skills panel */}
        {activePanel === "skills" && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] font-bold text-orange-300">Skills & Förmågor</h3>
              <span className="text-[10px] text-slate-500">{skills.filter(s => s.enabled).length}/{skills.length} aktiva</span>
            </div>
            {skills.map((skill) => {
              const Icon = SKILL_ICONS[skill.name] || Bot;
              return (
                <div
                  key={skill.name}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    skill.enabled
                      ? "bg-slate-800/40 border-orange-700/20 hover:border-orange-600/30"
                      : "bg-slate-900/30 border-slate-800/30 opacity-50"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${skill.enabled ? "bg-orange-900/30" : "bg-slate-800/50"}`}>
                    <Icon className={`w-4 h-4 ${skill.enabled ? "text-orange-400" : "text-slate-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-white">{skill.name}</span>
                      {skill.enabled && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-emerald-900/40 text-emerald-300 rounded-full">aktiv</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{skill.description}</p>
                  </div>
                </div>
              );
            })}

            {/* Frankenstein integration card */}
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-700/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🧟</span>
                <div>
                  <h4 className="text-[11px] font-bold text-purple-300">Frankenstein AI</h4>
                  <span className="text-[9px] text-purple-500">Kognitiv assistent integrerad med OpenClaw</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Frankenstein kan analysera säkerhetsresultat, föreslå kodförbättringar, och samarbeta med OpenClaw
                för autonoma workflows. Använd "Fråga Frankenstein..." i chatten.
              </p>
            </div>

            {/* Gemini integration card */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-700/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="text-[11px] font-bold text-amber-300">Google Gemini</h4>
                  <span className="text-[9px] text-amber-500">{status?.model || "gemini-2.0-flash"}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                OpenClaw använder Gemini som sin primära LLM-motor. 1M token context window,
                multimodal (text + bild), och snabb responstid.
              </p>
            </div>
          </div>
        )}

        {/* Config panel */}
        {activePanel === "config" && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            <h3 className="text-[12px] font-bold text-orange-300 mb-2">Konfiguration</h3>

            {/* Status cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Server className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-400">Gateway</span>
                </div>
                <span className={`text-[12px] font-bold ${isOnline ? "text-emerald-400" : "text-red-400"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
                <p className="text-[9px] text-slate-600 mt-0.5 truncate">{status?.gatewayUrl}</p>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-400">LLM</span>
                </div>
                <span className="text-[12px] font-bold text-amber-400">Gemini</span>
                <p className="text-[9px] text-slate-600 mt-0.5">{status?.model}</p>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-400">Meddelanden</span>
                </div>
                <span className="text-[12px] font-bold text-white">{messages.length}</span>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-400">Skills</span>
                </div>
                <span className="text-[12px] font-bold text-white">{skills.filter(s => s.enabled).length}</span>
              </div>
            </div>

            {/* Setup guide */}
            <div className="p-3 bg-slate-800/30 border border-slate-700/20 rounded-xl">
              <h4 className="text-[11px] font-bold text-white mb-2">Installera OpenClaw Gateway (valfritt)</h4>
              <div className="space-y-1.5 text-[10px] text-slate-400 font-mono">
                <p className="text-slate-500"># Installera OpenClaw</p>
                <p className="text-orange-300">npm install -g openclaw@latest</p>
                <p className="text-slate-500"># Konfigurera med Gemini</p>
                <p className="text-orange-300">openclaw onboard --auth-choice google-api-key</p>
                <p className="text-slate-500"># Starta gateway</p>
                <p className="text-orange-300">openclaw gateway --port 18789</p>
              </div>
              <p className="text-[9px] text-slate-600 mt-2">
                Utan gateway används Gemini API direkt. Gateway ger extra funktioner som meddelandekanaler och persistent minne.
              </p>
            </div>

            {/* Supported channels */}
            <div className="p-3 bg-slate-800/30 border border-slate-700/20 rounded-xl">
              <h4 className="text-[11px] font-bold text-white mb-2">Kanaler (med Gateway)</h4>
              <div className="flex flex-wrap gap-1.5">
                {["WhatsApp", "Telegram", "Discord", "Slack", "Signal", "iMessage", "WebChat", "Teams"].map(ch => (
                  <span key={ch} className="text-[9px] px-2 py-0.5 bg-slate-700/40 text-slate-400 rounded-full border border-slate-600/20">
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            {/* Supported models */}
            <div className="p-3 bg-slate-800/30 border border-slate-700/20 rounded-xl">
              <h4 className="text-[11px] font-bold text-white mb-2">Modeller</h4>
              <div className="space-y-1.5">
                {[
                  { name: "Gemini 2.0 Flash", ctx: "1M tokens", desc: "Snabb, hög frekvens", active: true },
                  { name: "Gemini 1.5 Pro", ctx: "2M tokens", desc: "Komplex resonering", active: false },
                  { name: "Claude Opus 4.6", ctx: "200K tokens", desc: "Djup analys", active: false },
                  { name: "GPT-4o", ctx: "128K tokens", desc: "Multimodal", active: false },
                ].map(m => (
                  <div key={m.name} className={`flex items-center justify-between p-2 rounded-lg ${m.active ? "bg-orange-900/20 border border-orange-700/20" : "bg-slate-800/20"}`}>
                    <div>
                      <span className={`text-[10px] font-medium ${m.active ? "text-orange-300" : "text-slate-400"}`}>{m.name}</span>
                      <span className="text-[9px] text-slate-600 ml-2">{m.desc}</span>
                    </div>
                    <span className="text-[9px] text-slate-600">{m.ctx}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
