import { useState, useEffect, useRef, useCallback, useMemo, type DragEvent } from "react";
import Editor, { DiffEditor, type Monaco } from "@monaco-editor/react";
import {
  FolderOpen, ChevronRight, ChevronDown, Plus, Save,
  X, Search, Bot, Play, Terminal, RefreshCw, Send, FolderPlus,
  Sparkles, Loader2, PanelLeftClose, PanelLeft, Palette, Command,
  ArrowUp, ArrowDown, CornerDownLeft, Clock, Zap, GitBranch,
  FileJson, FileText, FileType, Image, Settings, Database,
  Hash, Braces, Coffee, Gem, FileCode2, Globe, Cpu, Package,
  Columns, Undo2, Eye, Copy, Check, Maximize2, Minimize2, CheckCircle, AlertCircle, Info,
  Wand2, FileEdit, StopCircle,
  CircleDot, Eraser, Pencil, Files, Replace, ChevronsRight, Bug, ShieldCheck, Gauge, BookOpen, TestTube, BrainCircuit, SearchCode,
  type LucideIcon,
} from "lucide-react";
import { BRIDGE_URL } from "../config";
import XTerminal from "./XTerminal";

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

interface InlineEditState {
  visible: boolean;
  instruction: string;
  selection: string;
  selectionRange: { startLine: number; endLine: number; startCol: number; endCol: number } | null;
  loading: boolean;
  result: string;
  streaming: boolean;
}

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  action: () => void;
  category: string;
}

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
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

// ── Simple markdown renderer ──

function simpleMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
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
  onContextMenu,
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
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
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
            onContextMenu={onContextMenu}
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
  onContextMenu,
}: {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  selectedPath: string;
  onDelete: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
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

  return (
    <>
      <div
        className={`group flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-slate-700/50 ${
          isSelected ? "bg-blue-500/20 text-blue-300" : "text-slate-300"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
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
        {isDir && node.children && (
          <span className="ml-auto text-[9px] text-slate-600">{node.children.length}</span>
        )}
      </div>
      {isDir && expanded && node.children?.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
          selectedPath={selectedPath}
          onDelete={onDelete}
          onContextMenu={onContextMenu}
        />
      ))}
    </>
  );
}

// ── AI Markdown renderer with Apply buttons ──

interface AiMarkdownProps {
  content: string;
  onApplyCode?: (path: string, code: string, isNew: boolean) => void;
  onOpenFile?: (path: string) => void;
}

function AiMarkdown({ content, onApplyCode, onOpenFile }: AiMarkdownProps) {
  const [copied, setCopied] = useState<number | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const parts = useMemo(() => {
    const result: { type: "text" | "code"; lang?: string; value: string; filePath?: string; action?: "edit" | "create" | "run" }[] = [];
    const codeRegex = /```([\w:.\/\\-]*)\n([\s\S]*?)```/g;
    let lastIdx = 0;
    let match;
    while ((match = codeRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        result.push({ type: "text", value: content.slice(lastIdx, match.index) });
      }
      const langTag = match[1] || "plaintext";
      let lang = langTag;
      let filePath: string | undefined;
      let action: "edit" | "create" | "run" | undefined;

      if (langTag.startsWith("EDIT:")) {
        filePath = langTag.slice(5);
        lang = filePath.split(".").pop() || "plaintext";
        action = "edit";
      } else if (langTag.startsWith("CREATE:")) {
        filePath = langTag.slice(7);
        lang = filePath.split(".").pop() || "plaintext";
        action = "create";
      } else if (langTag === "RUN") {
        action = "run";
        lang = "shell";
      }

      result.push({ type: "code", lang, value: match[2].trimEnd(), filePath, action });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < content.length) {
      result.push({ type: "text", value: content.slice(lastIdx) });
    }
    return result;
  }, [content]);

  const renderInline = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-700/50 px-1 py-0.5 rounded text-violet-300 text-[11px]">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-400 underline">$1</a>');
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApply = (part: typeof parts[0], idx: number) => {
    if (part.filePath && onApplyCode) {
      onApplyCode(part.filePath, part.value, part.action === "create");
      setApplied((prev) => new Set(prev).add(idx));
    }
  };

  return (
    <div className="space-y-2">
      {parts.map((part, i) =>
        part.type === "code" ? (
          <div key={i} className={`relative group rounded-lg overflow-hidden border ${
            part.action === "edit" ? "border-amber-500/30" :
            part.action === "create" ? "border-green-500/30" :
            part.action === "run" ? "border-blue-500/30" :
            "border-slate-700/50"
          }`}>
            <div className={`flex items-center justify-between px-3 py-1 border-b ${
              part.action === "edit" ? "bg-amber-500/10 border-amber-500/20" :
              part.action === "create" ? "bg-green-500/10 border-green-500/20" :
              part.action === "run" ? "bg-blue-500/10 border-blue-500/20" :
              "bg-slate-800/80 border-slate-700/30"
            }`}>
              <div className="flex items-center gap-2">
                {part.action === "edit" && <FileEdit className="w-3 h-3 text-amber-400" />}
                {part.action === "create" && <Plus className="w-3 h-3 text-green-400" />}
                {part.action === "run" && <Play className="w-3 h-3 text-blue-400" />}
                <span className="text-[10px] text-slate-400">
                  {part.filePath ? part.filePath : part.lang?.toUpperCase()}
                </span>
                {part.action && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    part.action === "edit" ? "bg-amber-500/20 text-amber-400" :
                    part.action === "create" ? "bg-green-500/20 text-green-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    {part.action === "edit" ? "EDIT" : part.action === "create" ? "NEW" : "CMD"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {part.filePath && onApplyCode && (
                  applied.has(i) ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-400">
                      <CheckCircle className="w-3 h-3" /> Applicerad
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(part, i)}
                      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-colors ${
                        part.action === "create"
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      }`}
                    >
                      <Wand2 className="w-3 h-3" /> Applicera
                    </button>
                  )
                )}
                {part.filePath && onOpenFile && (
                  <button
                    onClick={() => onOpenFile(part.filePath!)}
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                    title="Öppna fil"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => handleCopy(part.value, i)}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                  title="Kopiera kod"
                >
                  {copied === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <pre className="p-3 bg-[#0d1117] overflow-x-auto text-[11px] leading-relaxed max-h-64 overflow-y-auto">
              <code className="text-slate-300">{part.value}</code>
            </pre>
          </div>
        ) : (
          <div
            key={i}
            className="whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderInline(part.value) }}
          />
        )
      )}
    </div>
  );
}

