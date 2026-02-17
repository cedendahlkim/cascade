import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Editor, { DiffEditor, type Monaco } from "@monaco-editor/react";
import {
  FolderOpen, ChevronRight, ChevronDown, Plus, Save,
  X, Search, Bot, Play, Terminal, RefreshCw, Send, FolderPlus,
  Sparkles, Loader2, PanelLeftClose, PanelLeft, Palette, Command,
  ArrowUp, ArrowDown, CornerDownLeft, Clock, Zap, GitBranch,
  FileJson, FileText, FileCode, FileType, Image, Settings, Database,
  Hash, Braces, Coffee, Gem, FileCode2, Globe, Cpu, Package,
  type LucideIcon,
} from "lucide-react";
import { BRIDGE_URL } from "../config";

// ── Types ──

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  language?: string;
  children?: FileNode[];
}

interface OpenTab {
  path: string;
  name: string;
  language: string;
  content: string;
  originalContent: string;
  modified: boolean;
}

interface AiMessage {
  role: "user" | "ai";
  content: string;
  timestamp: number;
}

interface SearchResult {
  path: string;
  line: number;
  content: string;
}

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  action: () => void;
  category: string;
}

// ── Theme definitions ──

const THEMES = [
  { id: "vs-dark", label: "Dark+ (default)", bg: "#1e1e1e" },
  { id: "hc-black", label: "High Contrast", bg: "#000000" },
  { id: "vs", label: "Light", bg: "#ffffff" },
  { id: "gracestack-midnight", label: "Gracestack Midnight", bg: "#0d1117" },
  { id: "gracestack-ocean", label: "Gracestack Ocean", bg: "#0a192f" },
] as const;

function defineGracestackThemes(monaco: Monaco) {
  monaco.editor.defineTheme("gracestack-midnight", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6a737d", fontStyle: "italic" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "string", foreground: "a5d6ff" },
      { token: "number", foreground: "79c0ff" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
      { token: "variable", foreground: "ffa657" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
      "editor.lineHighlightBackground": "#161b2240",
      "editor.selectionBackground": "#264f78",
      "editorCursor.foreground": "#58a6ff",
      "editorLineNumber.foreground": "#484f58",
      "editorLineNumber.activeForeground": "#c9d1d9",
      "editor.selectionHighlightBackground": "#3fb95040",
    },
  });
  monaco.editor.defineTheme("gracestack-ocean", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "637777", fontStyle: "italic" },
      { token: "keyword", foreground: "c792ea" },
      { token: "string", foreground: "ecc48d" },
      { token: "number", foreground: "f78c6c" },
      { token: "type", foreground: "ffcb6b" },
      { token: "function", foreground: "82aaff" },
      { token: "variable", foreground: "addb67" },
    ],
    colors: {
      "editor.background": "#0a192f",
      "editor.foreground": "#d6deeb",
      "editor.lineHighlightBackground": "#0e293f",
      "editor.selectionBackground": "#1d3b5c",
      "editorCursor.foreground": "#80a4c2",
      "editorLineNumber.foreground": "#4b6479",
      "editorLineNumber.activeForeground": "#c5e4fd",
      "editor.selectionHighlightBackground": "#5f7e9740",
    },
  });
}

// ── File icon helper ──

const FILE_ICON_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  ts: { icon: FileCode2, color: "text-blue-400" },
  tsx: { icon: FileCode2, color: "text-blue-300" },
  js: { icon: Coffee, color: "text-yellow-400" },
  jsx: { icon: Coffee, color: "text-yellow-300" },
  json: { icon: FileJson, color: "text-amber-400" },
  md: { icon: FileText, color: "text-slate-400" },
  css: { icon: Hash, color: "text-pink-400" },
  scss: { icon: Hash, color: "text-pink-300" },
  html: { icon: Globe, color: "text-orange-400" },
  py: { icon: Gem, color: "text-green-400" },
  rs: { icon: Cpu, color: "text-orange-500" },
  go: { icon: Cpu, color: "text-cyan-400" },
  yaml: { icon: Settings, color: "text-red-400" },
  yml: { icon: Settings, color: "text-red-400" },
  toml: { icon: Settings, color: "text-slate-400" },
  sql: { icon: Database, color: "text-blue-500" },
  sh: { icon: Terminal, color: "text-green-500" },
  bash: { icon: Terminal, color: "text-green-500" },
  dockerfile: { icon: Package, color: "text-blue-500" },
  png: { icon: Image, color: "text-purple-400" },
  jpg: { icon: Image, color: "text-purple-400" },
  svg: { icon: Image, color: "text-amber-400" },
  lock: { icon: Braces, color: "text-slate-500" },
  env: { icon: Settings, color: "text-yellow-500" },
  gitignore: { icon: GitBranch, color: "text-orange-400" },
};

