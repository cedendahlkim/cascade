import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Download, BarChart3, Brain, Zap, Swords, Copy, Clock, MessageCircle } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface SearchResult {
  message: {
    id: string;
    role: string;
    content: string;
    timestamp: string;
    source: "claude" | "gemini" | "arena";
  };
  score: number;
  highlights: string[];
}

interface ConvStats {
  claude: number;
  gemini: number;
  arena: number;
  total: number;
  dateRange: { from: string | null; to: string | null };
}

const SOURCE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  claude: { icon: <Brain className="w-3 h-3 text-blue-400" />, color: "text-blue-400", bg: "bg-blue-900/30 border-blue-800/30" },
  gemini: { icon: <Zap className="w-3 h-3 text-violet-400" />, color: "text-violet-400", bg: "bg-violet-900/30 border-violet-800/30" },
  arena: { icon: <Swords className="w-3 h-3 text-amber-400" />, color: "text-amber-400", bg: "bg-amber-900/30 border-amber-800/30" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`(${escaped})`, "gi"), '<mark class="bg-amber-500/30 text-amber-200 rounded px-0.5">$1</mark>');
}

export default function SearchView() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<ConvStats | null>(null);
  const [searching, setSearching] = useState(false);
  const [source, setSource] = useState("all");
  const [showStats, setShowStats] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) { setResults([]); setSearched(false); return; }
    setSearching(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: searchQuery, source, limit: "30" });
      const res = await fetch(`${BRIDGE_URL}/api/search?${params}`);
      setResults(await res.json());
    } catch { /* ignore */ }
    setSearching(false);
  }, [query, source]);

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(query), 400);
    } else if (query.trim().length === 0) {
      setResults([]);
      setSearched(false);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, source]);

  const loadStats = async () => {
    setShowStats(!showStats);
    if (!stats) {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/search/stats`);
        setStats(await res.json());
      } catch { /* ignore */ }
    }
  };

  const exportConv = (fmt: "markdown" | "json") => {
    window.open(`${BRIDGE_URL}/api/search/export?source=${source}&format=${fmt}`, "_blank");
  };

  const copyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Sök i konversationer</h2>
        <div className="flex gap-2">
          <button onClick={loadStats} className={`p-2 rounded-lg transition-colors ${showStats ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`} title="Statistik">
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
            placeholder="Sök meddelanden... (live-sök)"
            className="w-full bg-slate-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm border border-slate-700 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="flex gap-1">
          {(["all", "claude", "gemini", "arena"] as const).map(s => (
            <button key={s} onClick={() => setSource(s)}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${source === s ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>
              {s !== "all" && SOURCE_CONFIG[s]?.icon}
              {s === "all" ? "Alla" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {showStats && stats && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statistik</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Totalt", value: stats.total, icon: MessageCircle, color: "text-slate-300" },
              { label: "Claude", value: stats.claude, icon: Brain, color: "text-blue-400" },
              { label: "Gemini", value: stats.gemini, icon: Zap, color: "text-violet-400" },
              { label: "Arena", value: stats.arena, icon: Swords, color: "text-amber-400" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <Icon className={`w-3.5 h-3.5 ${s.color} mx-auto mb-0.5`} />
                  <div className="text-sm font-semibold text-white">{s.value}</div>
                  <div className="text-[10px] text-slate-500">{s.label}</div>
                </div>
              );
            })}
          </div>
          {stats.dateRange.from && (
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600">
              <Clock className="w-3 h-3" />
              {formatTime(stats.dateRange.from)} — {stats.dateRange.to ? formatTime(stats.dateRange.to) : "nu"}
            </div>
          )}
          <div className="flex gap-2 justify-center">
            <button onClick={() => exportConv("markdown")} className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 px-2.5 py-1.5 rounded-lg bg-blue-950/30 border border-blue-800/30 transition-colors">
              <Download className="w-3 h-3" /> Markdown
            </button>
            <button onClick={() => exportConv("json")} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-300 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/30 transition-colors">
              <Download className="w-3 h-3" /> JSON
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {searched && results.length === 0 && !searching && (
        <div className="text-center py-8">
          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Inga resultat för &ldquo;{query}&rdquo;</p>
          <p className="text-[10px] text-slate-600 mt-1">Prova ett annat sökord eller ändra filter</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500">{results.length} resultat {searching && "· söker..."}</p>
          {results.map((r, i) => {
            const cfg = SOURCE_CONFIG[r.message.source];
            return (
              <div key={i} className={`border rounded-xl px-3 py-2.5 transition-colors hover:border-slate-600/50 ${cfg?.bg || "bg-slate-800/60 border-slate-700/50"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {cfg?.icon}
                  <span className={`text-[10px] font-medium ${cfg?.color || "text-slate-400"}`}>
                    {r.message.source}
                  </span>
                  <span className="text-[10px] text-slate-600">· {r.message.role}</span>
                  <span className="text-[10px] text-slate-600 ml-auto">{formatTime(r.message.timestamp)}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${r.score > 0.7 ? "bg-emerald-900/40 text-emerald-400" : r.score > 0.4 ? "bg-amber-900/40 text-amber-400" : "bg-slate-700/40 text-slate-400"}`}>
                      {(r.score * 100).toFixed(0)}%
                    </span>
                    <button
                      onClick={() => copyContent(r.message.content, r.message.id)}
                      className="p-0.5 rounded text-slate-600 hover:text-slate-300 transition-colors"
                      title="Kopiera"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {r.highlights.map((h, j) => (
                  <p key={j} className="text-xs text-slate-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: highlightText(h, query) }} />
                ))}
                {copied === r.message.id && (
                  <span className="text-[10px] text-emerald-400 mt-1 block">Kopierat!</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state with suggestions */}
      {!searched && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">Sök i alla konversationer</p>
          <p className="text-xs text-slate-600 mb-4">Claude, Gemini och Arena — live-sök med markering</p>
          <div className="flex flex-wrap gap-2 justify-center max-w-xs mx-auto">
            {["projekt", "bugg", "API", "databas", "deploy"].map(s => (
              <button key={s} onClick={() => { setQuery(s); }}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
