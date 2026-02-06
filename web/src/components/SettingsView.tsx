import { useState, useEffect } from "react";
import {
  Save, FileText, Brain, Trash2, Plus, Shield, ScrollText, ChevronDown, ChevronUp,
} from "lucide-react";

const BRIDGE_URL =
  import.meta.env.VITE_BRIDGE_URL ||
  (window.location.port === "5173"
    ? `${window.location.protocol}//${window.location.hostname}:3031`
    : window.location.origin);

interface Memory {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SettingsView() {
  const [tab, setTab] = useState<"rules" | "memories" | "security">("rules");
  const [rules, setRules] = useState("");
  const [rulesSaved, setRulesSaved] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemory, setNewMemory] = useState("");
  const [newTags, setNewTags] = useState("");
  const [auditLog, setAuditLog] = useState("");
  const [securityExpanded, setSecurityExpanded] = useState(false);
  const [securityConfig, setSecurityConfig] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (tab === "rules") {
      setRulesLoading(true);
      fetch(`${BRIDGE_URL}/api/global-rules`)
        .then((r) => r.json())
        .then((d) => { setRules(d.rules || ""); setRulesLoading(false); })
        .catch(() => setRulesLoading(false));
    } else if (tab === "memories") {
      fetch(`${BRIDGE_URL}/api/memories`)
        .then((r) => r.json())
        .then(setMemories)
        .catch(() => {});
    } else if (tab === "security") {
      fetch(`${BRIDGE_URL}/api/audit?lines=30`)
        .then((r) => r.json())
        .then((d) => setAuditLog(d.log || ""))
        .catch(() => {});
      fetch(`${BRIDGE_URL}/api/security`)
        .then((r) => r.json())
        .then(setSecurityConfig)
        .catch(() => {});
    }
  }, [tab]);

  const saveRules = () => {
    fetch(`${BRIDGE_URL}/api/global-rules`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    }).then(() => {
      setRulesSaved(true);
      setTimeout(() => setRulesSaved(false), 2000);
    });
  };

  const addMemory = () => {
    if (!newMemory.trim()) return;
    fetch(`${BRIDGE_URL}/api/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newMemory,
        tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    })
      .then((r) => r.json())
      .then((mem) => {
        setMemories((prev) => [mem, ...prev]);
        setNewMemory("");
        setNewTags("");
      });
  };

  const deleteMemoryById = (id: string) => {
    fetch(`${BRIDGE_URL}/api/memories/${id}`, { method: "DELETE" })
      .then(() => setMemories((prev) => prev.filter((m) => m.id !== id)));
  };

  const tabs = [
    { id: "rules" as const, label: "Regler", icon: FileText },
    { id: "memories" as const, label: "Minnen", icon: Brain },
    { id: "security" as const, label: "Säkerhet", icon: Shield },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex shrink-0 border-b border-slate-800 bg-slate-900/50">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors touch-manipulation ${
                tab === t.id
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-500"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto chat-scroll">
        {/* Global Rules */}
        {tab === "rules" && (
          <div className="p-3 space-y-3">
            <p className="text-xs text-slate-500">
              Globala regler som AI-agenten alltid följer. Skriv i markdown.
            </p>
            {rulesLoading ? (
              <div className="text-sm text-slate-500 text-center py-8">Laddar...</div>
            ) : (
              <>
                <textarea
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="# Mina regler&#10;&#10;- Svara alltid på svenska&#10;- Var kortfattad&#10;- ..."
                  className="w-full h-64 bg-slate-800 text-slate-200 text-sm rounded-xl px-4 py-3 border border-slate-700 focus:outline-none focus:border-blue-500 resize-none font-mono"
                />
                <button
                  onClick={saveRules}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                    rulesSaved
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 active:bg-blue-700 text-white"
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {rulesSaved ? "Sparat!" : "Spara regler"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Memories */}
        {tab === "memories" && (
          <div className="p-3 space-y-3">
            <p className="text-xs text-slate-500">
              AI-agentens minnen. Lägg till saker den ska komma ihåg.
            </p>

            {/* Add new */}
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <input
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Nytt minne..."
                className="w-full bg-slate-900 text-sm text-white rounded-lg px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Taggar (komma-separerade)"
                className="w-full bg-slate-900 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={addMemory}
                disabled={!newMemory.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 active:bg-purple-700 disabled:bg-slate-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                <Plus className="w-4 h-4" />
                Lägg till minne
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {memories.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Inga minnen sparade</p>
              )}
              {memories.map((mem) => (
                <div key={mem.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-200 flex-1">{mem.content}</p>
                    <button
                      onClick={() => deleteMemoryById(mem.id)}
                      title="Ta bort minne"
                      className="p-1.5 text-red-400 active:text-red-300 touch-manipulation shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {mem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mem.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-purple-900/40 text-purple-300 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-600 mt-1.5">
                    {new Date(mem.updatedAt).toLocaleDateString("sv-SE")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security */}
        {tab === "security" && (
          <div className="p-3 space-y-3">
            {/* Config */}
            <div className="rounded-xl border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => setSecurityExpanded(!securityExpanded)}
                className="w-full flex items-center gap-2 px-4 py-3 bg-slate-800/40 touch-manipulation"
              >
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-200 flex-1 text-left">Säkerhetskonfiguration</span>
                {securityExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {securityExpanded && securityConfig && (
                <pre className="px-4 py-3 text-xs text-slate-400 font-mono overflow-x-auto bg-slate-900/50">
                  {JSON.stringify(securityConfig, null, 2)}
                </pre>
              )}
            </div>

            {/* Audit Log */}
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <ScrollText className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-medium text-slate-300">Aktivitetslogg</h3>
              </div>
              <pre className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/30 text-xs text-slate-400 font-mono overflow-x-auto max-h-80 overflow-y-auto">
                {auditLog || "Ingen aktivitet ännu"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