function getFileIcon(name: string): { icon: LucideIcon; color: string } {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const baseName = name.toLowerCase();
  if (baseName === "dockerfile") return FILE_ICON_MAP.dockerfile;
  if (baseName === ".gitignore") return FILE_ICON_MAP.gitignore;
  if (baseName === ".env" || baseName.startsWith(".env.")) return FILE_ICON_MAP.env;
  return FILE_ICON_MAP[ext] || { icon: FileType, color: "text-slate-400" };
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── API helpers ──

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(`${BRIDGE_URL}/api/workspace${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ── FileTree Component ──

function FileTree({
  nodes,
  onSelect,
  selectedPath,
  onRefresh,
  onNewFile,
  onNewDir,
  onDelete,
  fileFilter,
  setFileFilter,
}: {
  nodes: FileNode[];
  onSelect: (node: FileNode) => void;
  selectedPath: string;
  onRefresh: () => void;
  onNewFile: () => void;
  onNewDir: () => void;
  onDelete: (path: string) => void;
  fileFilter: string;
  setFileFilter: (v: string) => void;
}) {
  const filteredNodes = useMemo(() => {
    if (!fileFilter.trim()) return nodes;
    const q = fileFilter.toLowerCase();
    function filterTree(ns: FileNode[]): FileNode[] {
      return ns.reduce<FileNode[]>((acc, n) => {
        if (n.type === "file" && n.name.toLowerCase().includes(q)) {
          acc.push(n);
        } else if (n.type === "directory") {
          const kids = filterTree(n.children || []);
          if (kids.length > 0) acc.push({ ...n, children: kids });
        }
        return acc;
      }, []);
    }
    return filterTree(nodes);
  }, [nodes, fileFilter]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/50">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Explorer</span>
        <div className="flex gap-1">
          <button onClick={onNewFile} className="p-1 hover:bg-slate-700 rounded" title="Ny fil">
            <Plus className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button onClick={onNewDir} className="p-1 hover:bg-slate-700 rounded" title="Ny mapp">
            <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button onClick={onRefresh} className="p-1 hover:bg-slate-700 rounded" title="Uppdatera">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
      <div className="px-2 py-1.5 border-b border-slate-700/30">
        <input
          type="text"
          value={fileFilter}
          onChange={(e) => setFileFilter(e.target.value)}
          placeholder="Filtrera filer..."
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-[11px] outline-none text-slate-300 placeholder:text-slate-600 focus:border-blue-500/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto text-sm">
        {filteredNodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onDelete={onDelete}
          />
        ))}
        {filteredNodes.length === 0 && (
          <div className="text-center text-slate-600 text-xs py-4">Inga filer matchar</div>
        )}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  onSelect,
  selectedPath,
  onDelete,
}: {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  selectedPath: string;
  onDelete: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const isDir = node.type === "directory";
  const isSelected = node.path === selectedPath;
  const fileIcon = !isDir ? getFileIcon(node.name) : null;
  const FileIconComp = fileIcon?.icon || FileType;

  const handleClick = () => {
    if (isDir) {
      setExpanded(!expanded);
    } else {
      onSelect(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm(`Ta bort ${node.name}?`)) {
      onDelete(node.path);
    }
  };

  return (
    <>
      <div
        className={`group flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-slate-700/50 ${
          isSelected ? "bg-blue-500/20 text-blue-300" : "text-slate-300"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title={node.path + (node.size ? ` (${formatFileSize(node.size)})` : "")}
      >
        {isDir ? (
          expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        ) : (
          <span className="w-3.5" />
        )}
        {isDir ? (
          <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${expanded ? "text-amber-400" : "text-amber-500/70"}`} />
        ) : (
          <FileIconComp className={`w-3.5 h-3.5 shrink-0 ${fileIcon?.color || "text-slate-400"}`} />
        )}
        <span className="truncate text-xs">{node.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm(`Ta bort ${node.name}?`)) onDelete(node.path); }}
          className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-opacity"
          title="Ta bort"
        >
          <X className="w-3 h-3 text-red-400" />
        </button>
      </div>
      {isDir && expanded && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

// ── Command Palette ──

function CommandPalette({ commands, onClose }: { commands: CommandItem[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelected(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[selected]) { filtered[selected].action(); onClose(); }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15%] bg-black/50" onClick={onClose}>
      <div className="w-[500px] max-w-[90vw] bg-[#1c2128] border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
          <Command className="w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Skriv ett kommando..."
            className="flex-1 bg-transparent text-sm outline-none text-slate-200 placeholder:text-slate-500"
          />
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> navigera
            <CornerDownLeft className="w-3 h-3 ml-1" /> kör
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 && <div className="text-center text-slate-500 text-xs py-6">Inga kommandon matchar</div>}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <div
                key={cmd.id}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer text-xs ${
                  i === selected ? "bg-blue-500/20 text-blue-300" : "text-slate-300 hover:bg-slate-700/50"
                }`}
                onClick={() => { cmd.action(); onClose(); }}
                onMouseEnter={() => setSelected(i)}
              >
                <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="flex-1">{cmd.label}</span>
                <span className="text-[10px] text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">{cmd.category}</span>
                {cmd.shortcut && <kbd className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{cmd.shortcut}</kbd>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function CodeEditorView() {
  // State
  const [tree, setTree] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffContent, setDiffContent] = useState<{ original: string; modified: string } | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [editorTheme, setEditorTheme] = useState("gracestack-midnight");
  const [showMinimap, setShowMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState<"on" | "off">("on");
  const [fontSize, setFontSize] = useState(13);
  const [autoSave, setAutoSave] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [fileFilter, setFileFilter] = useState("");
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [monacoReady, setMonacoReady] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Terminal
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);

  // AI
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);

  // Auto-save timer
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load file tree ──
  const loadTree = useCallback(async () => {
    try {
      const data = await api("/tree");
      setTree(data.tree || []);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  // ── Open file ──
  const openFile = async (node: FileNode) => {
    if (node.type !== "file") return;
    const existing = tabs.find((t) => t.path === node.path);
    if (existing) {
      setActiveTab(node.path);
      return;
    }

    setLoading(true);
    try {
      const data = await api(`/file?path=${encodeURIComponent(node.path)}`);
      const tab: OpenTab = {
        path: node.path,
        name: node.name,
        language: data.language || "plaintext",
        content: data.content,
        originalContent: data.content,
        modified: false,
      };
      setTabs((prev) => [...prev, tab]);
      setActiveTab(node.path);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Close tab ──
  const closeTab = (path: string) => {
    const tab = tabs.find((t) => t.path === path);
    if (tab?.modified && !confirm(`${tab.name} har osparade ändringar. Stäng ändå?`)) return;

    setTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTab === path) {
      const remaining = tabs.filter((t) => t.path !== path);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : "");
    }
  };

  // ── Save file ──
  const saveFile = async (path: string) => {
    const tab = tabs.find((t) => t.path === path);
    if (!tab) return;

    try {
      await api("/file", {
        method: "PUT",
        body: JSON.stringify({ path: tab.path, content: tab.content }),
      });
      setTabs((prev) =>
        prev.map((t) =>
          t.path === path ? { ...t, originalContent: t.content, modified: false } : t
        )
      );
    } catch (err) {
      setError(String(err));
    }
  };

  // ── Editor change (with auto-save) ──
  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.path === activeTab
          ? { ...t, content: value, modified: value !== t.originalContent }
          : t
      )
    );
    if (autoSave) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        saveFile(activeTab);
      }, 1500);
    }
  };

  // ── New file ──
  const handleNewFile = async () => {
    const name = prompt("Filnamn (t.ex. src/utils/helper.ts):");
    if (!name) return;
    try {
      await api("/file", { method: "POST", body: JSON.stringify({ path: name, content: "" }) });
      await loadTree();
      openFile({ name: name.split("/").pop() || name, path: name, type: "file" });
    } catch (err) {
      setError(String(err));
    }
  };

  // ── New directory ──
  const handleNewDir = async () => {
    const name = prompt("Mappnamn (t.ex. src/components/new):");
    if (!name) return;
    try {
      await api("/dir", { method: "POST", body: JSON.stringify({ path: name }) });
      await loadTree();
    } catch (err) {
      setError(String(err));
    }
  };

  // ── Delete file ──
  const handleDelete = async (path: string) => {
    try {
      await api(`/file?path=${encodeURIComponent(path)}`, { method: "DELETE" });
      closeTab(path);
      await loadTree();
    } catch (err) {
      setError(String(err));
    }
  };

  // ── Search ──
  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const data = await api(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.results || []);
    } catch (err) {
      setError(String(err));
    } finally {
      setSearching(false);
    }
  };

  // ── Terminal (with history) ──
  const runCommand = async () => {
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalInput("");
    setTerminalHistory((prev) => [cmd, ...prev.filter((h) => h !== cmd)].slice(0, 50));
    setHistoryIdx(-1);
    setTerminalOutput((prev) => [...prev, `$ ${cmd}`]);

    try {
      const data = await api("/ai/terminal", {
        method: "POST",
        body: JSON.stringify({ command: cmd }),
      });
      if (data.stdout) setTerminalOutput((prev) => [...prev, data.stdout]);
      if (data.stderr) setTerminalOutput((prev) => [...prev, `[stderr] ${data.stderr}`]);
      setTerminalOutput((prev) => [...prev, `[exit: ${data.exitCode}]`]);
    } catch (err) {
      setTerminalOutput((prev) => [...prev, `[error] ${err}`]);
    }

    setTimeout(() => {
      terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
    }, 50);
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { runCommand(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, terminalHistory.length - 1);
      setHistoryIdx(next);
      if (terminalHistory[next]) setTerminalInput(terminalHistory[next]);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIdx - 1;
      if (next < 0) { setHistoryIdx(-1); setTerminalInput(""); }
      else { setHistoryIdx(next); setTerminalInput(terminalHistory[next] || ""); }
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setTerminalOutput([]);
    }
  };

  // ── Track recent files ──
  useEffect(() => {
    if (activeTab) {
      setRecentFiles((prev) => [activeTab, ...prev.filter((p) => p !== activeTab)].slice(0, 10));
    }
  }, [activeTab]);

  // ── AI Chat (smart — natural language → code actions) ──
  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const msg = aiInput.trim();
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", content: msg, timestamp: Date.now() }]);
    setAiLoading(true);

    try {
      const currentTab = tabs.find((t) => t.path === activeTab);

      // Send everything to the smart /ai/chat endpoint
      const response = await api("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: msg,
          currentFile: currentTab?.path || null,
          currentContent: currentTab?.content || null,
          openFiles: tabs.map((t) => t.path),
        }),
      });

      const { results } = response as { results: any[] };
      const parts: string[] = [];
      let filesChanged = false;

      for (const r of results) {
        switch (r.action) {
          case "edit":
          case "create": {
            if (r.success) {
              filesChanged = true;
              const icon = r.isNew ? "📄" : "✏️";
              parts.push(`${icon} **${r.isNew ? "Skapade" : "Uppdaterade"}** \`${r.path}\``);

              // If this file is currently open, update its content in the tab
              const existingTab = tabs.find((t) => t.path === r.path);
              if (existingTab) {
                setTabs((prev) =>
                  prev.map((t) =>
                    t.path === r.path
                      ? { ...t, content: r.content, originalContent: r.content, modified: false }
                      : t
                  )
                );
              } else {
                // Auto-open newly created/edited files
                const name = r.path.split("/").pop() || r.path;
                setTabs((prev) => [
                  ...prev,
                  {
                    path: r.path,
                    name,
                    language: r.language || "plaintext",
                    content: r.content,
                    originalContent: r.content,
                    modified: false,
                  },
                ]);
                setActiveTab(r.path);
              }
            } else {
              parts.push(`❌ Kunde inte ${r.action === "create" ? "skapa" : "redigera"} \`${r.path}\`: ${r.error}`);
            }
            break;
          }
          case "run": {
            const output = [r.stdout, r.stderr].filter(Boolean).join("\n") || "(ingen output)";
            const status = r.success ? "✅" : "❌";
            parts.push(`${status} Körde: \`${r.command}\`\n\`\`\`\n${output.slice(0, 2000)}\n[exit: ${r.exitCode}]\n\`\`\``);
            // Also show in terminal
            setTerminalOutput((prev) => [...prev, `$ ${r.command}`, ...(r.stdout ? [r.stdout] : []), ...(r.stderr ? [`[stderr] ${r.stderr}`] : []), `[exit: ${r.exitCode}]`]);
            break;
          }
          case "answer": {
            parts.push(r.text);
            break;
          }
          default:
            if (r.error) parts.push(`⚠️ ${r.error}`);
        }
      }

      if (filesChanged) await loadTree();

      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: parts.join("\n\n"), timestamp: Date.now() },
      ]);
    } catch (err) {
      setAiMessages((prev) => [
        ...prev,
        { role: "ai", content: `Fel: ${err}`, timestamp: Date.now() },
      ]);
    } finally {
      setAiLoading(false);
      setTimeout(() => {
        aiRef.current?.scrollTo(0, aiRef.current.scrollHeight);
      }, 50);
    }
  };

  // ── Accept diff ──
  const acceptDiff = () => {
    if (!diffContent) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.path === activeTab
          ? { ...t, content: diffContent.modified, modified: true }
          : t
      )
    );
    setShowDiff(false);
    setDiffContent(null);
  };

  // ── Command palette commands ──
  const commands: CommandItem[] = useMemo(() => [
    { id: "save", label: "Spara fil", shortcut: "Ctrl+S", icon: Save, action: () => { if (activeTab) saveFile(activeTab); }, category: "Fil" },
    { id: "search", label: "Sök i filer", shortcut: "Ctrl+P", icon: Search, action: () => setShowSearch((v) => !v), category: "Navigering" },
    { id: "terminal", label: "Visa/dölj terminal", shortcut: "Ctrl+`", icon: Terminal, action: () => setShowTerminal((v) => !v), category: "Panel" },
    { id: "ai", label: "Visa/dölj Frankenstein AI", shortcut: "Ctrl+I", icon: Bot, action: () => setShowAiPanel((v) => !v), category: "Panel" },
    { id: "sidebar", label: "Visa/dölj filträd", shortcut: "Ctrl+B", icon: PanelLeft, action: () => setShowSidebar((v) => !v), category: "Panel" },
    { id: "theme", label: "Byt tema", icon: Palette, action: () => setShowThemePicker(true), category: "Utseende" },
    { id: "minimap", label: `${showMinimap ? "Dölj" : "Visa"} minimap`, icon: Settings, action: () => setShowMinimap((v) => !v), category: "Utseende" },
    { id: "wordwrap", label: `Radbrytning: ${wordWrap === "on" ? "AV" : "PÅ"}`, icon: Settings, action: () => setWordWrap((v) => v === "on" ? "off" : "on"), category: "Utseende" },
    { id: "fontup", label: "Öka textstorlek", icon: ArrowUp, action: () => setFontSize((s) => Math.min(s + 1, 24)), category: "Utseende" },
    { id: "fontdown", label: "Minska textstorlek", icon: ArrowDown, action: () => setFontSize((s) => Math.max(s - 1, 9)), category: "Utseende" },
    { id: "autosave", label: `Auto-save: ${autoSave ? "AV" : "PÅ"}`, icon: Zap, action: () => setAutoSave((v) => !v), category: "Inställningar" },
    { id: "newfile", label: "Ny fil", icon: Plus, action: handleNewFile, category: "Fil" },
    { id: "newdir", label: "Ny mapp", icon: FolderPlus, action: handleNewDir, category: "Fil" },
    { id: "closeall", label: "Stäng alla flikar", icon: X, action: () => { setTabs([]); setActiveTab(""); }, category: "Fil" },
    { id: "clearterminal", label: "Rensa terminal", icon: Terminal, action: () => setTerminalOutput([]), category: "Terminal" },
    { id: "refresh", label: "Uppdatera filträd", icon: RefreshCw, action: loadTree, category: "Navigering" },
  ], [activeTab, showMinimap, wordWrap, autoSave]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeTab) saveFile(activeTab);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setShowTerminal((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        setShowAiPanel((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setShowSidebar((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        if (activeTab) closeTab(activeTab);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, tabs]);

  // ── Monaco mount handler ──
  const handleMonacoMount = useCallback((_editor: any, monaco: Monaco) => {
    defineGracestackThemes(monaco);
    setMonacoReady(true);
    _editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({ line: e.position.lineNumber, col: e.position.column });
    });
  }, []);

  const currentTab = tabs.find((t) => t.path === activeTab);

  // ── Breadcrumbs ──
  const breadcrumbs = currentTab ? currentTab.path.split("/") : [];

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-200">
      {/* Command Palette */}
      {showCommandPalette && <CommandPalette commands={commands} onClose={() => setShowCommandPalette(false)} />}

      {/* Theme Picker */}
      {showThemePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowThemePicker(false)}>
          <div className="w-80 bg-[#1c2128] border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-700/50">
              <span className="text-sm font-semibold text-slate-300">Välj tema</span>
            </div>
            {THEMES.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-xs ${
                  editorTheme === t.id ? "bg-blue-500/20 text-blue-300" : "text-slate-300 hover:bg-slate-700/50"
                }`}
                onClick={() => { setEditorTheme(t.id); setShowThemePicker(false); }}
              >
                <div className="w-5 h-5 rounded border border-slate-600" style={{ backgroundColor: t.bg }} />
                <span>{t.label}</span>
                {editorTheme === t.id && <span className="ml-auto text-blue-400">&#10003;</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-500/20 border-b border-red-500/30 text-red-300 text-sm">
          <span>{error}</span>
          <button onClick={() => setError("")} title="Stäng"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] border-b border-slate-700/50">
        <button
          onClick={() => setShowSidebar((v) => !v)}
          className="p-1.5 hover:bg-slate-700 rounded"
          title="Filträd (Ctrl+B)"
        >
          {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>
        <div className="w-px h-5 bg-slate-700" />
        <button
          onClick={() => setShowSearch((v) => !v)}
          className={`p-1.5 rounded ${showSearch ? "bg-blue-500/20 text-blue-400" : "hover:bg-slate-700"}`}
          title="Sök (Ctrl+P)"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowTerminal((v) => !v)}
          className={`p-1.5 rounded ${showTerminal ? "bg-blue-500/20 text-blue-400" : "hover:bg-slate-700"}`}
          title="Terminal (Ctrl+`)"
        >
          <Terminal className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowAiPanel((v) => !v)}
          className={`p-1.5 rounded ${showAiPanel ? "bg-violet-500/20 text-violet-400" : "hover:bg-slate-700"}`}
          title="Frankenstein AI (Ctrl+I)"
        >
          <Bot className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-700" />
        <button
          onClick={() => setShowThemePicker(true)}
          className="p-1.5 hover:bg-slate-700 rounded"
          title="Byt tema"
        >
          <Palette className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowCommandPalette(true)}
          className="p-1.5 hover:bg-slate-700 rounded"
          title="Kommandopalett (Ctrl+Shift+P)"
        >
          <Command className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        {autoSave && <span className="text-[10px] text-green-500/60 flex items-center gap-1"><Zap className="w-3 h-3" />auto</span>}
        {currentTab?.modified && (
          <button
            onClick={() => saveFile(activeTab)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
          >
            <Save className="w-3 h-3" /> Spara
          </button>
        )}
      </div>

      {/* Breadcrumbs */}
      {currentTab && (
        <div className="flex items-center gap-1 px-3 py-1 bg-[#0d1117] border-b border-slate-800/50 text-[11px] text-slate-500 overflow-x-auto">
          {breadcrumbs.map((part, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
              <span className={i === breadcrumbs.length - 1 ? "text-slate-300" : "hover:text-slate-300 cursor-pointer"}>{part}</span>
            </span>
          ))}
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-slate-700/50">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Sök i filer..."
            className="flex-1 bg-transparent text-sm outline-none text-slate-200 placeholder:text-slate-500"
            autoFocus
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
          <button onClick={() => { setShowSearch(false); setSearchResults([]); }}>
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      )}

      {/* Search results */}
      {showSearch && searchResults.length > 0 && (
        <div className="max-h-48 overflow-y-auto bg-[#0d1117] border-b border-slate-700/50">
          {searchResults.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-1 text-xs hover:bg-slate-700/50 cursor-pointer"
              onClick={() => {
                openFile({ name: r.path.split("/").pop() || r.path, path: r.path, type: "file" });
                setShowSearch(false);
                setSearchResults([]);
              }}
            >
              <span className="text-blue-400 shrink-0">{r.path}</span>
              <span className="text-slate-500">:{r.line}</span>
              <span className="text-slate-400 truncate">{r.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-60 shrink-0 bg-[#0d1117] border-r border-slate-700/50 overflow-hidden">
            <FileTree
              nodes={tree}
              onSelect={openFile}
              selectedPath={activeTab}
              onRefresh={loadTree}
              onNewFile={handleNewFile}
              onNewDir={handleNewDir}
              onDelete={handleDelete}
              fileFilter={fileFilter}
              setFileFilter={setFileFilter}
            />
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="flex bg-[#161b22] border-b border-slate-700/50 overflow-x-auto">
              {tabs.map((tab) => {
                const tabIcon = getFileIcon(tab.name);
                const TabIcon = tabIcon.icon;
                return (
                  <div
                    key={tab.path}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-slate-700/30 shrink-0 ${
                      tab.path === activeTab
                        ? "bg-[#0d1117] text-slate-200 border-b-2 border-b-blue-500"
                        : "text-slate-400 hover:bg-slate-800"
                    }`}
                    onClick={() => setActiveTab(tab.path)}
                    onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); closeTab(tab.path); } }}
                    title={tab.path}
                  >
                    <TabIcon className={`w-3 h-3 ${tabIcon.color}`} />
                    <span>{tab.name}</span>
                    {tab.modified && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                      className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-slate-600 rounded p-0.5 transition-opacity"
                      title="Stäng (Ctrl+W)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            )}

            {!loading && showDiff && diffContent && currentTab && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
                  <span className="text-xs text-amber-400">AI-föreslagna ändringar — granska och acceptera</span>
                  <div className="flex gap-2">
                    <button
                      onClick={acceptDiff}
                      className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                    >
                      Acceptera
                    </button>
                    <button
                      onClick={() => { setShowDiff(false); setDiffContent(null); }}
                      className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                    >
                      Avvisa
                    </button>
                  </div>
                </div>
                <DiffEditor
                  original={diffContent.original}
                  modified={diffContent.modified}
                  language={currentTab.language}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    renderSideBySide: true,
                    minimap: { enabled: false },
                    fontSize: 13,
                  }}
                />
              </div>
            )}

            {!loading && !showDiff && currentTab && (
              <Editor
                path={currentTab.path}
                value={currentTab.content}
                language={currentTab.language}
                theme={monacoReady ? editorTheme : "vs-dark"}
                onChange={handleEditorChange}
                onMount={handleMonacoMount}
                options={{
                  minimap: { enabled: showMinimap },
                  fontSize,
                  lineNumbers: "on",
                  wordWrap,
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 8 },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true, indentation: true },
                  renderLineHighlight: "all",
                  fontLigatures: true,
                  suggest: { preview: true, showMethods: true, showFunctions: true },
                }}
              />
            )}

            {!loading && !currentTab && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-amber-500/10 rounded-full blur-3xl" />
                  <div className="relative flex items-center gap-3">
                    <Sparkles className="w-10 h-10 text-violet-500/40" />
                    <div>
                      <p className="text-xl font-bold bg-gradient-to-r from-blue-400 via-violet-400 to-amber-400 bg-clip-text text-transparent">Gracestack Editor</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Powered by Monaco + Frankenstein AI</p>
                    </div>
                  </div>
                </div>

                {recentFiles.length > 0 && (
                  <div className="w-72">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Senaste filer</p>
                    <div className="space-y-0.5">
                      {recentFiles.slice(0, 5).map((path) => {
                        const name = path.split("/").pop() || path;
                        const fi = getFileIcon(name);
                        const FI = fi.icon;
                        return (
                          <div
                            key={path}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer text-xs text-slate-400 hover:text-slate-200 transition-colors"
                            onClick={() => openFile({ name, path, type: "file" })}
                          >
                            <FI className={`w-3.5 h-3.5 ${fi.color}`} />
                            <span className="truncate">{path}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+S</kbd> Spara</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+P</kbd> Sök</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+`</kbd> Terminal</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+I</kbd> AI</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+B</kbd> Sidopanel</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+Shift+P</kbd> Kommandon</div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-48 border-t border-slate-700/50 bg-[#0d1117] flex flex-col">
              <div className="flex items-center justify-between px-3 py-1 bg-[#161b22] border-b border-slate-700/50">
                <span className="text-xs font-semibold text-slate-400">Terminal</span>
                <button onClick={() => setShowTerminal(false)}>
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
              <div ref={terminalRef} className="flex-1 overflow-y-auto p-2 font-mono text-xs text-slate-300">
                {terminalOutput.map((line, i) => (
                  <div key={i} className={line.startsWith("$") ? "text-green-400" : line.startsWith("[stderr]") ? "text-red-400" : ""}>{line}</div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 border-t border-slate-700/50">
                <span className="text-green-400 text-xs font-mono">$</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  placeholder="Skriv kommando... (↑↓ historik, Ctrl+L rensa)"
                  className="flex-1 bg-transparent text-xs font-mono outline-none text-slate-200 placeholder:text-slate-600"
                />
                <button onClick={runCommand} className="p-1 hover:bg-slate-700 rounded" title="Kör">
                  <Play className="w-3.5 h-3.5 text-green-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Panel */}
        {showAiPanel && (
          <div className="w-80 shrink-0 bg-[#0d1117] border-l border-slate-700/50 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-slate-300">Frankenstein AI</span>
              </div>
              <button onClick={() => setShowAiPanel(false)}>
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* AI help */}
            <div className="px-3 py-2 border-b border-slate-700/30 text-[10px] text-slate-500 space-y-0.5">
              <div className="font-semibold text-slate-400 mb-1">Skriv vad du vill — Frankenstein kodar det</div>
              <div>💬 &quot;Lägg till en login-sida med email och lösenord&quot;</div>
              <div>✏️ &quot;Fixa bugg i rad 42 — variabeln är undefined&quot;</div>
              <div>📄 &quot;Skapa en REST API med Express för users&quot;</div>
              <div>🖥️ &quot;Kör npm test och visa resultatet&quot;</div>
              <div>🔍 &quot;Förklara vad den här filen gör&quot;</div>
            </div>

            {/* Messages */}
            <div ref={aiRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiMessages.length === 0 && (
                <div className="text-center text-slate-500 text-xs mt-8">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-violet-500/50" />
                  <p>Frankenstein AI är redo.</p>
                  <p className="mt-1">Fråga om koden, be om ändringar, eller kör kommandon.</p>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-blue-200"
                      : "bg-slate-800/50 border border-slate-700/30 rounded-lg p-2 text-slate-300"
                  }`}
                >
                  <div className="font-semibold text-[10px] mb-1 text-slate-500">
                    {msg.role === "user" ? "Du" : "Frankenstein"}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-violet-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Frankenstein tänker...</span>
                </div>
              )}
            </div>

            {/* AI input */}
            <div className="border-t border-slate-700/50 p-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
                  placeholder="Beskriv vad du vill koda..."
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-500 focus:border-violet-500/50"
                  disabled={aiLoading}
                />
                <button
                  onClick={sendAiMessage}
                  disabled={aiLoading || !aiInput.trim()}
                  className="p-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-0.5 bg-[#161b22] border-t border-slate-700/50 text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          {currentTab && (
            <>
              <span>Rad {cursorPosition.line}, Kol {cursorPosition.col}</span>
              <span className="text-slate-600">|</span>
              <span className="uppercase">{currentTab.language}</span>
              <span className="text-slate-600">|</span>
              <span>UTF-8</span>
            </>
          )}
          {!currentTab && <span>Gracestack Editor</span>}
        </div>
        <div className="flex items-center gap-3">
          {autoSave && <span className="text-green-500/60 flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> Auto-save</span>}
          <span>{tabs.length} flik{tabs.length !== 1 ? "ar" : ""}</span>
          <span className="cursor-pointer hover:text-slate-300" onClick={() => setShowThemePicker(true)}>{THEMES.find((t) => t.id === editorTheme)?.label || editorTheme}</span>
        </div>
      </div>
    </div>
  );
}
