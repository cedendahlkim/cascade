import { useState, useEffect, useRef, useCallback } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import {
  FolderOpen, File, ChevronRight, ChevronDown, Plus, Trash2, Save,
  X, Search, Bot, Play, Terminal, RefreshCw, Send, FileCode, FolderPlus,
  Pencil, Eye, Sparkles, Loader2, PanelLeftClose, PanelLeft,
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
}: {
  nodes: FileNode[];
  onSelect: (node: FileNode) => void;
  selectedPath: string;
  onRefresh: () => void;
  onNewFile: () => void;
  onNewDir: () => void;
  onDelete: (path: string) => void;
}) {
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
      <div className="flex-1 overflow-y-auto text-sm">
        {nodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            onSelect={onSelect}
            selectedPath={selectedPath}
            onDelete={onDelete}
          />
        ))}
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
        className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-slate-700/50 ${
          isSelected ? "bg-blue-500/20 text-blue-300" : "text-slate-300"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {isDir ? (
          expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        ) : (
          <span className="w-3.5" />
        )}
        {isDir ? (
          <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        )}
        <span className="truncate text-xs">{node.name}</span>
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

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Terminal
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState("");
  const terminalRef = useRef<HTMLDivElement>(null);

  // AI
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);

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

  // ── Editor change ──
  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.path === activeTab
          ? { ...t, content: value, modified: value !== t.originalContent }
          : t
      )
    );
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

  // ── Terminal ──
  const runCommand = async () => {
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalInput("");
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

  // ── AI Chat ──
  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const msg = aiInput.trim();
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", content: msg, timestamp: Date.now() }]);
    setAiLoading(true);

    try {
      const currentTab = tabs.find((t) => t.path === activeTab);

      // Determine action based on message
      let response: any;
      if (msg.toLowerCase().startsWith("/edit ") && currentTab) {
        const instruction = msg.slice(6);
        response = await api("/ai/edit", {
          method: "POST",
          body: JSON.stringify({ path: currentTab.path, instruction }),
        });
        setDiffContent({ original: response.original, modified: response.modified });
        setShowDiff(true);
        setAiMessages((prev) => [
          ...prev,
          { role: "ai", content: `Föreslagna ändringar i ${currentTab.name}. Granska diff-vyn och klicka "Acceptera" för att applicera.`, timestamp: Date.now() },
        ]);
      } else if (msg.toLowerCase().startsWith("/generate ")) {
        const parts = msg.slice(10).split(" ", 1);
        const path = parts[0];
        const instruction = msg.slice(10 + path.length + 1);
        response = await api("/ai/generate", {
          method: "POST",
          body: JSON.stringify({ path, instruction }),
        });
        setAiMessages((prev) => [
          ...prev,
          { role: "ai", content: `Genererade ${path}. Öppna filen för att se resultatet.`, timestamp: Date.now() },
        ]);
        // Auto-save and open
        await api("/file", { method: "PUT", body: JSON.stringify({ path, content: response.content }) });
        await loadTree();
      } else if (msg.toLowerCase().startsWith("/run ")) {
        const cmd = msg.slice(5);
        response = await api("/ai/terminal", {
          method: "POST",
          body: JSON.stringify({ command: cmd }),
        });
        const output = [response.stdout, response.stderr].filter(Boolean).join("\n") || "(ingen output)";
        setAiMessages((prev) => [
          ...prev,
          { role: "ai", content: `\`\`\`\n$ ${cmd}\n${output}\n[exit: ${response.exitCode}]\n\`\`\``, timestamp: Date.now() },
        ]);
      } else if (msg.toLowerCase().startsWith("/explain") && currentTab) {
        response = await api("/ai/explain", {
          method: "POST",
          body: JSON.stringify({ path: currentTab.path }),
        });
        setAiMessages((prev) => [
          ...prev,
          { role: "ai", content: response.explanation, timestamp: Date.now() },
        ]);
      } else {
        // General AI chat about current file
        const context = currentTab
          ? `Aktuell fil: ${currentTab.path}\n\`\`\`${currentTab.language}\n${currentTab.content.slice(0, 3000)}\n\`\`\``
          : "Ingen fil öppen.";

        const apiKey = ""; // Will use server-side
        response = await api("/ai/explain", {
          method: "POST",
          body: JSON.stringify({
            path: currentTab?.path || ".",
            selection: `Användaren frågar: ${msg}\n\nKontext:\n${context}`,
          }),
        });
        setAiMessages((prev) => [
          ...prev,
          { role: "ai", content: response.explanation, timestamp: Date.now() },
        ]);
      }
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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, tabs]);

  const currentTab = tabs.find((t) => t.path === activeTab);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-200">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-500/20 border-b border-red-500/30 text-red-300 text-sm">
          <span>{error}</span>
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-b border-slate-700/50">
        <button
          onClick={() => setShowSidebar((v) => !v)}
          className="p-1.5 hover:bg-slate-700 rounded"
          title="Filträd"
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
        <div className="flex-1" />
        <span className="text-xs text-slate-500">
          {currentTab ? currentTab.path : "Ingen fil öppen"}
        </span>
        {currentTab?.modified && (
          <button
            onClick={() => saveFile(activeTab)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
          >
            <Save className="w-3 h-3" /> Spara
          </button>
        )}
      </div>

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
            />
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="flex bg-[#161b22] border-b border-slate-700/50 overflow-x-auto">
              {tabs.map((tab) => (
                <div
                  key={tab.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-slate-700/30 shrink-0 ${
                    tab.path === activeTab
                      ? "bg-[#0d1117] text-slate-200 border-b-2 border-b-blue-500"
                      : "text-slate-400 hover:bg-slate-800"
                  }`}
                  onClick={() => setActiveTab(tab.path)}
                >
                  <FileCode className="w-3 h-3" />
                  <span>{tab.name}</span>
                  {tab.modified && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                    className="ml-1 hover:bg-slate-600 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
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
                theme="vs-dark"
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  wordWrap: "on",
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 8 },
                }}
              />
            )}

            {!loading && !currentTab && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                <FileCode className="w-16 h-16 text-slate-600" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-400">Gracestack Editor</p>
                  <p className="text-sm mt-1">Välj en fil i filträdet eller använd Ctrl+P för att söka</p>
                  <div className="flex flex-col gap-1 mt-4 text-xs text-slate-600">
                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Ctrl+S</kbd> Spara</span>
                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Ctrl+P</kbd> Sök i filer</span>
                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Ctrl+`</kbd> Terminal</span>
                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Ctrl+I</kbd> Frankenstein AI</span>
                  </div>
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
                  onKeyDown={(e) => e.key === "Enter" && runCommand()}
                  placeholder="Skriv kommando..."
                  className="flex-1 bg-transparent text-xs font-mono outline-none text-slate-200 placeholder:text-slate-600"
                />
                <button onClick={runCommand} className="p-1 hover:bg-slate-700 rounded">
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

            {/* AI commands help */}
            <div className="px-3 py-2 border-b border-slate-700/30 text-[10px] text-slate-500 space-y-0.5">
              <div><code>/edit</code> — redigera aktuell fil</div>
              <div><code>/generate path</code> — generera ny fil</div>
              <div><code>/run cmd</code> — kör terminalkommando</div>
              <div><code>/explain</code> — förklara aktuell fil</div>
              <div>Eller skriv fritt för att chatta om koden</div>
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
                  placeholder="Fråga Frankenstein..."
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
    </div>
  );
}
