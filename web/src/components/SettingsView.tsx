import { useState, useEffect } from "react";
import {
  Save, FileText, Brain, Trash2, Plus, Shield, ScrollText, ChevronDown, ChevronUp, Database, Download,
  Globe, Upload, Zap, Eye, RefreshCw, Smartphone, Vibrate, ArrowRight, Crown,
} from "lucide-react";
import { loadHapticSettings, saveHapticSettings, hapticFeedback, type HapticSettings } from "../hooks/useMobile";
import { useAuth } from "../contexts/AuthContext";
import { BRIDGE_URL } from "../config";
import AdminPanel from "./AdminPanel";

interface Memory {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SettingsView() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<"rules" | "memories" | "knowledge" | "security" | "install" | "mobile" | "admin">("rules");
  const [hapticSettings, setHapticSettings] = useState<HapticSettings>(loadHapticSettings);
  const [downloading, setDownloading] = useState(false);
  const [rules, setRules] = useState("");
  const [rulesSaved, setRulesSaved] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [newMemory, setNewMemory] = useState("");
  const [newTags, setNewTags] = useState("");
  const [auditLog, setAuditLog] = useState("");
  const [securityExpanded, setSecurityExpanded] = useState(false);
  const [securityConfig, setSecurityConfig] = useState<Record<string, unknown> | null>(null);
  const [ragSources, setRagSources] = useState<{ id: string; name: string; type: string; chunkCount: number; totalLength: number; indexedAt: string }[]>([]);
  const [ragStatsData, setRagStatsData] = useState<{ sourceCount: number; chunkCount: number; totalChars: number; embeddedChunks?: number; autoReindex?: boolean; watchedPaths?: number } | null>(null);
  const [newRagText, setNewRagText] = useState("");
  const [newRagName, setNewRagName] = useState("");
  const [newRagUrl, setNewRagUrl] = useState("");
  const [ragUrlName, setRagUrlName] = useState("");
  const [ragLoading, setRagLoading] = useState("");
  const [ragInputMode, setRagInputMode] = useState<"text" | "url" | "pdf">("text");
  const [autoReindex, setAutoReindex] = useState(false);