// ── Toast notifications ──

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = t.type === "success" ? CheckCircle : t.type === "error" ? AlertCircle : Info;
        const colors = t.type === "success" ? "bg-green-500/20 border-green-500/30 text-green-300"
          : t.type === "error" ? "bg-red-500/20 border-red-500/30 text-red-300"
          : "bg-blue-500/20 border-blue-500/30 text-blue-300";
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-lg backdrop-blur-sm text-xs animate-[slideIn_0.3s_ease-out] ${colors}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="hover:opacity-70" title="Stäng">
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
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
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [filePickerQuery, setFilePickerQuery] = useState("");
  const filePickerInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [gitStatus, setGitStatus] = useState<{ branch: string; files: any[]; commits: any[]; clean: boolean } | null>(null);
  const [gitLoading, setGitLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
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

  // Split editor
  const [splitTab, setSplitTab] = useState<string>("");
  const [showSplit, setShowSplit] = useState(false);

  // Closed tabs stack (for Ctrl+Shift+T reopen)
  const [closedTabs, setClosedTabs] = useState<OpenTab[]>([]);

  // Drag & drop tabs
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Resizable panels
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [terminalHeight, setTerminalHeight] = useState(192);
  const [aiPanelWidth, setAiPanelWidth] = useState(320);
  const resizingRef = useRef<{ type: string; startPos: number; startSize: number } | null>(null);

  // Fullscreen editor
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Markdown preview
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  // Rename inline
  const [renameState, setRenameState] = useState<{ path: string; name: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Tab context menu
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  // Selection count for status bar
  const [selectionInfo, setSelectionInfo] = useState<{ chars: number; lines: number }>({ chars: 0, lines: 0 });

  // Terminal error diagnosis (Frankenstein idea #2)
  const [lastTermError, setLastTermError] = useState<{ error: string; command: string } | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");

  // AI Refactoring panel (Frankenstein idea #3)
  const [showRefactorPanel, setShowRefactorPanel] = useState(false);
  const [refactorMode, setRefactorMode] = useState<string>("review");
  const [refactorResult, setRefactorResult] = useState("");
  const [refactorLoading, setRefactorLoading] = useState(false);

  // Semantic AI search (Frankenstein idea #4)
  const [showSemanticSearch, setShowSemanticSearch] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState("");
  const [semanticResults, setSemanticResults] = useState<Array<{ path: string; relevance: string; line_hint: string }>>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Terminal (handled by XTerminal component)

  // AI
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStreaming, setAiStreaming] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  // Inline AI (Ctrl+K)
  const [inlineEdit, setInlineEdit] = useState<InlineEditState>({
    visible: false, instruction: "", selection: "", selectionRange: null,
    loading: false, result: "", streaming: false,
  });
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);

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

  // ── Flatten tree for fuzzy file picker ──
  const flattenTree = useCallback((nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = [];
    const walk = (items: FileNode[]) => {
      for (const item of items) {
        if (item.type === "file") result.push(item);
        if (item.children) walk(item.children);
      }
    };
    walk(nodes);
    return result;
  }, []);

  const allFiles = useMemo(() => flattenTree(tree), [tree, flattenTree]);

  const filePickerResults = useMemo(() => {
    if (!filePickerQuery.trim()) {
      // Show recent files first, then all files
      const recent = recentFiles.map((p) => allFiles.find((f) => f.path === p)).filter(Boolean) as FileNode[];
      const rest = allFiles.filter((f) => !recentFiles.includes(f.path));
      return [...recent, ...rest].slice(0, 20);
    }
    const q = filePickerQuery.toLowerCase();
    const scored = allFiles.map((f) => {
      const name = f.name.toLowerCase();
      const path = f.path.toLowerCase();
      let score = 0;
      // Exact name match
      if (name === q) score += 100;
      // Name starts with query
      else if (name.startsWith(q)) score += 80;
      // Name contains query
      else if (name.includes(q)) score += 60;
      // Path contains query
      else if (path.includes(q)) score += 40;
      // Fuzzy: all chars in order
      else {
        let qi = 0;
        for (let i = 0; i < path.length && qi < q.length; i++) {
          if (path[i] === q[qi]) qi++;
        }
        if (qi === q.length) score += 20;
      }
      return { file: f, score };
    }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
    return scored.slice(0, 20).map((s) => s.file);
  }, [filePickerQuery, allFiles, recentFiles]);

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

  // ── Close tab (with undo stack) ──
  const closeTab = (path: string) => {
    const tab = tabs.find((t) => t.path === path);
    if (tab?.modified && !confirm(`${tab.name} har osparade ändringar. Stäng ändå?`)) return;
    if (tab) setClosedTabs((prev) => [tab, ...prev].slice(0, 20));

    setTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTab === path) {
      const remaining = tabs.filter((t) => t.path !== path);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : "");
    }
    if (splitTab === path) { setSplitTab(""); setShowSplit(false); }
  };

  // ── Reopen closed tab (Ctrl+Shift+T) ──
  const reopenTab = () => {
    if (closedTabs.length === 0) return;
    const [tab, ...rest] = closedTabs;
    setClosedTabs(rest);
    setTabs((prev) => [...prev, tab]);
    setActiveTab(tab.path);
  };

  // ── Drag & drop tab reorder ──
  const handleTabDragStart = (e: DragEvent<HTMLDivElement>, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleTabDragOver = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleTabDrop = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    setTabs((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(dragIdx, 1);
      copy.splice(idx, 0, moved);
      return copy;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // ── Resizable panels ──
  const startResize = (type: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startPos = type === "terminal" ? e.clientY : e.clientX;
    const startSize = type === "sidebar" ? sidebarWidth : type === "terminal" ? terminalHeight : aiPanelWidth;
    resizingRef.current = { type, startPos, startSize };

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const { type: t, startPos: sp, startSize: ss } = resizingRef.current;
      if (t === "sidebar") {
        setSidebarWidth(Math.max(160, Math.min(500, ss + (ev.clientX - sp))));
      } else if (t === "terminal") {
        setTerminalHeight(Math.max(100, Math.min(500, ss - (ev.clientY - sp))));
      } else if (t === "ai") {
        setAiPanelWidth(Math.max(250, Math.min(600, ss - (ev.clientX - sp))));
      }
    };
    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
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
      addToast("success", `Sparade ${tab.name}`);
    } catch (err) {
      addToast("error", `Kunde inte spara: ${err}`);
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

  // ── Rename file/dir ──
  const handleRename = async (oldPath: string, newName: string) => {
    if (!newName.trim() || newName === oldPath.split("/").pop()) {
      setRenameState(null);
      return;
    }
    const dir = oldPath.includes("/") ? oldPath.substring(0, oldPath.lastIndexOf("/") + 1) : "";
    const newPath = dir + newName;
    try {
      await api("/rename", { method: "POST", body: JSON.stringify({ oldPath, newPath }) });
      // Update tab if open
      setTabs((prev) => prev.map((t) =>
        t.path === oldPath ? { ...t, path: newPath, name: newName } : t
      ));
      if (activeTab === oldPath) setActiveTab(newPath);
      if (splitTab === oldPath) setSplitTab(newPath);
      await loadTree();
      addToast("success", `Döpte om till ${newName}`);
    } catch (err) {
      addToast("error", `Kunde inte döpa om: ${err}`);
    }
    setRenameState(null);
  };

  // ── Duplicate file ──
  const handleDuplicate = async (path: string) => {
    const ext = path.includes(".") ? "." + path.split(".").pop() : "";
    const base = ext ? path.slice(0, -ext.length) : path;
    const newPath = base + "-copy" + ext;
    try {
      const data = await api(`/file?path=${encodeURIComponent(path)}`);
      await api("/file", { method: "POST", body: JSON.stringify({ path: newPath, content: data.content || "" }) });
      await loadTree();
      openFile({ name: newPath.split("/").pop() || newPath, path: newPath, type: "file" });
      addToast("success", `Duplicerade till ${newPath.split("/").pop()}`);
    } catch (err) {
      addToast("error", `Kunde inte duplicera: ${err}`);
    }
  };

  // ── Close other/right/saved tabs ──
  const closeOtherTabs = (keepPath: string) => {
    const keep = tabs.filter((t) => t.path === keepPath);
    const closing = tabs.filter((t) => t.path !== keepPath);
    setClosedTabs((prev) => [...closing, ...prev].slice(0, 20));
    setTabs(keep);
    setActiveTab(keepPath);
  };
  const closeTabsToRight = (path: string) => {
    const idx = tabs.findIndex((t) => t.path === path);
    if (idx < 0) return;
    const closing = tabs.slice(idx + 1);
    setClosedTabs((prev) => [...closing, ...prev].slice(0, 20));
    setTabs(tabs.slice(0, idx + 1));
    if (!tabs.slice(0, idx + 1).find((t) => t.path === activeTab)) {
      setActiveTab(path);
    }
  };
  const closeSavedTabs = () => {
    const unsaved = tabs.filter((t) => t.modified);
    const saved = tabs.filter((t) => !t.modified);
    setClosedTabs((prev) => [...saved, ...prev].slice(0, 20));
    setTabs(unsaved);
    if (unsaved.length > 0 && !unsaved.find((t) => t.path === activeTab)) {
      setActiveTab(unsaved[0].path);
    } else if (unsaved.length === 0) {
      setActiveTab("");
    }
  };

  // ── AI Error Diagnosis (Frankenstein idea #2) ──
  const handleTerminalError = useCallback((error: string, command: string) => {
    setLastTermError({ error, command });
    setDiagnosis("");
  }, []);

  const runDiagnosis = async () => {
    if (!lastTermError) return;
    setDiagnosing(true);
    setDiagnosis("");
    try {
      const currentFile = tabs.find((t) => t.path === activeTab);
      const res = await api("/ai/diagnose", {
        method: "POST",
        body: JSON.stringify({
          error: lastTermError.error,
          command: lastTermError.command,
          currentFile: currentFile?.path || null,
          currentContent: currentFile?.content?.slice(0, 3000) || null,
        }),
      });
      setDiagnosis(res.diagnosis || "Ingen diagnos tillgänglig.");
    } catch (err) {
      setDiagnosis(`Fel vid diagnos: ${err}`);
    } finally {
      setDiagnosing(false);
    }
  };

  // ── AI Refactoring (Frankenstein idea #3) ──
  const runRefactor = async (mode?: string) => {
    const currentFile = tabs.find((t) => t.path === activeTab);
    if (!currentFile) { addToast("error", "Öppna en fil först"); return; }

    const editor = editorRef.current;
    const selection = editor?.getSelection();
    const model = editor?.getModel();
    const selectedText = selection && model && !selection.isEmpty() ? model.getValueInRange(selection) : "";
    const content = selectedText || currentFile.content;

    setRefactorLoading(true);
    setRefactorResult("");
    setShowRefactorPanel(true);
    const m = mode || refactorMode;
    setRefactorMode(m);

    try {
      const res = await api("/ai/refactor", {
        method: "POST",
        body: JSON.stringify({
          path: currentFile.path,
          content,
          mode: m,
        }),
      });
      setRefactorResult(res.result || "Inget resultat.");
    } catch (err) {
      setRefactorResult(`Fel: ${err}`);
    } finally {
      setRefactorLoading(false);
    }
  };

  const applyRefactorResult = () => {
    if (!refactorResult || refactorMode === "review") return;
    const currentFile = tabs.find((t) => t.path === activeTab);
    if (!currentFile) return;

    const editor = editorRef.current;
    const selection = editor?.getSelection();
    const model = editor?.getModel();

    if (selection && model && !selection.isEmpty()) {
      editor.executeEdits("ai-refactor", [{
        range: selection,
        text: refactorResult,
      }]);
    } else {
      setTabs((prev) => prev.map((t) =>
        t.path === activeTab ? { ...t, content: refactorResult, modified: true } : t
      ));
    }
    addToast("success", "AI-refaktorering applicerad");
    setShowRefactorPanel(false);
  };

  // ── Semantic AI Search (Frankenstein idea #4) ──
  const runSemanticSearch = async () => {
    if (!semanticQuery.trim()) return;
    setSemanticLoading(true);
    setSemanticResults([]);
    try {
      const res = await api("/ai/search-semantic", {
        method: "POST",
        body: JSON.stringify({ query: semanticQuery }),
      });
      setSemanticResults(res.results || []);
    } catch (err) {
      addToast("error", `Semantisk sökning misslyckades: ${err}`);
    } finally {
      setSemanticLoading(false);
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

  // ── Track recent files ──
  useEffect(() => {
    if (activeTab) {
      setRecentFiles((prev) => [activeTab, ...prev.filter((p) => p !== activeTab)].slice(0, 10));
    }
  }, [activeTab]);

  // ── AI Chat (streaming SSE) ──
  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const msg = aiInput.trim();
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", content: msg, timestamp: Date.now() }]);
    setAiLoading(true);
    setAiStreaming(true);

    // Add placeholder AI message for streaming
    const aiMsgIdx = Date.now();
    setAiMessages((prev) => [...prev, { role: "ai", content: "", timestamp: aiMsgIdx }]);

    const abortController = new AbortController();
    aiAbortRef.current = abortController;

    try {
      const activeFile = tabs.find((t) => t.path === activeTab);

      const response = await fetch(`${BRIDGE_URL}/api/workspace/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          currentFile: activeFile?.path || null,
          currentContent: activeFile?.content || null,
          openFiles: tabs.map((t) => t.path),
          history: aiMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) throw new Error("Stream failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

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
            if (data.token) {
              accumulated += data.token;
              setAiMessages((prev) =>
                prev.map((m) => m.timestamp === aiMsgIdx ? { ...m, content: accumulated } : m)
              );
              // Auto-scroll
              setTimeout(() => aiRef.current?.scrollTo(0, aiRef.current.scrollHeight), 10);
            }
            if (data.done && data.fileActions?.length) {
              for (const fa of data.fileActions) {
                if ((fa.action === "edit" || fa.action === "create") && fa.success) {
                  const existingTab = tabs.find((t) => t.path === fa.path);
                  if (existingTab) {
                    setTabs((prev) =>
                      prev.map((t) =>
                        t.path === fa.path
                          ? { ...t, content: fa.content, originalContent: fa.content, modified: false }
                          : t
                      )
                    );
                  } else {
                    const name = fa.path.split("/").pop() || fa.path;
                    setTabs((prev) => [...prev, {
                      path: fa.path, name, language: fa.language || "plaintext",
                      content: fa.content, originalContent: fa.content, modified: false,
                    }]);
                    setActiveTab(fa.path);
                  }
                }
                if (fa.action === "run") {
                  setShowTerminal(true);
                  addToast(fa.exitCode === 0 ? "success" : "error", `Körde: ${fa.command} [exit: ${fa.exitCode}]`);
                }
              }
              await loadTree();
            }
            if (data.error) {
              accumulated += `\n\n**Fel:** ${data.error}`;
              setAiMessages((prev) =>
                prev.map((m) => m.timestamp === aiMsgIdx ? { ...m, content: accumulated } : m)
              );
            }
          } catch { /* skip malformed SSE */ }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setAiMessages((prev) =>
          prev.map((m) => m.timestamp === aiMsgIdx ? { ...m, content: `Fel: ${err}` } : m)
        );
      }
    } finally {
      setAiLoading(false);
      setAiStreaming(false);
      aiAbortRef.current = null;
      setTimeout(() => aiRef.current?.scrollTo(0, aiRef.current.scrollHeight), 50);
    }
  };

  const stopAiStream = () => {
    aiAbortRef.current?.abort();
    setAiLoading(false);
    setAiStreaming(false);
  };

  // ── Inline AI (Ctrl+K) ──
  const triggerInlineEdit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!model) return;

    const selectedText = selection ? model.getValueInRange(selection) : "";
    const range = selection ? {
      startLine: selection.startLineNumber,
      endLine: selection.endLineNumber,
      startCol: selection.startColumn,
      endCol: selection.endColumn,
    } : null;

    setInlineEdit({
      visible: true,
      instruction: "",
      selection: selectedText,
      selectionRange: range,
      loading: false,
      result: "",
      streaming: false,
    });
    setTimeout(() => inlineInputRef.current?.focus(), 50);
  }, []);

  const executeInlineEdit = async () => {
    if (!inlineEdit.instruction.trim()) return;
    const currentFile = tabs.find((t) => t.path === activeTab);
    if (!currentFile) return;

    setInlineEdit((prev) => ({ ...prev, loading: true, streaming: true, result: "" }));

    try {
      const response = await fetch(`${BRIDGE_URL}/api/workspace/ai/inline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentFile.path,
          selection: inlineEdit.selection,
          instruction: inlineEdit.instruction,
          fullContent: currentFile.content,
          selectionRange: inlineEdit.selectionRange,
        }),
      });

      if (!response.ok || !response.body) throw new Error("Inline edit failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

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
            if (data.token) {
              accumulated += data.token;
              setInlineEdit((prev) => ({ ...prev, result: accumulated }));
            }
            if (data.done) {
              setInlineEdit((prev) => ({ ...prev, result: data.result || accumulated, loading: false, streaming: false }));
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setInlineEdit((prev) => ({ ...prev, loading: false, streaming: false, result: `Fel: ${err}` }));
    }
  };

  const acceptInlineEdit = () => {
    if (!inlineEdit.result || !inlineEdit.selectionRange) return;
    const editor = editorRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const range = inlineEdit.selectionRange;
    const monacoRange = new (window as any).monaco.Range(
      range.startLine, range.startCol, range.endLine, range.endCol
    );

    editor.executeEdits("inline-ai", [{
      range: monacoRange,
      text: inlineEdit.result,
    }]);

    setInlineEdit({ visible: false, instruction: "", selection: "", selectionRange: null, loading: false, result: "", streaming: false });
    addToast("success", "AI-ändring applicerad");
  };

  const dismissInlineEdit = () => {
    setInlineEdit({ visible: false, instruction: "", selection: "", selectionRange: null, loading: false, result: "", streaming: false });
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

  // ── Git functions ──
  const loadGitStatus = useCallback(async () => {
    setGitLoading(true);
    try {
      const data = await api("/git/status");
      setGitStatus(data);
    } catch { setGitStatus(null); }
    finally { setGitLoading(false); }
  }, []);

  const stageFiles = async (paths?: string[]) => {
    await api("/git/stage", { method: "POST", body: JSON.stringify({ paths }) });
    await loadGitStatus();
    addToast("success", "Filer stagade");
  };

  const unstageFiles = async (paths?: string[]) => {
    await api("/git/unstage", { method: "POST", body: JSON.stringify({ paths }) });
    await loadGitStatus();
  };

  const commitChanges = async () => {
    if (!commitMsg.trim()) return;
    try {
      const result = await api("/git/commit", { method: "POST", body: JSON.stringify({ message: commitMsg }) });
      if (result.ok) {
        addToast("success", "Commit skapad!");
        setCommitMsg("");
        await loadGitStatus();
      } else {
        addToast("error", result.stderr || "Commit misslyckades");
      }
    } catch (err) { addToast("error", `Commit-fel: ${err}`); }
  };

  const pushChanges = async () => {
    try {
      const result = await api("/git/push", { method: "POST" });
      if (result.ok) addToast("success", "Push lyckades!");
      else addToast("error", result.stderr || "Push misslyckades");
    } catch (err) { addToast("error", `Push-fel: ${err}`); }
  };

  const aiCommitMsg = async () => {
    try {
      const data = await api("/git/ai-commit", { method: "POST" });
      setCommitMsg(data.message || "");
    } catch { addToast("error", "Kunde inte generera commit-meddelande"); }
  };

  useEffect(() => { loadGitStatus(); }, [loadGitStatus]);
  useEffect(() => { if (showGitPanel) loadGitStatus(); }, [showGitPanel, loadGitStatus]);

  // ── AI Autocomplete (ghost text) ──
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteAbortRef = useRef<AbortController | null>(null);

  const setupAutocomplete = useCallback((editor: any, monaco: any) => {
    if (!editor || !monaco) return;

    const provider = monaco.languages.registerInlineCompletionsProvider("*", {
      provideInlineCompletions: async (model: any, position: any, _context: any, token: any) => {
        // Debounce — only trigger after user stops typing
        if (autocompleteAbortRef.current) autocompleteAbortRef.current.abort();
        const abortController = new AbortController();
        autocompleteAbortRef.current = abortController;

        await new Promise((r) => setTimeout(r, 800));
        if (token.isCancellationRequested || abortController.signal.aborted) return { items: [] };

        const content = model.getValue();
        const line = position.lineNumber;
        const column = position.column;
        const currentLine = model.getLineContent(line);

        // Skip if line is empty or just whitespace, or if content is too short
        if (currentLine.trim().length < 3 || content.length < 20) return { items: [] };

        try {
          const activeFile = tabs.find((t) => t.path === activeTab);
          const res = await fetch(`${BRIDGE_URL}/api/workspace/ai/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: activeFile?.path || "",
              content,
              line,
              column,
            }),
            signal: abortController.signal,
          });

          if (!res.ok) return { items: [] };
          const data = await res.json();
          if (!data.completion?.trim()) return { items: [] };

          return {
            items: [{
              insertText: data.completion,
              range: new monaco.Range(line, column, line, column),
            }],
          };
        } catch {
          return { items: [] };
        }
      },
      freeInlineCompletions: () => {},
    });

    return () => provider.dispose();
  }, [activeTab, tabs]);

  const currentTab = tabs.find((t) => t.path === activeTab);
  const splitTabData = tabs.find((t) => t.path === splitTab);

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
    { id: "reopen", label: "Återöppna stängd flik", shortcut: "Ctrl+Shift+T", icon: Undo2, action: reopenTab, category: "Fil" },
    { id: "split", label: `${showSplit ? "Stäng" : "Öppna"} delad vy`, shortcut: "Ctrl+\\", icon: Columns, action: () => { if (showSplit) { setShowSplit(false); setSplitTab(""); } else if (currentTab) { setShowSplit(true); setSplitTab(activeTab); } }, category: "Vy" },
    { id: "fullscreen", label: `${isFullscreen ? "Avsluta" : "Aktivera"} fullskärm`, shortcut: "F11", icon: isFullscreen ? Minimize2 : Maximize2, action: () => setIsFullscreen((v) => !v), category: "Vy" },
    { id: "mdpreview", label: `${showMarkdownPreview ? "Dölj" : "Visa"} Markdown-förhandsvisning`, icon: Eye, action: () => setShowMarkdownPreview((v) => !v), category: "Vy" },
    { id: "clearterminal", label: "Rensa terminal", icon: Terminal, action: () => addToast("info", "Använd Ctrl+L i terminalen för att rensa"), category: "Terminal" },
    { id: "refresh", label: "Uppdatera filträd", icon: RefreshCw, action: loadTree, category: "Navigering" },
    { id: "git", label: "Visa/dölj Git-panel", shortcut: "Ctrl+G", icon: GitBranch, action: () => setShowGitPanel((v) => !v), category: "Git" },
    { id: "inlineai", label: "Inline AI Edit", shortcut: "Ctrl+K", icon: Wand2, action: triggerInlineEdit, category: "AI" },
    { id: "rename", label: "Döp om fil", shortcut: "F2", icon: Pencil, action: () => { if (activeTab) { const name = activeTab.split("/").pop() || activeTab; setRenameState({ path: activeTab, name }); setTimeout(() => renameInputRef.current?.focus(), 50); } }, category: "Fil" },
    { id: "duplicate", label: "Duplicera fil", icon: Files, action: () => { if (activeTab) handleDuplicate(activeTab); }, category: "Fil" },
    { id: "findreplace", label: "Sök & Ersätt", shortcut: "Ctrl+H", icon: Replace, action: () => { editorRef.current?.getAction("editor.action.startFindReplaceAction")?.run(); }, category: "Redigering" },
    { id: "closeothers", label: "Stäng andra flikar", icon: X, action: () => { if (activeTab) closeOtherTabs(activeTab); }, category: "Fil" },
    { id: "closeright", label: "Stäng flikar till höger", icon: ChevronsRight, action: () => { if (activeTab) closeTabsToRight(activeTab); }, category: "Fil" },
    { id: "closesaved", label: "Stäng sparade flikar", icon: Save, action: closeSavedTabs, category: "Fil" },
    { id: "gotoline", label: "Gå till rad", shortcut: "Ctrl+G", icon: Hash, action: () => { editorRef.current?.getAction("editor.action.gotoLine")?.run(); }, category: "Navigering" },
    { id: "format", label: "Formatera dokument", shortcut: "Shift+Alt+F", icon: FileEdit, action: () => { editorRef.current?.getAction("editor.action.formatDocument")?.run(); }, category: "Redigering" },
    { id: "ai-review", label: "🧟 AI Kodgranskning", icon: ShieldCheck, action: () => runRefactor("review"), category: "AI" },
    { id: "ai-refactor", label: "🧟 AI Refaktorera", icon: BrainCircuit, action: () => runRefactor("refactor"), category: "AI" },
    { id: "ai-optimize", label: "🧟 AI Optimera", icon: Gauge, action: () => runRefactor("optimize"), category: "AI" },
    { id: "ai-simplify", label: "🧟 AI Förenkla", icon: Sparkles, action: () => runRefactor("simplify"), category: "AI" },
    { id: "ai-document", label: "🧟 AI Dokumentera", icon: BookOpen, action: () => runRefactor("document"), category: "AI" },
    { id: "ai-test", label: "🧟 AI Generera tester", icon: TestTube, action: () => runRefactor("test"), category: "AI" },
    { id: "ai-diagnose", label: "🧟 AI Diagnostisera fel", icon: Bug, action: () => { if (lastTermError) runDiagnosis(); else addToast("info", "Kör ett kommando i terminalen som ger fel först"); }, category: "AI" },
    { id: "semantic-search", label: "🧟 AI Semantisk sökning", icon: SearchCode, action: () => setShowSemanticSearch(true), category: "AI" },
  ], [activeTab, showMinimap, wordWrap, autoSave, showSplit, isFullscreen, showMarkdownPreview, currentTab, triggerInlineEdit, lastTermError]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeTab) saveFile(activeTab);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setShowFilePicker((v) => !v);
        setFilePickerQuery("");
        setTimeout(() => filePickerInputRef.current?.focus(), 50);
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
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "T") {
        e.preventDefault();
        reopenTab();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        if (showSplit) { setShowSplit(false); setSplitTab(""); }
        else if (activeTab) { setShowSplit(true); setSplitTab(activeTab); }
      }
      if (e.key === "F11") {
        e.preventDefault();
        setIsFullscreen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        triggerInlineEdit();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        setShowGitPanel((v) => !v);
      }
      if (e.key === "F2" && activeTab) {
        e.preventDefault();
        const name = activeTab.split("/").pop() || activeTab;
        setRenameState({ path: activeTab, name });
        setTimeout(() => renameInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        if (inlineEdit.visible) dismissInlineEdit();
        if (renameState) setRenameState(null);
        if (tabContextMenu) setTabContextMenu(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, tabs, showSplit, closedTabs, inlineEdit.visible, triggerInlineEdit]);

  // ── Dismiss context menus on click outside ──
  useEffect(() => {
    if (!contextMenu && !tabContextMenu) return;
    const handler = () => { setContextMenu(null); setTabContextMenu(null); };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu, tabContextMenu]);

  // ── Monaco mount handler ──
  const handleMonacoMount = useCallback((_editor: any, monaco: Monaco) => {
    editorRef.current = _editor;
    defineGracestackThemes(monaco);
    setMonacoReady(true);
    _editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({ line: e.position.lineNumber, col: e.position.column });
    });
    _editor.onDidChangeCursorSelection((e: any) => {
      const sel = e.selection;
      if (sel.isEmpty()) {
        setSelectionInfo({ chars: 0, lines: 0 });
      } else {
        const model = _editor.getModel();
        if (model) {
          const text = model.getValueInRange(sel);
          setSelectionInfo({ chars: text.length, lines: text.split("\n").length });
        }
      }
    });
    // Register AI autocomplete
    setupAutocomplete(_editor, monaco);
  }, [setupAutocomplete]);

  // ── Breadcrumbs ──
  const breadcrumbs = currentTab ? currentTab.path.split("/") : [];

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-200">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Command Palette */}
      {showCommandPalette && <CommandPalette commands={commands} onClose={() => setShowCommandPalette(false)} />}

      {/* Fuzzy File Picker (Ctrl+P) */}
      {showFilePicker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40" onClick={() => setShowFilePicker(false)}>
          <div className="w-[520px] max-w-[90vw] bg-[#1c2128] border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                ref={filePickerInputRef}
                type="text"
                value={filePickerQuery}
                onChange={(e) => setFilePickerQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowFilePicker(false);
                  if (e.key === "Enter" && filePickerResults.length > 0) {
                    openFile(filePickerResults[0]);
                    setShowFilePicker(false);
                  }
                }}
                placeholder="Sök fil efter namn..."
                className="flex-1 bg-transparent text-sm outline-none text-slate-200 placeholder:text-slate-500"
                autoFocus
              />
              <kbd className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Esc</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {filePickerResults.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-slate-500">Inga filer hittades</div>
              )}
              {filePickerResults.map((f, i) => {
                const fi = getFileIcon(f.name);
                const FI = fi.icon;
                const dir = f.path.includes("/") ? f.path.substring(0, f.path.lastIndexOf("/")) : "";
                const isOpen = tabs.some((t) => t.path === f.path);
                const isRecent = recentFiles.includes(f.path);
                return (
                  <div
                    key={f.path}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-slate-700/50 transition-colors ${i === 0 ? "bg-slate-700/30" : ""}`}
                    onClick={() => { openFile(f); setShowFilePicker(false); }}
                  >
                    <FI className={`w-4 h-4 shrink-0 ${fi.color}`} />
                    <span className="text-sm text-slate-200">{f.name}</span>
                    {dir && <span className="text-xs text-slate-500 truncate">{dir}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      {isRecent && <Clock className="w-3 h-3 text-slate-600" />}
                      {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#1c2128] border border-slate-600/50 rounded-lg shadow-2xl py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          {contextMenu.node.type === "file" && (
            <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => openFile(contextMenu.node)}>
              <FolderOpen className="w-3 h-3 text-slate-500" /> Öppna fil
            </button>
          )}
          <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => {
            setRenameState({ path: contextMenu.node.path, name: contextMenu.node.name });
            setTimeout(() => renameInputRef.current?.focus(), 50);
          }}>
            <Pencil className="w-3 h-3 text-slate-500" /> Döp om <span className="ml-auto text-[10px] text-slate-600">F2</span>
          </button>
          {contextMenu.node.type === "file" && (
            <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => handleDuplicate(contextMenu.node.path)}>
              <Files className="w-3 h-3 text-slate-500" /> Duplicera
            </button>
          )}
          <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => {
            navigator.clipboard.writeText(contextMenu.node.path);
            addToast("info", "Sökväg kopierad");
          }}>
            <Copy className="w-3 h-3 text-slate-500" /> Kopiera sökväg
          </button>
          {contextMenu.node.type === "directory" && (
            <>
              <div className="border-t border-slate-700/50 my-1" />
              <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={async () => {
                const name = prompt(`Ny fil i ${contextMenu.node.name}/`);
                if (!name) return;
                const path = contextMenu.node.path + "/" + name;
                try {
                  await api("/file", { method: "POST", body: JSON.stringify({ path, content: "" }) });
                  await loadTree();
                  openFile({ name: name.split("/").pop() || name, path, type: "file" });
                } catch (err) { addToast("error", `Kunde inte skapa: ${err}`); }
              }}>
                <Plus className="w-3 h-3 text-slate-500" /> Ny fil här
              </button>
              <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={async () => {
                const name = prompt(`Ny mapp i ${contextMenu.node.name}/`);
                if (!name) return;
                try {
                  await api("/dir", { method: "POST", body: JSON.stringify({ path: contextMenu.node.path + "/" + name }) });
                  await loadTree();
                } catch (err) { addToast("error", `Kunde inte skapa mapp: ${err}`); }
              }}>
                <FolderPlus className="w-3 h-3 text-slate-500" /> Ny mapp här
              </button>
            </>
          )}
          <div className="border-t border-slate-700/50 my-1" />
          <button className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700/50 flex items-center gap-2" onClick={async () => {
            if (!confirm(`Radera ${contextMenu.node.name}?`)) return;
            try {
              await api(`/file?path=${encodeURIComponent(contextMenu.node.path)}`, { method: "DELETE" });
              await loadTree();
              if (tabs.find((t) => t.path === contextMenu.node.path)) closeTab(contextMenu.node.path);
              addToast("success", `Raderade ${contextMenu.node.name}`);
            } catch (err) { addToast("error", `Kunde inte radera: ${err}`); }
          }}>
            <X className="w-3 h-3" /> Radera
          </button>
        </div>
      )}

      {/* Rename Dialog */}
      {renameState && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/40" onClick={() => setRenameState(null)}>
          <div className="w-[400px] max-w-[90vw] bg-[#1c2128] border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
              <Pencil className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">Döp om</span>
              <span className="text-[10px] text-slate-500 ml-auto">{renameState.path}</span>
            </div>
            <div className="px-4 py-3">
              <input
                ref={renameInputRef}
                type="text"
                defaultValue={renameState.name}
                placeholder="Nytt namn..."
                title="Döp om fil"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename(renameState.path, (e.target as HTMLInputElement).value);
                  if (e.key === "Escape") setRenameState(null);
                }}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm outline-none text-slate-200 placeholder:text-slate-500 focus:border-amber-500/50"
                autoFocus
                onFocus={(e) => {
                  const val = e.target.value;
                  const dotIdx = val.lastIndexOf(".");
                  if (dotIdx > 0) e.target.setSelectionRange(0, dotIdx);
                  else e.target.select();
                }}
              />
              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-600">
                <kbd className="px-1 py-0.5 bg-slate-800 rounded">Enter</kbd> bekräfta
                <kbd className="px-1 py-0.5 bg-slate-800 rounded">Esc</kbd> avbryt
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Context Menu */}
      {tabContextMenu && (
        <div
          className="fixed z-50 bg-[#1c2128] border border-slate-600/50 rounded-lg shadow-2xl py-1 min-w-[180px]"
          style={{ left: tabContextMenu.x, top: tabContextMenu.y }}
          onClick={() => setTabContextMenu(null)}
        >
          <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => closeTab(tabContextMenu.path)}>
            <X className="w-3 h-3 text-slate-500" /> Stäng
          </button>
          <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => closeOtherTabs(tabContextMenu.path)}>
            <X className="w-3 h-3 text-slate-500" /> Stäng andra
          </button>
          <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => closeTabsToRight(tabContextMenu.path)}>
            <ChevronsRight className="w-3 h-3 text-slate-500" /> Stäng till höger
          </button>
          <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={closeSavedTabs}>
            <Save className="w-3 h-3 text-slate-500" /> Stäng sparade
          </button>
          <div className="border-t border-slate-700/50 my-1" />
          <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => {
            navigator.clipboard.writeText(tabContextMenu.path);
            addToast("info", "Sökväg kopierad");
          }}>
            <Copy className="w-3 h-3 text-slate-500" /> Kopiera sökväg
          </button>
          <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => {
            const name = tabContextMenu.path.split("/").pop() || tabContextMenu.path;
            setRenameState({ path: tabContextMenu.path, name });
            setTimeout(() => renameInputRef.current?.focus(), 50);
          }}>
            <Pencil className="w-3 h-3 text-slate-500" /> Döp om <span className="ml-auto text-[10px] text-slate-600">F2</span>
          </button>
          {!showSplit && (
            <button className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/50 flex items-center gap-2" onClick={() => {
              setShowSplit(true);
              setSplitTab(tabContextMenu.path);
            }}>
              <Columns className="w-3 h-3 text-slate-500" /> Öppna i delad vy
            </button>
          )}
        </div>
      )}

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

      {/* AI Refactoring Panel */}
      {showRefactorPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRefactorPanel(false)}>
          <div className="w-[600px] max-w-[90vw] max-h-[80vh] bg-[#1c2128] border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 shrink-0">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-slate-300">Frankenstein AI — Kodanalys</span>
              <div className="flex items-center gap-1 ml-auto">
                {[
                  { id: "review", label: "Granska", icon: ShieldCheck, color: "text-blue-400" },
                  { id: "refactor", label: "Refaktorera", icon: BrainCircuit, color: "text-violet-400" },
                  { id: "optimize", label: "Optimera", icon: Gauge, color: "text-amber-400" },
                  { id: "simplify", label: "Förenkla", icon: Sparkles, color: "text-green-400" },
                  { id: "document", label: "Dokumentera", icon: BookOpen, color: "text-cyan-400" },
                  { id: "test", label: "Tester", icon: TestTube, color: "text-pink-400" },
                ].map((m) => {
                  const MIcon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => runRefactor(m.id)}
                      disabled={refactorLoading}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors ${
                        refactorMode === m.id ? `bg-slate-700/80 ${m.color}` : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/40"
                      }`}
                      title={m.label}
                    >
                      <MIcon className="w-3 h-3" /> {m.label}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setShowRefactorPanel(false)} className="p-1 hover:bg-slate-700 rounded ml-2" title="Stäng">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {refactorLoading ? (
                <div className="flex items-center justify-center py-12 text-violet-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-sm">Frankenstein analyserar...</span>
                </div>
              ) : refactorResult ? (
                <div className="text-xs">
                  {refactorMode === "review" ? (
                    <AiMarkdown content={refactorResult} />
                  ) : (
                    <pre className="whitespace-pre-wrap text-slate-300 font-mono text-[11px] leading-relaxed bg-[#0d1117] rounded-lg p-3 border border-slate-700/50 max-h-[50vh] overflow-y-auto">{refactorResult}</pre>
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs py-12">
                  <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-violet-500/40" />
                  <p>Välj ett analysläge ovan för att starta</p>
                  <p className="mt-1 text-slate-600">Markera kod i editorn för att analysera en specifik del</p>
                </div>
              )}
            </div>
            {refactorResult && refactorMode !== "review" && !refactorLoading && (
              <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-700/50 shrink-0">
                <button
                  onClick={applyRefactorResult}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                >
                  <Check className="w-3 h-3" /> Applicera ändringar
                </button>
                <button
                  onClick={() => { setDiffContent({ original: tabs.find((t) => t.path === activeTab)?.content || "", modified: refactorResult }); setShowDiff(true); setShowRefactorPanel(false); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30"
                >
                  <Eye className="w-3 h-3" /> Visa diff
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(refactorResult); addToast("info", "Kopierat till urklipp"); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-700/50 text-slate-400 rounded-lg hover:bg-slate-700/70"
                >
                  <Copy className="w-3 h-3" /> Kopiera
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Semantic AI Search */}
      {showSemanticSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/40" onClick={() => setShowSemanticSearch(false)}>
          <div className="w-[560px] max-w-[90vw] bg-[#1c2128] border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
              <SearchCode className="w-4 h-4 text-violet-400" />
              <input
                type="text"
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSemanticSearch();
                  if (e.key === "Escape") setShowSemanticSearch(false);
                }}
                placeholder="Beskriv vad du letar efter... (t.ex. 'hur hanteras autentisering')"
                title="AI-sökning"
                className="flex-1 bg-transparent text-sm outline-none text-slate-200 placeholder:text-slate-500"
                autoFocus
              />
              {semanticLoading && <Loader2 className="w-4 h-4 animate-spin text-violet-400" />}
              <kbd className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Enter</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {semanticResults.length === 0 && !semanticLoading && (
                <div className="px-4 py-8 text-center text-xs text-slate-500">
                  <BrainCircuit className="w-6 h-6 mx-auto mb-2 text-violet-500/30" />
                  <p>Ställ en fråga i naturligt språk om din kodbas</p>
                  <p className="mt-1 text-slate-600">Frankenstein AI analyserar projektets filer och hittar relevanta resultat</p>
                </div>
              )}
              {semanticResults.map((r, i) => {
                const fi = getFileIcon(r.path.split("/").pop() || r.path);
                const FI = fi.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-700/30 cursor-pointer border-b border-slate-700/20 transition-colors"
                    onClick={() => {
                      openFile({ name: r.path.split("/").pop() || r.path, path: r.path, type: "file" });
                      setShowSemanticSearch(false);
                    }}
                  >
                    <FI className={`w-4 h-4 shrink-0 mt-0.5 ${fi.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-blue-400 font-medium">{r.path}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{r.relevance}</div>
                      {r.line_hint && <div className="text-[10px] text-slate-600 mt-0.5">{r.line_hint}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
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
        <button
          onClick={() => setShowGitPanel((v) => !v)}
          className={`p-1.5 rounded ${showGitPanel ? "bg-orange-500/20 text-orange-400" : "hover:bg-slate-700"}`}
          title="Git (Ctrl+G)"
        >
          <GitBranch className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-700" />
        <button
          onClick={() => runRefactor("review")}
          className={`p-1.5 rounded ${showRefactorPanel ? "bg-violet-500/20 text-violet-400" : "hover:bg-slate-700"}`}
          title="🧟 AI Kodgranskning"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowSemanticSearch(true)}
          className={`p-1.5 rounded ${showSemanticSearch ? "bg-violet-500/20 text-violet-400" : "hover:bg-slate-700"}`}
          title="🧟 AI Semantisk sökning"
        >
          <SearchCode className="w-4 h-4" />
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
        <div className="w-px h-5 bg-slate-700" />
        <button
          onClick={() => { if (showSplit) { setShowSplit(false); setSplitTab(""); } else if (activeTab) { setShowSplit(true); setSplitTab(activeTab); } }}
          className={`p-1.5 rounded ${showSplit ? "bg-blue-500/20 text-blue-400" : "hover:bg-slate-700"}`}
          title="Delad vy (Ctrl+\)"
        >
          <Columns className="w-4 h-4" />
        </button>
        {currentTab?.language === "markdown" && (
          <button
            onClick={() => setShowMarkdownPreview((v) => !v)}
            className={`p-1.5 rounded ${showMarkdownPreview ? "bg-blue-500/20 text-blue-400" : "hover:bg-slate-700"}`}
            title="Markdown-förhandsvisning"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setIsFullscreen((v) => !v)}
          className="p-1.5 hover:bg-slate-700 rounded"
          title={isFullscreen ? "Avsluta fullskärm (F11)" : "Fullskärm (F11)"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
          <button onClick={() => { setShowSearch(false); setSearchResults([]); }} title="Stäng sök">
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
        {showSidebar && !isFullscreen && (
          <div className="shrink-0 bg-[#0d1117] border-r border-slate-700/50 overflow-hidden relative" style={{ width: sidebarWidth }}>
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
              onContextMenu={(e, node) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, node });
              }}
            />
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors z-10"
              onMouseDown={(e) => startResize("sidebar", e)}
            />
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="flex bg-[#161b22] border-b border-slate-700/50 overflow-x-auto">
              {tabs.map((tab, idx) => {
                const tabIcon = getFileIcon(tab.name);
                const TabIcon = tabIcon.icon;
                return (
                  <div
                    key={tab.path}
                    draggable
                    onDragStart={(e) => handleTabDragStart(e, idx)}
                    onDragOver={(e) => handleTabDragOver(e, idx)}
                    onDrop={(e) => handleTabDrop(e, idx)}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-slate-700/30 shrink-0 transition-all ${
                      tab.path === activeTab
                        ? "bg-[#0d1117] text-slate-200 border-b-2 border-b-blue-500"
                        : "text-slate-400 hover:bg-slate-800"
                    } ${dragOverIdx === idx ? "border-l-2 border-l-blue-400" : ""} ${dragIdx === idx ? "opacity-50" : ""}`}
                    onClick={() => setActiveTab(tab.path)}
                    onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); closeTab(tab.path); } }}
                    onContextMenu={(e) => { e.preventDefault(); setTabContextMenu({ x: e.clientX, y: e.clientY, path: tab.path }); }}
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

            {/* Inline AI Widget (Ctrl+K) */}
            {inlineEdit.visible && currentTab && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-[500px] max-w-[90%] bg-[#1c2128] border border-violet-500/40 rounded-xl shadow-2xl overflow-hidden animate-[slideIn_0.2s_ease-out]">
                <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border-b border-violet-500/20">
                  <Wand2 className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300">Inline AI Edit</span>
                  {inlineEdit.selection && (
                    <span className="text-[10px] text-slate-500 ml-auto">
                      {inlineEdit.selectionRange ? `Rad ${inlineEdit.selectionRange.startLine}-${inlineEdit.selectionRange.endLine}` : "Markering"}
                    </span>
                  )}
                  <button onClick={dismissInlineEdit} className="p-0.5 hover:bg-slate-700 rounded ml-1" title="Avbryt (Esc)">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                {inlineEdit.selection && (
                  <div className="max-h-24 overflow-y-auto px-3 py-2 bg-slate-900/50 border-b border-slate-700/30">
                    <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap">{inlineEdit.selection.slice(0, 500)}{inlineEdit.selection.length > 500 ? "..." : ""}</pre>
                  </div>
                )}

                <div className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inlineInputRef}
                      type="text"
                      value={inlineEdit.instruction}
                      onChange={(e) => setInlineEdit((prev) => ({ ...prev, instruction: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !inlineEdit.loading) executeInlineEdit();
                        if (e.key === "Escape") dismissInlineEdit();
                      }}
                      placeholder={inlineEdit.selection ? "Beskriv ändringen..." : "Beskriv vad som ska genereras..."}
                      className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-500 focus:border-violet-500/50"
                      disabled={inlineEdit.loading}
                    />
                    <button
                      onClick={executeInlineEdit}
                      disabled={inlineEdit.loading || !inlineEdit.instruction.trim()}
                      className="p-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-50"
                    >
                      {inlineEdit.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {inlineEdit.result && (
                  <div className="border-t border-slate-700/30">
                    <div className="max-h-48 overflow-y-auto px-3 py-2 bg-green-500/5">
                      <div className="flex items-center gap-1 mb-1 text-[10px] text-green-400">
                        <FileEdit className="w-3 h-3" />
                        {inlineEdit.streaming ? "Genererar..." : "Förslag"}
                      </div>
                      <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">{inlineEdit.result}</pre>
                    </div>
                    {!inlineEdit.streaming && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-t border-slate-700/30">
                        <button
                          onClick={acceptInlineEdit}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Acceptera
                        </button>
                        <button
                          onClick={dismissInlineEdit}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <X className="w-3 h-3" /> Avvisa
                        </button>
                        <span className="text-[10px] text-slate-600 ml-auto">Enter = acceptera, Esc = avvisa</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!loading && !showDiff && currentTab && (
              <div className="flex h-full">
                {/* Primary editor */}
                <div className={showSplit || (showMarkdownPreview && currentTab.language === "markdown") ? "flex-1 min-w-0" : "w-full"}>
                  <Editor
                    path={currentTab.path}
                    value={currentTab.content}
                    language={currentTab.language}
                    theme={monacoReady ? editorTheme : "vs-dark"}
                    onChange={handleEditorChange}
                    onMount={handleMonacoMount}
                    options={{
                      minimap: { enabled: showMinimap, scale: 1, showSlider: "mouseover" },
                      fontSize,
                      lineNumbers: "on",
                      wordWrap,
                      tabSize: 2,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 8, bottom: 8 },
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      bracketPairColorization: { enabled: true },
                      guides: { bracketPairs: true, bracketPairsHorizontal: true, indentation: true, highlightActiveIndentation: true },
                      renderLineHighlight: "all",
                      fontLigatures: true,
                      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
                      suggest: { preview: true, showMethods: true, showFunctions: true, showKeywords: true, showSnippets: true },
                      stickyScroll: { enabled: true },
                      linkedEditing: true,
                      renderWhitespace: "selection",
                      matchBrackets: "always",
                      occurrencesHighlight: "singleFile",
                      selectionHighlight: true,
                      folding: true,
                      foldingHighlight: true,
                      showFoldingControls: "mouseover",
                      colorDecorators: true,
                      inlayHints: { enabled: "on" },
                      quickSuggestions: { other: true, comments: false, strings: true },
                      parameterHints: { enabled: true },
                      formatOnPaste: true,
                      dragAndDrop: true,
                      mouseWheelZoom: true,
                    }}
                  />
                </div>

                {/* Split editor (second pane) */}
                {showSplit && splitTabData && !(showMarkdownPreview && currentTab.language === "markdown") && (
                  <>
                    <div className="w-px bg-slate-700/50 relative">
                      <div className="absolute inset-y-0 -left-1 w-3 cursor-col-resize z-10" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2 px-3 py-1 bg-[#161b22] border-b border-slate-700/50 text-[11px] text-slate-400">
                        <span>{splitTabData.name}</span>
                        <select
                          className="ml-auto bg-transparent text-[10px] text-slate-500 outline-none cursor-pointer"
                          value={splitTab}
                          onChange={(e) => setSplitTab(e.target.value)}
                          title="Välj fil för delad vy"
                        >
                          {tabs.map((t) => <option key={t.path} value={t.path}>{t.name}</option>)}
                        </select>
                        <button onClick={() => { setShowSplit(false); setSplitTab(""); }} className="hover:bg-slate-700 rounded p-0.5" title="Stäng delad vy">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <Editor
                        path={`split-${splitTabData.path}`}
                        value={splitTabData.content}
                        language={splitTabData.language}
                        theme={monacoReady ? editorTheme : "vs-dark"}
                        options={{
                          readOnly: splitTabData.path === currentTab.path,
                          minimap: { enabled: false },
                          fontSize,
                          lineNumbers: "on",
                          wordWrap,
                          tabSize: 2,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          padding: { top: 8 },
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Markdown preview */}
                {showMarkdownPreview && currentTab.language === "markdown" && (
                  <>
                    <div className="w-px bg-slate-700/50" />
                    <div className="flex-1 min-w-0 overflow-y-auto p-4 bg-[#0d1117]">
                      <div className="flex items-center gap-2 mb-3 text-[11px] text-slate-400 border-b border-slate-700/30 pb-2">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Markdown Preview</span>
                        <button onClick={() => setShowMarkdownPreview(false)} className="ml-auto hover:bg-slate-700 rounded p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div
                        className="prose prose-invert prose-sm max-w-none text-slate-300 [&_h1]:text-slate-100 [&_h2]:text-slate-200 [&_h3]:text-slate-200 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-slate-800/50 [&_pre]:border [&_pre]:border-slate-700/50 [&_a]:text-blue-400 [&_blockquote]:border-l-blue-500/50 [&_blockquote]:text-slate-400"
                        dangerouslySetInnerHTML={{ __html: simpleMarkdown(currentTab.content) }}
                      />
                    </div>
                  </>
                )}
              </div>
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

                {/* Quick actions */}
                <div className="flex gap-2">
                  <button onClick={handleNewFile} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 hover:bg-blue-500/20 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Ny fil
                  </button>
                  <button onClick={() => setShowTerminal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-300 hover:bg-green-500/20 transition-colors">
                    <Terminal className="w-3.5 h-3.5" /> Terminal
                  </button>
                  <button onClick={() => setShowAiPanel(true)} className="flex items-center gap-1.5 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs text-violet-300 hover:bg-violet-500/20 transition-colors">
                    <Bot className="w-3.5 h-3.5" /> Frankenstein AI
                  </button>
                </div>

                {/* Project stats */}
                <div className="flex gap-4 text-[10px] text-slate-600">
                  <span>{tree.length} toppnivå-objekt</span>
                  <span>{tabs.length} öppna flikar</span>
                  <span>{closedTabs.length} i undo-stack</span>
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

                <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+S</kbd> Spara</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+P</kbd> Sök fil</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+H</kbd> Sök/Ersätt</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+`</kbd> Terminal</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">F2</kbd> Döp om</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/30 rounded-lg"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+\\</kbd> Delad vy</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-300"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+K</kbd> Inline AI</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-300"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+I</kbd> AI Panel</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-300"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">Ctrl+G</kbd> Git</div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal (xterm.js) */}
          {showTerminal && (
            <div className="border-t border-slate-700/50 bg-[#0d1117] flex flex-col relative" style={{ height: terminalHeight }}>
              <div
                className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-500/50 active:bg-blue-500/70 transition-colors z-10"
                onMouseDown={(e) => startResize("terminal", e)}
              />
              <div className="flex items-center justify-between px-3 py-1 bg-[#161b22] border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-semibold text-slate-400">Terminal</span>
                  <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full">xterm</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowTerminal(false)} title="Stäng terminal">
                    <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                  </button>
                </div>
              </div>
              {/* Error diagnosis banner */}
              {lastTermError && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border-b border-red-500/20">
                  <Bug className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-[11px] text-red-300 truncate flex-1">Fel: {lastTermError.error.slice(0, 100)}</span>
                  <button
                    onClick={runDiagnosis}
                    disabled={diagnosing}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30 disabled:opacity-50 shrink-0"
                    title="Låt Frankenstein AI analysera felet"
                  >
                    {diagnosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                    Diagnostisera
                  </button>
                  <button onClick={() => { setLastTermError(null); setDiagnosis(""); }} className="p-0.5 hover:bg-slate-700 rounded" title="Stäng">
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
              )}
              {diagnosis && (
                <div className="max-h-32 overflow-y-auto px-3 py-2 bg-violet-500/5 border-b border-violet-500/20">
                  <div className="flex items-center gap-1 mb-1 text-[10px] text-violet-400 font-semibold">
                    <BrainCircuit className="w-3 h-3" /> Frankenstein Diagnos
                  </div>
                  <AiMarkdown content={diagnosis} onApplyCode={async (path, code, isNew) => {
                    try {
                      if (isNew) await api("/file", { method: "POST", body: JSON.stringify({ path, content: code }) });
                      else await api("/file", { method: "PUT", body: JSON.stringify({ path, content: code }) });
                      addToast("success", `${isNew ? "Skapade" : "Uppdaterade"} ${path}`);
                      await loadTree();
                    } catch (err) { addToast("error", `Kunde inte spara: ${err}`); }
                  }} />
                </div>
              )}
              <div className="flex-1 min-h-0">
                <XTerminal visible={showTerminal} onError={handleTerminalError} />
              </div>
            </div>
          )}
        </div>

        {/* Git Panel */}
        {showGitPanel && (
          <div className="shrink-0 bg-[#0d1117] border-l border-slate-700/50 flex flex-col min-h-0" style={{ width: 280 }}>
            <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold text-slate-300">Git</span>
                {gitStatus?.branch && (
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">{gitStatus.branch}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={loadGitStatus} className="p-0.5 hover:bg-slate-700 rounded" title="Uppdatera">
                  <RefreshCw className={`w-3 h-3 text-slate-500 ${gitLoading ? "animate-spin" : ""}`} />
                </button>
                <button onClick={() => setShowGitPanel(false)} title="Stäng">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Commit input */}
            <div className="px-3 py-2 border-b border-slate-700/30 space-y-2">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={commitMsg}
                  onChange={(e) => setCommitMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commitChanges()}
                  placeholder="Commit-meddelande..."
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1.5 text-xs outline-none text-slate-200 placeholder:text-slate-500 focus:border-orange-500/50"
                />
                <button onClick={aiCommitMsg} className="p-1.5 bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30" title="AI generera meddelande">
                  <Wand2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={commitChanges}
                  disabled={!commitMsg.trim()}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-[11px] bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 disabled:opacity-40 transition-colors"
                >
                  <Check className="w-3 h-3" /> Commit
                </button>
                <button
                  onClick={() => stageFiles()}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Stage All
                </button>
                <button
                  onClick={pushChanges}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                >
                  <ArrowUp className="w-3 h-3" /> Push
                </button>
              </div>
            </div>

            {/* Changed files */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {gitLoading && !gitStatus && (
                <div className="flex items-center justify-center py-8 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Laddar...
                </div>
              )}
              {gitStatus?.clean && (
                <div className="text-center py-8 text-xs text-slate-500">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500/50" />
                  Inga ändringar
                </div>
              )}
              {gitStatus && !gitStatus.clean && (
                <div className="py-1">
                  {/* Staged files */}
                  {gitStatus.files.filter((f: any) => f.staged).length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-green-400 font-semibold">Stagade</div>
                      {gitStatus.files.filter((f: any) => f.staged).map((f: any) => (
                        <div key={`s-${f.path}`} className="flex items-center gap-2 px-3 py-1 hover:bg-slate-800/50 group text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            f.status === "added" ? "bg-green-400" :
                            f.status === "deleted" ? "bg-red-400" :
                            "bg-amber-400"
                          }`} />
                          <span className="flex-1 truncate text-slate-300">{f.path}</span>
                          <button
                            onClick={() => unstageFiles([f.path])}
                            className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-300"
                            title="Unstage"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Unstaged files */}
                  {gitStatus.files.filter((f: any) => !f.staged).length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Ändrade</div>
                      {gitStatus.files.filter((f: any) => !f.staged).map((f: any) => (
                        <div key={`u-${f.path}`} className="flex items-center gap-2 px-3 py-1 hover:bg-slate-800/50 group text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            f.status === "untracked" ? "bg-green-400" :
                            f.status === "deleted" ? "bg-red-400" :
                            "bg-amber-400"
                          }`} />
                          <span className="flex-1 truncate text-slate-400">{f.path}</span>
                          <span className="text-[9px] text-slate-600">{f.status === "untracked" ? "U" : f.status === "deleted" ? "D" : "M"}</span>
                          <button
                            onClick={() => stageFiles([f.path])}
                            className="opacity-0 group-hover:opacity-100 text-[10px] text-green-400 hover:text-green-300"
                            title="Stage"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recent commits */}
              {(gitStatus?.commits?.length ?? 0) > 0 && (
                <div className="border-t border-slate-700/30 mt-1">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Senaste commits</div>
                  {gitStatus!.commits.slice(0, 8).map((c: any, i: number) => (
                    <div key={i} className="px-3 py-1 text-xs hover:bg-slate-800/30">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400/70 font-mono text-[10px] shrink-0">{c.hash}</span>
                        <span className="truncate text-slate-400">{c.message}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-0.5">{c.author} · {c.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Panel */}
        {showAiPanel && (
          <div className="shrink-0 bg-[#0d1117] border-l border-slate-700/50 flex flex-col relative min-h-0" style={{ width: aiPanelWidth }}>
            <div
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-violet-500/50 active:bg-violet-500/70 transition-colors z-10"
              onMouseDown={(e) => startResize("ai", e)}
            />
            <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-slate-300">Frankenstein AI</span>
                {aiMessages.length > 0 && (
                  <span className="text-[9px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">{aiMessages.length}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {aiMessages.length > 0 && (
                  <button
                    onClick={() => setAiMessages([])}
                    className="p-0.5 hover:bg-slate-700 rounded"
                    title="Rensa chat"
                  >
                    <Eraser className="w-3 h-3 text-slate-500" />
                  </button>
                )}
                <button onClick={() => setShowAiPanel(false)} title="Stäng AI-panel">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Context chips — show what AI sees */}
            <div className="shrink-0 px-3 py-1.5 border-b border-slate-700/30 flex items-center gap-1 flex-wrap">
              <span className="text-[9px] text-slate-600 mr-1">Kontext:</span>
              {currentTab ? (
                <span className="text-[9px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <CircleDot className="w-2.5 h-2.5" /> {currentTab.name}
                </span>
              ) : (
                <span className="text-[9px] text-slate-600">Ingen fil öppen</span>
              )}
              {tabs.filter((t) => t.path !== activeTab).slice(0, 4).map((t) => (
                <span key={t.path} className="text-[9px] bg-slate-700/40 text-slate-500 px-1.5 py-0.5 rounded-full">{t.name}</span>
              ))}
              {tabs.length > 5 && <span className="text-[9px] text-slate-600">+{tabs.length - 5}</span>}
            </div>

            {/* Messages */}
            <div ref={aiRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
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
                    {msg.role === "user" ? "Du" : "🧟 Frankenstein"}
                  </div>
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <AiMarkdown
                      content={msg.content}
                      onApplyCode={async (path, code, isNew) => {
                        try {
                          if (isNew) {
                            await api("/file", { method: "POST", body: JSON.stringify({ path, content: code }) });
                          } else {
                            await api("/file", { method: "PUT", body: JSON.stringify({ path, content: code }) });
                          }
                          const existingTab = tabs.find((t) => t.path === path);
                          if (existingTab) {
                            setTabs((prev) => prev.map((t) => t.path === path ? { ...t, content: code, originalContent: code, modified: false } : t));
                          } else {
                            const name = path.split("/").pop() || path;
                            setTabs((prev) => [...prev, { path, name, language: "plaintext", content: code, originalContent: code, modified: false }]);
                            setActiveTab(path);
                          }
                          await loadTree();
                          addToast("success", `${isNew ? "Skapade" : "Uppdaterade"} ${path}`);
                        } catch (err) {
                          addToast("error", `Kunde inte spara ${path}: ${err}`);
                        }
                      }}
                      onOpenFile={(path) => openFile({ name: path.split("/").pop() || path, path, type: "file" })}
                    />
                  )}
                </div>
              ))}
              {aiLoading && !aiStreaming && (
                <div className="flex items-center gap-2 text-xs text-violet-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Frankenstein tänker...</span>
                </div>
              )}
            </div>

            {/* AI input */}
            <div className="shrink-0 border-t border-slate-700/50 p-2">
              <div className="flex items-end gap-2">
                <textarea
                  value={aiInput}
                  onChange={(e) => {
                    setAiInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendAiMessage();
                    }
                  }}
                  placeholder="Beskriv vad du vill koda... (Shift+Enter för ny rad)"
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-xs outline-none text-slate-200 placeholder:text-slate-500 focus:border-violet-500/50 resize-none overflow-hidden"
                  disabled={aiLoading}
                  rows={1}
                />
                {aiStreaming ? (
                  <button
                    onClick={stopAiStream}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    title="Stoppa streaming"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={sendAiMessage}
                    disabled={aiLoading || !aiInput.trim()}
                    className="p-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-600">
                <kbd className="px-1 py-0.5 bg-slate-800 rounded">Ctrl+K</kbd> Inline AI
                <span className="text-slate-700">|</span>
                <kbd className="px-1 py-0.5 bg-slate-800 rounded">Ctrl+I</kbd> Panel
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-0.5 bg-[#161b22] border-t border-slate-700/50 text-[10px] text-slate-500 select-none">
        <div className="flex items-center gap-2">
          {/* Git branch */}
          <button
            onClick={() => setShowGitPanel((v) => !v)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-700/50 transition-colors ${showGitPanel ? "text-orange-400" : ""}`}
            title="Git (Ctrl+G)"
          >
            <GitBranch className="w-3 h-3" />
            <span>{gitStatus?.branch || "main"}</span>
            {gitStatus && !gitStatus.clean && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <span className="text-slate-700">|</span>
          {currentTab && (
            <>
              <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
              {selectionInfo.chars > 0 && (
                <span className="text-blue-400/70">({selectionInfo.chars} tecken, {selectionInfo.lines} rad{selectionInfo.lines !== 1 ? "er" : ""})</span>
              )}
              <span className="text-slate-700">|</span>
              <span className="uppercase cursor-pointer hover:text-slate-300" onClick={() => setShowCommandPalette(true)}>{currentTab.language}</span>
              <span className="text-slate-700">|</span>
              <span>UTF-8</span>
              <span className="text-slate-700">|</span>
              <span>LF</span>
              <span className="text-slate-700">|</span>
              <span>{currentTab.content.split("\n").length} rader</span>
            </>
          )}
          {!currentTab && <span>Gracestack Editor v2.0</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-violet-400/60"><Sparkles className="w-2.5 h-2.5" /> AI</span>
          {autoSave && <span className="text-green-500/60 flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> Auto</span>}
          <span className="text-slate-700">|</span>
          <span>{tabs.length} flik{tabs.length !== 1 ? "ar" : ""}</span>
          {currentTab?.modified && <span className="text-amber-400/70">● osparad</span>}
          <span className="text-slate-700">|</span>
          <span className="cursor-pointer hover:text-slate-300" onClick={() => setShowThemePicker(true)}>{THEMES.find((t) => t.id === editorTheme)?.label || editorTheme}</span>
        </div>
      </div>
    </div>
  );
}
