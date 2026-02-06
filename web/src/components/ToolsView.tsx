import { useState, useEffect } from "react";
import {
  Eye, Monitor, FolderOpen, Terminal,
  Cpu, Shield, Brain, RefreshCw, Camera, Play,
  Globe, Code, Search, Download,
} from "lucide-react";

interface ToolCategory {
  name: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  tools: string[];
}

const BRIDGE_URL =
  import.meta.env.VITE_BRIDGE_URL ||
  (window.location.port === "5173"
    ? `${window.location.protocol}//${window.location.hostname}:3031`
    : window.location.origin);

const ICON_MAP: Record<string, React.ElementType> = {
  web: Globe,
  code: Code,
  desktop: Eye,
  filesystem: FolderOpen,
  process: Cpu,
  memory: Brain,
  security: Shield,
};

const COLOR_MAP: Record<string, { color: string; bg: string }> = {
  web: { color: "text-green-400", bg: "bg-green-950/40 border-green-800/50" },
  code: { color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/50" },
  desktop: { color: "text-cyan-400", bg: "bg-cyan-950/40 border-cyan-800/50" },
  filesystem: { color: "text-blue-400", bg: "bg-blue-950/40 border-blue-800/50" },
  process: { color: "text-orange-400", bg: "bg-orange-950/40 border-orange-800/50" },
  memory: { color: "text-purple-400", bg: "bg-purple-950/40 border-purple-800/50" },
  security: { color: "text-yellow-400", bg: "bg-yellow-950/40 border-yellow-800/50" },
};

interface ToolsViewProps {
  onRunTool: (message: string) => void;
}

export default function ToolsView({ onRunTool }: ToolsViewProps) {
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [status, setStatus] = useState<{ connected: boolean; clientCount: number } | null>(null);

  useEffect(() => {
    fetch(`${BRIDGE_URL}/api/tools`)
      .then((r) => r.json())
      .then((data) => {
        const cats: ToolCategory[] = Object.entries(data).map(([key, tools]) => ({
          name: key,
          icon: ICON_MAP[key] || Monitor,
          color: COLOR_MAP[key]?.color || "text-slate-400",
          bg: COLOR_MAP[key]?.bg || "bg-slate-800/40 border-slate-700/50",
          tools: tools as string[],
        }));
        setCategories(cats);
      })
      .catch(() => {});

    fetch(`${BRIDGE_URL}/api/status`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  const quickActions = [
    { label: "Sök på nätet", icon: Search, msg: "sök på internet efter: " },
    { label: "Ta screenshot", icon: Camera, msg: "ta en screenshot och beskriv vad du ser" },
    { label: "Kör kod", icon: Code, msg: "kör denna JavaScript-kod: " },
    { label: "Systeminfo", icon: Cpu, msg: "visa systeminfo" },
    { label: "Ladda ner fil", icon: Download, msg: "ladda ner filen från: " },
    { label: "Kör kommando", icon: Terminal, msg: "kör kommandot: " },
  ];

  return (
    <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-4">
      {/* Status */}
      {status && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${status.connected ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-400" : "bg-red-950/30 border-red-800/50 text-red-400"} text-sm`}>
          <div className={`w-2 h-2 rounded-full ${status.connected ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
          {status.connected ? `Ansluten (${status.clientCount} klient${status.clientCount > 1 ? "er" : ""})` : "Ej ansluten"}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Snabbkommandon</h2>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => onRunTool(action.msg)}
              className="flex items-center gap-2.5 px-3 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-left active:bg-slate-700/60 transition-colors touch-manipulation"
            >
              <action.icon className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="text-sm text-slate-200">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tool Categories */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Alla verktyg</h2>
        <div className="space-y-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isOpen = expanded === cat.name;
            return (
              <div key={cat.name} className={`rounded-xl border ${cat.bg} overflow-hidden`}>
                <button
                  onClick={() => setExpanded(isOpen ? null : cat.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 touch-manipulation"
                >
                  <Icon className={`w-5 h-5 ${cat.color}`} />
                  <span className={`text-sm font-medium ${cat.color} capitalize flex-1 text-left`}>
                    {cat.name}
                  </span>
                  <span className="text-xs text-slate-500">{cat.tools.length} verktyg</span>
                  <Play className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 space-y-1">
                    {cat.tools.map((tool) => (
                      <button
                        key={tool}
                        onClick={() => onRunTool(`använd verktyget ${tool}`)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/50 text-xs text-slate-300 font-mono active:bg-slate-700/50 touch-manipulation"
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
