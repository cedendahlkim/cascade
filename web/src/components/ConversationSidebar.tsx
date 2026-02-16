import { useState } from "react";
import { Plus, MessageCircle, Swords, Zap, Brain, Trash2, ChevronLeft, Clock, FlaskConical } from "lucide-react";

export interface Conversation {
  id: string;
  title: string;
  tab: "chat" | "gemini" | "arena" | "lab";
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview: string;
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  tab: "chat" | "gemini" | "arena" | "lab";
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const TAB_CONFIG: Record<string, { icon: React.ElementType; label: string; newLabel: string; color: string; accent: string }> = {
  chat: { icon: Brain, label: "Claude-chattar", newLabel: "Ny chatt", color: "text-blue-400", accent: "bg-blue-600" },
  gemini: { icon: Zap, label: "Gemini-chattar", newLabel: "Ny chatt", color: "text-violet-400", accent: "bg-violet-600" },
  arena: { icon: Swords, label: "Forskningsstudier", newLabel: "Ny studie", color: "text-amber-400", accent: "bg-amber-600" },
  lab: { icon: FlaskConical, label: "Lab-sessioner", newLabel: "Ny session", color: "text-emerald-400", accent: "bg-emerald-600" },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d sedan`;
  return new Date(ts).toLocaleDateString("sv-SE", { month: "short", day: "numeric" });
}

export default function ConversationSidebar({ conversations, activeId, tab, onSelect, onNew, onDelete, onClose }: ConversationSidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const cfg = TAB_CONFIG[tab];
  const TabIcon = cfg.icon;

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="absolute inset-0 z-50 flex">
      {/* Sidebar panel */}
      <div className="w-[280px] max-w-[80vw] bg-slate-900 border-r border-slate-700/50 flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TabIcon className={`w-4 h-4 ${cfg.color}`} />
            <span className="text-sm font-semibold text-slate-200">{cfg.label}</span>
            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">{sorted.length}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Stäng"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* New conversation button */}
        <div className="px-3 py-2">
          <button
            onClick={() => { onNew(); onClose(); }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl ${cfg.accent} hover:opacity-90 active:opacity-80 text-white text-sm font-medium transition-all touch-manipulation`}
          >
            <Plus className="w-4 h-4" />
            {cfg.newLabel}
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Inga konversationer ännu</p>
            </div>
          ) : (
            sorted.map((conv) => (
              <div
                key={conv.id}
                className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                  conv.id === activeId
                    ? "bg-slate-700/80 border border-slate-600/50"
                    : "hover:bg-slate-800/60 border border-transparent"
                }`}
                onClick={() => { onSelect(conv.id); onClose(); }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${conv.id === activeId ? "text-white" : "text-slate-300"}`}>
                      {conv.title || "Namnlös konversation"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {conv.preview || "Tom konversation"}
                    </p>
                  </div>
                  {/* Delete button */}
                  {confirmDelete === conv.id ? (
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { onDelete(conv.id); setConfirmDelete(null); }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-500"
                      >
                        Ta bort
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(conv.id); }}
                      className="p-1 rounded text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-slate-700/50 transition-all shrink-0"
                      title="Ta bort"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-2.5 h-2.5 text-slate-600" />
                  <span className="text-[10px] text-slate-600">{timeAgo(conv.updatedAt)}</span>
                  <span className="text-[10px] text-slate-600">&middot; {conv.messageCount} meddelanden</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    </div>
  );
}