  const updateHaptic = (update: Partial<HapticSettings>) => {
    const next = { ...hapticSettings, ...update };
    setHapticSettings(next);
    saveHapticSettings(next);
    if (update.enabled !== false) hapticFeedback("light");
  };

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
    } else if (tab === "knowledge") {
      fetch(`${BRIDGE_URL}/api/rag/sources`)
        .then((r) => r.json())
        .then((data) => {
          const sources = data.bm25 || data.weaviate || data;
          setRagSources(Array.isArray(sources) ? sources : []);
        })
        .catch(() => {});
      fetch(`${BRIDGE_URL}/api/rag/stats`)
        .then((r) => r.json())
        .then((data) => { setRagStatsData(data); setAutoReindex(data.autoReindex || false); })
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

  const refreshRagStats = () => {
    fetch(`${BRIDGE_URL}/api/rag/stats`).then((r) => r.json()).then((data) => { setRagStatsData(data); setAutoReindex(data.autoReindex || false); }).catch(() => {});
  };

  const addRagText = () => {
    if (!newRagText.trim() || !newRagName.trim()) return;
    setRagLoading("text");
    fetch(`${BRIDGE_URL}/api/rag/index-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newRagText, name: newRagName }),
    })
      .then((r) => r.json())
      .then((src) => {
        setRagSources((prev) => [src, ...prev]);
        setNewRagText("");
        setNewRagName("");
        refreshRagStats();
      })
      .finally(() => setRagLoading(""));
  };

  const addRagUrl = () => {
    if (!newRagUrl.trim()) return;
    setRagLoading("url");
    fetch(`${BRIDGE_URL}/api/rag/index-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newRagUrl, name: ragUrlName || undefined }),
    })
      .then((r) => { if (!r.ok) throw r; return r.json(); })
      .then((src) => {
        setRagSources((prev) => [src, ...prev]);
        setNewRagUrl("");
        setRagUrlName("");
        refreshRagStats();
      })
      .catch(() => alert("Kunde inte indexera URL:en. Kontrollera att den är tillgänglig."))
      .finally(() => setRagLoading(""));
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRagLoading("pdf");
    // Read file as base64 and send to backend
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      fetch(`${BRIDGE_URL}/api/rag/index-pdf-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: base64, name: file.name }),
      })
        .then((r) => { if (!r.ok) throw r; return r.json(); })
        .then((src) => {
          setRagSources((prev) => [src, ...prev]);
          refreshRagStats();
        })
        .catch(() => alert("Kunde inte indexera PDF:en."))
        .finally(() => setRagLoading(""));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const embedAllChunks = () => {
    setRagLoading("embed");
    fetch(`${BRIDGE_URL}/api/rag/embed`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        alert(`Embeddings: ${data.embedded} nya, ${data.skipped} redan klara, ${data.failed} misslyckade`);
        refreshRagStats();
      })
      .catch(() => alert("Embedding misslyckades. Är Ollama igång?"))
      .finally(() => setRagLoading(""));
  };

  const toggleAutoReindex = () => {
    const endpoint = autoReindex ? "stop" : "start";
    fetch(`${BRIDGE_URL}/api/rag/auto-reindex/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then((r) => r.json())
      .then(() => {
        setAutoReindex(!autoReindex);
        refreshRagStats();
      });
  };

  const deleteRagSource = (id: string) => {
    fetch(`${BRIDGE_URL}/api/rag/sources/${id}`, { method: "DELETE" })
      .then(() => {
        setRagSources((prev) => prev.filter((s) => s.id !== id));
        fetch(`${BRIDGE_URL}/api/rag/stats`).then((r) => r.json()).then(setRagStatsData).catch(() => {});
      });
  };

  const tabs = [
    { id: "rules" as const, label: "Regler", icon: FileText },
    { id: "memories" as const, label: "Minnen", icon: Brain },
    { id: "knowledge" as const, label: "RAG", icon: Database },
    { id: "security" as const, label: "Säkerhet", icon: Shield },
    { id: "mobile" as const, label: "Mobil", icon: Smartphone },
    { id: "install" as const, label: "Installera", icon: Download },
    ...(isAdmin ? [{ id: "admin" as const, label: "Admin", icon: Crown }] : []),
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

        {/* Knowledge Base (RAG) */}
        {tab === "knowledge" && (
          <div className="p-3 space-y-3">
            {ragStatsData && (
              <div className="flex gap-2">
                <div className="flex-1 p-2.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-center">
                  <div className="text-lg font-bold text-indigo-300">{ragStatsData.sourceCount}</div>
                  <div className="text-[10px] text-indigo-400">Källor</div>
                </div>
                <div className="flex-1 p-2.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-center">
                  <div className="text-lg font-bold text-indigo-300">{ragStatsData.chunkCount}</div>
                  <div className="text-[10px] text-indigo-400">Chunks</div>
                </div>
                <div className="flex-1 p-2.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-center">
                  <div className="text-lg font-bold text-indigo-300">{ragStatsData.totalChars > 1000 ? `${(ragStatsData.totalChars / 1000).toFixed(1)}k` : ragStatsData.totalChars}</div>
                  <div className="text-[10px] text-indigo-400">Tecken</div>
                </div>
                {ragStatsData.embeddedChunks !== undefined && (
                  <div className="flex-1 p-2.5 bg-purple-950/30 border border-purple-800/40 rounded-xl text-center">
                    <div className="text-lg font-bold text-purple-300">{ragStatsData.embeddedChunks}</div>
                    <div className="text-[10px] text-purple-400">Vektorer</div>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-slate-500">
              Lägg till text, PDF:er eller webbsidor i kunskapsbasen. AI:n söker automatiskt här.
            </p>

            {/* Input mode tabs */}
            <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg">
              {[
                { id: "text" as const, label: "Text", icon: FileText },
                { id: "url" as const, label: "URL", icon: Globe },
                { id: "pdf" as const, label: "PDF", icon: Upload },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setRagInputMode(m.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors touch-manipulation ${
                      ragInputMode === m.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Text input */}
            {ragInputMode === "text" && (
              <div className="space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <input
                  type="text"
                  value={newRagName}
                  onChange={(e) => setNewRagName(e.target.value)}
                  placeholder="Namn (t.ex. 'Projektdokumentation')"
                  className="w-full bg-slate-900 text-sm text-white rounded-lg px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  value={newRagText}
                  onChange={(e) => setNewRagText(e.target.value)}
                  placeholder="Klistra in text att indexera..."
                  className="w-full h-32 bg-slate-900 text-sm text-white rounded-lg px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <button
                  onClick={addRagText}
                  disabled={!newRagText.trim() || !newRagName.trim() || ragLoading === "text"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors touch-manipulation"
                >
                  {ragLoading === "text" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {ragLoading === "text" ? "Indexerar..." : "Indexera text"}
                </button>
              </div>
            )}

            {/* URL input */}
            {ragInputMode === "url" && (
              <div className="space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <input
                  type="url"
                  value={newRagUrl}
                  onChange={(e) => setNewRagUrl(e.target.value)}
                  placeholder="https://example.com/docs"
                  className="w-full bg-slate-900 text-sm text-white rounded-lg px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={ragUrlName}
                  onChange={(e) => setRagUrlName(e.target.value)}
                  placeholder="Namn (valfritt — använder domännamn om tomt)"
                  className="w-full bg-slate-900 text-xs text-white rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={addRagUrl}
                  disabled={!newRagUrl.trim() || ragLoading === "url"}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 active:bg-emerald-700 disabled:bg-slate-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors touch-manipulation"
                >
                  {ragLoading === "url" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {ragLoading === "url" ? "Hämtar..." : "Indexera webbsida"}
                </button>
              </div>
            )}

            {/* PDF upload */}
            {ragInputMode === "pdf" && (
              <div className="space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <label className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors">
                  {ragLoading === "pdf" ? (
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-400">
                    {ragLoading === "pdf" ? "Indexerar PDF..." : "Klicka eller dra en PDF hit"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    disabled={ragLoading === "pdf"}
                  />
                </label>
              </div>
            )}

            {/* Embeddings & Auto-reindex controls */}
            <div className="flex gap-2">
              <button
                onClick={embedAllChunks}
                disabled={ragLoading === "embed"}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-purple-600/80 active:bg-purple-700 disabled:bg-slate-700 disabled:opacity-50 text-white text-xs rounded-lg transition-colors touch-manipulation"
                title="Generera vektor-embeddings för alla chunks via Ollama"
              >
                {ragLoading === "embed" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {ragLoading === "embed" ? "Genererar..." : "Generera embeddings"}
              </button>
              <button
                onClick={toggleAutoReindex}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg transition-colors touch-manipulation ${
                  autoReindex
                    ? "bg-emerald-600/80 active:bg-emerald-700 text-white"
                    : "bg-slate-700 active:bg-slate-600 text-slate-300"
                }`}
                title="Automatisk re-indexering vid filändringar"
              >
                <Eye className="w-3.5 h-3.5" />
                {autoReindex ? "Auto-reindex PÅ" : "Auto-reindex AV"}
              </button>
            </div>

            {/* Source list */}
            <div className="space-y-2">
              {ragSources.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Kunskapsbasen är tom</p>
              )}
              {ragSources.map((src) => (
                <div key={src.id} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {src.type === "pdf" && <FileText className="w-3.5 h-3.5 text-red-400" />}
                        {src.type === "url" && <Globe className="w-3.5 h-3.5 text-emerald-400" />}
                        {src.type === "file" && <FileText className="w-3.5 h-3.5 text-blue-400" />}
                        {src.type === "text" && <FileText className="w-3.5 h-3.5 text-slate-400" />}
                        <p className="text-sm font-medium text-slate-200">{src.name}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {src.type} · {src.chunkCount} chunks · {src.totalLength > 1000 ? `${(src.totalLength / 1000).toFixed(1)}k` : src.totalLength} tecken
                      </p>
                    </div>
                    <button
                      onClick={() => deleteRagSource(src.id)}
                      title="Ta bort källa"
                      className="p-1.5 text-red-400 active:text-red-300 touch-manipulation shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {new Date(src.indexedAt).toLocaleDateString("sv-SE")}
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

        {/* Mobile Settings */}
        {tab === "mobile" && (
          <div className="p-3 space-y-3">
            <p className="text-xs text-slate-500">
              Konfigurera mobil-specifika funktioner: haptic feedback, offline-läge och PWA.
            </p>

            {/* Haptic Feedback */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-slate-200">Haptic feedback</span>
                </div>
                <button
                  onClick={() => updateHaptic({ enabled: !hapticSettings.enabled })}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors touch-manipulation ${
                    hapticSettings.enabled ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {hapticSettings.enabled ? "PÅ" : "AV"}
                </button>
              </div>

              {hapticSettings.enabled && (
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Vibrera vid</div>
                  {([
                    { key: "onMessage" as const, label: "AI-svar", desc: "Kort vibration vid nytt svar" },
                    { key: "onThinking" as const, label: "AI tänker", desc: "Subtil puls när AI börjar tänka" },
                    { key: "onDone" as const, label: "Klar", desc: "Bekräftelse när uppgift är klar" },
                    { key: "onError" as const, label: "Fel/varning", desc: "Stark vibration vid fel" },
                    { key: "onQuestion" as const, label: "Fråga", desc: "AI ber om godkännande" },
                  ]).map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-xs text-slate-300">{item.label}</span>
                        <span className="text-[10px] text-slate-600 ml-2">{item.desc}</span>
                      </div>
                      <button
                        onClick={() => updateHaptic({ [item.key]: !hapticSettings[item.key] })}
                        title={`Växla ${item.label}`}
                        className={`w-8 h-4 rounded-full transition-colors relative ${
                          hapticSettings[item.key] ? "bg-purple-600" : "bg-slate-700"
                        }`}
                      >
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                          hapticSettings[item.key] ? "translate-x-4" : "translate-x-0.5"
                        }`} />
                      </button>
                    </div>
                  ))}

                  <div className="pt-2">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Intensitet</div>
                    <div className="flex gap-1">
                      {(["light", "medium", "heavy"] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => updateHaptic({ intensity: level })}
                          className={`flex-1 py-1.5 text-[10px] rounded-lg transition-colors touch-manipulation ${
                            hapticSettings.intensity === level
                              ? "bg-purple-600 text-white"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {level === "light" ? "Lätt" : level === "medium" ? "Normal" : "Stark"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => hapticFeedback(hapticSettings.intensity)}
                    className="w-full py-2 bg-purple-600/30 border border-purple-800/40 text-purple-300 text-xs rounded-lg active:bg-purple-600/50 transition-colors touch-manipulation"
                  >
                    Testa vibration
                  </button>
                </div>
              )}
            </div>

            {/* Offline Info */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-200">Offline-läge</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 ml-auto">Automatiskt</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Konversationer cachas automatiskt för offline-läsning. Meddelanden som skickas offline köas och skickas när du är online igen.
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-slate-900/50 rounded-lg">
                  <div className="text-xs font-bold text-slate-300">{navigator.onLine ? "Online" : "Offline"}</div>
                  <div className="text-[10px] text-slate-500">Status</div>
                </div>
                <div className="p-2 bg-slate-900/50 rounded-lg">
                  <div className="text-xs font-bold text-slate-300">
                    {(() => { try { return JSON.parse(localStorage.getItem("cascade_offline_conversations") || "[]").length; } catch { return 0; } })()}
                  </div>
                  <div className="text-[10px] text-slate-500">Cachade meddelanden</div>
                </div>
              </div>
            </div>

            {/* PWA Shortcuts Info */}
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-200">PWA & Genvägar</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Installera appen för snabb-genvägar: Ny fråga, Screenshot, Sök. Dela innehåll till Gracestack från andra appar via "Dela"-menyn.
              </p>
              <div className="space-y-1">
                {[
                  { label: "Ny fråga", desc: "Öppna chatten direkt" },
                  { label: "Screenshot", desc: "Ta skärmdump och analysera" },
                  { label: "Sök på nätet", desc: "AI-driven webbsökning" },
                  { label: "Dela till Gracestack", desc: "Skicka text/URL från andra appar" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 py-0.5">
                    <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-[10px] text-slate-300">{s.label}</span>
                    <span className="text-[10px] text-slate-600">— {s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Install / Download */}
        {tab === "install" && (
          <div className="p-3 space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-950/40 to-indigo-950/40 border border-blue-800/40 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Ladda ner Gracestack AI Lab</h3>
                  <p className="text-xs text-blue-300">Installera på en annan dator</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Laddar ner hela appen som en .zip-fil. Innehåller källkod, setup-script och allt du behöver.
                API-nycklar ingår <strong className="text-yellow-400">inte</strong> — du fyller i dem efter installation.
              </p>
              <button
                onClick={() => {
                  setDownloading(true);
                  const a = document.createElement("a");
                  a.href = `${BRIDGE_URL}/api/download`;
                  a.download = "gracestack-ai-lab.zip";
                  a.click();
                  setTimeout(() => setDownloading(false), 3000);
                }}
                disabled={downloading}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                  downloading
                    ? "bg-blue-800 text-blue-300 cursor-wait"
                    : "bg-blue-600 active:bg-blue-700 text-white"
                }`}
              >
                <Download className="w-4 h-4" />
                {downloading ? "Laddar ner..." : "Ladda ner .zip"}
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Installationsguide</h4>

              <div className="space-y-2">
                {[
                  { step: "1", title: "Packa upp zip-filen", desc: "Extrahera gracestack-ai-lab.zip till valfri mapp" },
                  { step: "2", title: "Kör setup.bat", desc: "Dubbelklicka på setup.bat — installerar alla beroenden automatiskt" },
                  { step: "3", title: "Fyll i API-nycklar", desc: "Öppna bridge/.env och lägg till ANTHROPIC_API_KEY och GEMINI_API_KEY" },
                  { step: "4", title: "Starta servern", desc: "Dubbelklicka på start.bat — öppna sedan http://localhost:3031" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                    <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-yellow-950/30 border border-yellow-800/40 rounded-xl">
              <p className="text-xs text-yellow-300 font-medium mb-1">Krav</p>
              <ul className="text-xs text-yellow-400/80 space-y-1">
                <li>• Node.js 18+ (ladda ner från nodejs.org)</li>
                <li>• Windows 10/11, macOS eller Linux</li>
                <li>• API-nyckel för Claude och/eller Gemini</li>
              </ul>
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {tab === "admin" && isAdmin && <AdminPanel />}
      </div>
    </div>
  );
}
