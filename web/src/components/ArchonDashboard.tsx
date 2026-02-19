/**
 * ArchonDashboard — Knowledge Base management dashboard (Archon-inspired).
 *
 * Tabs: Overview, Sources, Search, Tasks, Projects
 * API: /api/archon/*
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Database, Search, ListTodo, FolderKanban,
  Plus, Trash2, RefreshCw, Loader2, Globe, FileText,
  CheckCircle, AlertCircle, Clock, ArrowUpRight, ArrowRight, X,
  Brain, Zap, BarChart3, MessageCircle, Send, StopCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BRIDGE_URL } from "../config";

// ── Types ──

interface KBSource {
  id: string;
  title: string;
  url: string | null;
  source_type: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface KBSearchResult {
  id: string;
  content: string;
  url: string | null;
  section_title: string | null;
  word_count: number;
  source_id: string;
  similarity: number;
}

interface ArchonTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  project_id: string | null;
  assignee: string | null;
  created_at: string;
  updated_at: string;
}

interface ArchonProject {
  id: string;
  title: string;
  description: string | null;
  github_repo: string | null;
  created_at: string;
}

interface KBStats {
  sources: number;
  chunks: number;
  code_examples: number;
  projects: number;
  tasks: number;
  tasks_by_status: Record<string, number>;
}

type Tab = "overview" | "sources" | "search" | "tasks" | "projects" | "chat";

// ── Helpers ──

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just nu";
  if (mins < 60) return `${mins}m sedan`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h sedan`;
  const days = Math.floor(hrs / 24);
  return `${days}d sedan`;
}

const STATUS_COLORS: Record<string, string> = {
  ready: "bg-green-500/15 text-green-400 border-green-500/30",
  crawling: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  pending: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  todo: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  done: "bg-green-500/15 text-green-400 border-green-500/30",
  blocked: "bg-red-500/15 text-red-400 border-red-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-yellow-400",
  low: "text-slate-400",
};

// ── Component ──

export default function ArchonDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<KBStats | null>(null);
  const [sources, setSources] = useState<KBSource[]>([]);
  const [tasks, setTasks] = useState<ArchonTask[]>([]);
  const [projects, setProjects] = useState<ArchonProject[]>([]);
  const [loading, setLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KBSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Crawl
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlTitle, setCrawlTitle] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<string | null>(null);

  // New task
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [showNewTask, setShowNewTask] = useState(false);

  // New project
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string; sources?: string[]; kbCount?: number }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatStreamText, setChatStreamText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── API calls ──

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/archon/stats`);
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/archon/sources`);
      if (res.ok) { const d = await res.json(); setSources(d.sources || []); }
    } catch { /* ignore */ }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/archon/tasks`);
      if (res.ok) { const d = await res.json(); setTasks(d.tasks || []); }
    } catch { /* ignore */ }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/archon/projects`);
      if (res.ok) { const d = await res.json(); setProjects(d.projects || []); }
    } catch { /* ignore */ }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadSources(), loadTasks(), loadProjects()]);
    setLoading(false);
  }, [loadStats, loadSources, loadTasks, loadProjects]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/archon/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, top_k: 10 }),
      });
      if (res.ok) { const d = await res.json(); setSearchResults(d.results || []); }
    } catch { /* ignore */ }
    finally { setSearching(false); }
  };

  const doCrawl = async () => {
    if (!crawlUrl.trim()) return;
    setCrawling(true);
    setCrawlResult(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/archon/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: crawlUrl, title: crawlTitle || crawlUrl }),
      });
      if (res.ok) {
        const d = await res.json();
        setCrawlResult(`✓ ${d.chunks_created} chunks, ${d.code_examples} kodexempel (${d.text_length} tecken)`);
        setCrawlUrl("");
        setCrawlTitle("");
        loadSources();
        loadStats();
      } else {
        const err = await res.json().catch(() => ({ error: "Crawl failed" }));
        setCrawlResult(`✗ ${err.error}`);
      }
    } catch (err) { setCrawlResult(`✗ ${err}`); }
    finally { setCrawling(false); }
  };

  const deleteSource = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/archon/sources/${id}`, { method: "DELETE" });
    loadSources();
    loadStats();
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch(`${BRIDGE_URL}/api/archon/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle, description: newTaskDesc, priority: newTaskPriority }),
    });
    setNewTaskTitle("");
    setNewTaskDesc("");
    setShowNewTask(false);
    loadTasks();
    loadStats();
  };

  const updateTaskStatus = async (id: string, status: string) => {
    await fetch(`${BRIDGE_URL}/api/archon/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadTasks();
    loadStats();
  };

  const deleteTask = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/archon/tasks/${id}`, { method: "DELETE" });
    loadTasks();
    loadStats();
  };

  const createProject = async () => {
    if (!newProjTitle.trim()) return;
    await fetch(`${BRIDGE_URL}/api/archon/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newProjTitle, description: newProjDesc }),
    });
    setNewProjTitle("");
    setNewProjDesc("");
    setShowNewProject(false);
    loadProjects();
    loadStats();
  };

  // Chat: auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatStreamText]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatStreaming) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatStreaming(true);
    setChatStreamText("");

    const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
    const controller = new AbortController();
    abortRef.current = controller;

    let fullText = "";
    let sources: string[] = [];
    let kbCount = 0;

    try {
      const res = await fetch(`${BRIDGE_URL}/api/archon/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: "❌ Fel vid anslutning till Archon." }]);
        setChatStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "text") {
              fullText += data.text;
              setChatStreamText(fullText);
            } else if (data.type === "sources") {
              sources = data.sources;
            } else if (data.type === "kb_count") {
              kbCount = data.count;
            } else if (data.type === "error") {
              fullText += `\n\n❌ ${data.error}`;
              setChatStreamText(fullText);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        fullText += "\n\n❌ Anslutningsfel.";
      }
    }

    setChatMessages((prev) => [...prev, { role: "assistant", content: fullText || "Inget svar.", sources, kbCount }]);
    setChatStreamText("");
    setChatStreaming(false);
    abortRef.current = null;
  };

  const stopChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  // ── Render helpers ──

  const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) => (
    <div className="bg-[#161b22] border border-slate-700/40 rounded-xl p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
        <div className="text-[11px] text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "chat", label: "Chatt", icon: MessageCircle },
    { id: "overview", label: "Översikt", icon: BarChart3 },
    { id: "sources", label: "Källor", icon: Database },
    { id: "search", label: "Sök", icon: Search },
    { id: "tasks", label: "Uppgifter", icon: ListTodo },
    { id: "projects", label: "Projekt", icon: FolderKanban },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-slate-700/40 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-400" />
          <span className="text-sm font-bold text-slate-200">Archon</span>
          <span className="text-[10px] bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full font-medium">Knowledge Base</span>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="ml-auto p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
          title="Uppdatera"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex gap-1 px-4 py-2 border-b border-slate-700/30 bg-[#0d1117]">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
                tab === t.id
                  ? "bg-violet-500/15 text-violet-400"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ═══ CHAT ═══ */}
      {tab === "chat" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
            {chatMessages.length === 0 && !chatStreaming && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <Brain className="w-12 h-12 text-violet-500/30 mb-4" />
                <h3 className="text-sm font-semibold text-slate-400 mb-1">Frankenstein × Archon</h3>
                <p className="text-xs text-slate-600 max-w-md">
                  Ställ en fråga — Frankenstein söker automatiskt i kunskapsbasen och svarar baserat på crawlad dokumentation.
                </p>
                <div className="flex flex-wrap gap-2 mt-4 max-w-lg justify-center">
                  {["Hitta all information om AI-utveckling", "Vilka kodexempel finns i kunskapsbasen?", "Sammanfatta dokumentationen om Python", "Hur fungerar React hooks?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="text-[11px] px-3 py-1.5 bg-violet-500/10 text-violet-400 rounded-lg hover:bg-violet-500/20 transition-colors border border-violet-500/20"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-violet-500/20 text-violet-100 border border-violet-500/30"
                    : "bg-[#161b22] text-slate-200 border border-slate-700/40"
                }`}>
                  {m.role === "assistant" && m.kbCount != null && m.kbCount > 0 && (
                    <div className="flex items-center gap-1.5 mb-2 text-[10px] text-violet-400 font-medium">
                      <Database className="w-3 h-3" />
                      {m.kbCount} dokument från kunskapsbasen
                    </div>
                  )}
                  {m.role === "user" ? (
                    <p className="text-sm">{m.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-pre:my-2 prose-code:text-violet-300 text-sm leading-relaxed">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700/30 space-y-1">
                      <div className="text-[10px] text-slate-500 font-medium">Källor:</div>
                      {m.sources.map((s, j) => (
                        <a key={j} href={s} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-violet-400 hover:underline truncate">
                          <ArrowUpRight className="w-2.5 h-2.5 shrink-0" /> {s}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {chatStreaming && chatStreamText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl px-4 py-3 bg-[#161b22] text-slate-200 border border-violet-500/30">
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-pre:my-2 prose-code:text-violet-300 text-sm leading-relaxed">
                    <ReactMarkdown>{chatStreamText}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {chatStreaming && !chatStreamText && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] rounded-xl border border-slate-700/40 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  Söker i kunskapsbasen och genererar svar...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t border-slate-700/30 bg-[#0d1117]">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Fråga Frankenstein om kunskapsbasen..."
                title="Chattmeddelande"
                className="flex-1 bg-[#161b22] border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50"
                disabled={chatStreaming}
              />
              {chatStreaming ? (
                <button
                  onClick={stopChat}
                  title="Stoppa"
                  className="px-4 py-2.5 text-sm font-medium bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center gap-2"
                >
                  <StopCircle className="w-4 h-4" /> Stopp
                </button>
              ) : (
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  title="Skicka"
                  className="px-4 py-2.5 text-sm font-medium bg-violet-500/20 text-violet-400 rounded-xl hover:bg-violet-500/30 disabled:opacity-40 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Skicka
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
              <span className="flex items-center gap-1"><Database className="w-2.5 h-2.5" /> RAG-sökning aktiv</span>
              <span>{stats?.sources ?? 0} källor • {stats?.chunks ?? 0} chunks</span>
            </div>
          </div>
        </div>
      )}

      {/* Content (non-chat tabs) */}
      <div className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-4 ${tab === "chat" ? "hidden" : ""}`}>

        {/* ═══ OVERVIEW ═══ */}
        {tab === "overview" && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard icon={Database} label="Källor" value={stats?.sources ?? "—"} color="bg-violet-500/15 text-violet-400" />
              <StatCard icon={FileText} label="Chunks" value={stats?.chunks ?? "—"} color="bg-blue-500/15 text-blue-400" />
              <StatCard icon={BookOpen} label="Kodexempel" value={stats?.code_examples ?? "—"} color="bg-emerald-500/15 text-emerald-400" />
              <StatCard icon={FolderKanban} label="Projekt" value={stats?.projects ?? "—"} color="bg-amber-500/15 text-amber-400" />
              <StatCard icon={ListTodo} label="Uppgifter" value={stats?.tasks ?? "—"} color="bg-pink-500/15 text-pink-400" />
            </div>

            {/* Task status breakdown */}
            {stats && Object.keys(stats.tasks_by_status).length > 0 && (
              <div className="bg-[#161b22] border border-slate-700/40 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-slate-400 mb-3">Uppgifter per status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.tasks_by_status).map(([status, count]) => (
                    <div key={status} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
                      {status}: {count}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick crawl */}
            <div className="bg-[#161b22] border border-slate-700/40 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Snabb-crawla en URL
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder="https://docs.example.com/guide"
                  title="URL att crawla"
                  className="flex-1 bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50"
                  disabled={crawling}
                  onKeyDown={(e) => e.key === "Enter" && doCrawl()}
                />
                <input
                  type="text"
                  value={crawlTitle}
                  onChange={(e) => setCrawlTitle(e.target.value)}
                  placeholder="Titel (valfritt)"
                  title="Titel"
                  className="w-40 bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50"
                  disabled={crawling}
                />
                <button
                  onClick={doCrawl}
                  disabled={crawling || !crawlUrl.trim()}
                  className="px-4 py-2 text-sm font-medium bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-40 transition-colors flex items-center gap-2"
                >
                  {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {crawling ? "Crawlar..." : "Crawla"}
                </button>
              </div>
              {crawlResult && (
                <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${crawlResult.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {crawlResult}
                </div>
              )}
            </div>

            {/* Recent sources */}
            <div className="bg-[#161b22] border border-slate-700/40 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3">Senaste källor</h3>
              {sources.length === 0 && <p className="text-xs text-slate-600">Inga källor ännu. Crawla en URL ovan.</p>}
              <div className="space-y-2">
                {sources.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2 bg-[#0d1117] rounded-lg border border-slate-800/50">
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-300 font-medium truncate">{s.title}</div>
                      <div className="text-[10px] text-slate-600 truncate">{s.url || "Manuell text"}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.pending}`}>
                      {s.status}
                    </span>
                    <span className="text-[10px] text-slate-600">{timeAgo(s.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ═══ SOURCES ═══ */}
        {tab === "sources" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">{sources.length} källor</h2>
              <button onClick={loadSources} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Uppdatera
              </button>
            </div>

            {/* Crawl form */}
            <div className="bg-[#161b22] border border-violet-500/20 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-violet-400 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Lägg till källa
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder="https://docs.example.com"
                  title="URL"
                  className="flex-1 bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50"
                  disabled={crawling}
                />
                <input
                  type="text"
                  value={crawlTitle}
                  onChange={(e) => setCrawlTitle(e.target.value)}
                  placeholder="Titel"
                  title="Titel"
                  className="w-36 bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50"
                  disabled={crawling}
                />
                <button onClick={doCrawl} disabled={crawling || !crawlUrl.trim()} className="px-4 py-2 text-sm font-medium bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-40 transition-colors flex items-center gap-2">
                  {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {crawling ? "Crawlar..." : "Crawla"}
                </button>
              </div>
              {crawling && (
                <div className="flex items-center gap-2 text-xs text-violet-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Hämtar, chunkar och vektoriserar... (kan ta 30-60s)
                </div>
              )}
              {crawlResult && (
                <div className={`text-xs px-3 py-2 rounded-lg ${crawlResult.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {crawlResult}
                </div>
              )}
            </div>

            {/* Source list */}
            <div className="space-y-2">
              {sources.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 bg-[#161b22] border border-slate-700/40 rounded-xl hover:border-slate-600/50 transition-colors">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Globe className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-200 font-semibold truncate">{s.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{s.url || "Manuell text"}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[s.status] || STATUS_COLORS.pending}`}>
                        {s.status === "ready" && <CheckCircle className="w-2.5 h-2.5 inline mr-0.5" />}
                        {s.status === "error" && <AlertCircle className="w-2.5 h-2.5 inline mr-0.5" />}
                        {s.status === "crawling" && <Clock className="w-2.5 h-2.5 inline mr-0.5" />}
                        {s.status}
                      </span>
                      {(s.metadata as Record<string, number>)?.chunks != null && (
                        <span className="text-[10px] text-slate-500">{(s.metadata as Record<string, number>).chunks} chunks</span>
                      )}
                      {(s.metadata as Record<string, number>)?.text_length != null && (
                        <span className="text-[10px] text-slate-600">{Math.round((s.metadata as Record<string, number>).text_length / 1000)}k tecken</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-600">{timeAgo(s.created_at)}</span>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noreferrer" className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-slate-300" title="Öppna">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => deleteSource(s.id)} className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400" title="Ta bort">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══ SEARCH ═══ */}
        {tab === "search" && (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Sök i kunskapsbasen... (semantisk vektorsökning)"
                title="Sökfråga"
                className="flex-1 bg-[#161b22] border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50"
              />
              <button
                onClick={doSearch}
                disabled={searching || !searchQuery.trim()}
                className="px-5 py-2.5 text-sm font-medium bg-violet-500/20 text-violet-400 rounded-xl hover:bg-violet-500/30 disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Sök
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="text-[10px] text-slate-500 font-medium">{searchResults.length} resultat</div>
            )}

            <div className="space-y-3">
              {searchResults.map((r, i) => (
                <div key={i} className="bg-[#161b22] border border-slate-700/40 rounded-xl p-4 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      r.similarity > 0.7 ? "bg-green-500/15 text-green-400" :
                      r.similarity > 0.5 ? "bg-amber-500/15 text-amber-400" :
                      "bg-slate-500/15 text-slate-400"
                    }`}>
                      {(r.similarity * 100).toFixed(0)}% match
                    </span>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:text-violet-400 truncate max-w-[400px] flex items-center gap-1">
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        {r.url}
                      </a>
                    )}
                    {r.section_title && <span className="text-[10px] text-slate-600">§ {r.section_title}</span>}
                    <span className="text-[10px] text-slate-700 ml-auto">{r.word_count} ord</span>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {r.content?.slice(0, 800)}{r.content?.length > 800 ? "..." : ""}
                  </div>
                </div>
              ))}
            </div>

            {searchResults.length === 0 && !searching && searchQuery && (
              <div className="text-center py-12">
                <Search className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-500">Inga resultat för "{searchQuery}"</p>
                <p className="text-xs text-slate-600 mt-1">Crawla fler dokument via Källor-fliken</p>
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-12">
                <Brain className="w-10 h-10 mx-auto mb-3 text-violet-500/30" />
                <p className="text-sm text-slate-500">Semantisk vektorsökning</p>
                <p className="text-xs text-slate-600 mt-1">Sök med naturligt språk — Archon hittar relevanta dokument via Gemini-embeddings</p>
              </div>
            )}
          </>
        )}

        {/* ═══ TASKS ═══ */}
        {tab === "tasks" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">{tasks.length} uppgifter</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowNewTask(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Ny uppgift
                </button>
                <button onClick={loadTasks} title="Uppdatera" className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* New task form */}
            {showNewTask && (
              <div className="bg-[#161b22] border border-violet-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-violet-400">Ny uppgift</h3>
                  <button onClick={() => setShowNewTask(false)} title="Stäng" className="p-1 hover:bg-slate-700 rounded"><X className="w-3.5 h-3.5 text-slate-500" /></button>
                </div>
                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Titel" title="Titel" className="w-full bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50" />
                <textarea value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} placeholder="Beskrivning (valfritt)" title="Beskrivning" rows={2} className="w-full bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50 resize-none" />
                <div className="flex items-center gap-3">
                  <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} title="Prioritet" className="bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none">
                    <option value="low">Låg</option>
                    <option value="medium">Medium</option>
                    <option value="high">Hög</option>
                    <option value="critical">Kritisk</option>
                  </select>
                  <button onClick={createTask} disabled={!newTaskTitle.trim()} className="px-4 py-2 text-sm font-medium bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-40 transition-colors">
                    Skapa
                  </button>
                </div>
              </div>
            )}

            {/* Task list */}
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-start gap-3 px-4 py-3 bg-[#161b22] border border-slate-700/40 rounded-xl hover:border-slate-600/50 transition-colors">
                  <div className="mt-0.5">
                    {t.status === "done" ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : t.status === "in_progress" ? (
                      <Clock className="w-4 h-4 text-blue-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold ${t.status === "done" ? "text-slate-500 line-through" : "text-slate-200"}`}>{t.title}</div>
                    {t.description && <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{t.description}</div>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[t.status] || STATUS_COLORS.pending}`}>{t.status}</span>
                      <span className={`text-[10px] font-medium ${PRIORITY_COLORS[t.priority] || "text-slate-500"}`}>{t.priority}</span>
                      <span className="text-[10px] text-slate-600">{timeAgo(t.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {t.status !== "done" && (
                      <button onClick={() => updateTaskStatus(t.id, t.status === "todo" ? "in_progress" : "done")} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-slate-300" title={t.status === "todo" ? "Starta" : "Klar"}>
                        {t.status === "todo" ? <ArrowRight className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button onClick={() => deleteTask(t.id)} className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400" title="Ta bort">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {tasks.length === 0 && (
              <div className="text-center py-12">
                <ListTodo className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-500">Inga uppgifter ännu</p>
              </div>
            )}
          </>
        )}

        {/* ═══ PROJECTS ═══ */}
        {tab === "projects" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">{projects.length} projekt</h2>
              <button onClick={() => setShowNewProject(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Nytt projekt
              </button>
            </div>

            {showNewProject && (
              <div className="bg-[#161b22] border border-violet-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-violet-400">Nytt projekt</h3>
                  <button onClick={() => setShowNewProject(false)} title="Stäng" className="p-1 hover:bg-slate-700 rounded"><X className="w-3.5 h-3.5 text-slate-500" /></button>
                </div>
                <input type="text" value={newProjTitle} onChange={(e) => setNewProjTitle(e.target.value)} placeholder="Projektnamn" title="Projektnamn" className="w-full bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50" />
                <textarea value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)} placeholder="Beskrivning (valfritt)" title="Beskrivning" rows={2} className="w-full bg-[#0d1117] border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-violet-500/50 resize-none" />
                <button onClick={createProject} disabled={!newProjTitle.trim()} className="px-4 py-2 text-sm font-medium bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-40 transition-colors">
                  Skapa
                </button>
              </div>
            )}

            <div className="space-y-2">
              {projects.map((p) => (
                <div key={p.id} className="px-4 py-3 bg-[#161b22] border border-slate-700/40 rounded-xl hover:border-slate-600/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-slate-200 font-semibold">{p.title}</span>
                    <span className="text-[10px] text-slate-600 ml-auto">{timeAgo(p.created_at)}</span>
                  </div>
                  {p.description && <p className="text-[10px] text-slate-500 mt-1 ml-6">{p.description}</p>}
                  {p.github_repo && (
                    <a href={p.github_repo} target="_blank" rel="noreferrer" className="text-[10px] text-violet-400 hover:underline mt-1 ml-6 flex items-center gap-1">
                      <ArrowUpRight className="w-2.5 h-2.5" /> {p.github_repo}
                    </a>
                  )}
                </div>
              ))}
            </div>

            {projects.length === 0 && (
              <div className="text-center py-12">
                <FolderKanban className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-500">Inga projekt ännu</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
