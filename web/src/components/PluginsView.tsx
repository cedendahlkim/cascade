import { useState, useEffect, useCallback } from "react";
import { Puzzle, ToggleLeft, ToggleRight, RefreshCw, Download, Trash2, Star, Search, ExternalLink, Shield, ShieldCheck, Store, Link2 } from "lucide-react";
import { BRIDGE_URL } from "../config";

// --- Types ---

interface PluginEntry {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  toolCount: number;
  loadedAt: string;
  error: string | null;
}

interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  downloadUrl: string;
  homepage?: string;
  rating: number;
  ratingCount: number;
  downloads: number;
  verified: boolean;
  installed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MarketplaceCategory {
  id: string;
  label: string;
  emoji: string;
  count: number;
}

interface MarketplaceStats {
  totalAvailable: number;
  installed: number;
  categories: number;
  verified: number;
}

// --- Helpers ---

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${i <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`}
          style={{ width: size, height: size }}
        />
      ))}
    </span>
  );
}

// --- Main Component ---

export default function PluginsView() {
  const [tab, setTab] = useState<"installed" | "marketplace">("marketplace");
  const [plugins, setPlugins] = useState<PluginEntry[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplacePlugin[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [installing, setInstalling] = useState<string | null>(null);
  const [urlInstall, setUrlInstall] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customId, setCustomId] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const fetchPlugins = useCallback(() => {
    fetch(`${BRIDGE_URL}/api/plugins`).then(r => r.json()).then(setPlugins).catch(() => {});
  }, []);

  const fetchMarketplace = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    params.set("sort", "popular");
    fetch(`${BRIDGE_URL}/api/marketplace?${params}`).then(r => r.json()).then(setMarketplace).catch(() => {});
  }, [selectedCategory, searchQuery]);

  const fetchCategories = useCallback(() => {
    fetch(`${BRIDGE_URL}/api/marketplace/categories`).then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const fetchStats = useCallback(() => {
    fetch(`${BRIDGE_URL}/api/marketplace/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => { fetchPlugins(); fetchCategories(); fetchStats(); }, []);
  useEffect(() => { fetchMarketplace(); }, [selectedCategory, searchQuery]);

  const togglePlugin = async (id: string, enabled: boolean) => {
    await fetch(`${BRIDGE_URL}/api/plugins/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    fetchPlugins();
  };

  const installPlugin = async (id: string) => {
    setInstalling(id);
    setFeedback(null);
    try {
      const resp = await fetch(`${BRIDGE_URL}/api/marketplace/install/${id}`, { method: "POST" });
      const data = await resp.json();
      if (data.ok) {
        setFeedback({ type: "ok", text: `Installerad! Starta om servern för att aktivera.` });
        fetchMarketplace();
        fetchStats();
        fetchPlugins();
      } else {
        setFeedback({ type: "error", text: data.error || "Installationen misslyckades" });
      }
    } catch {
      setFeedback({ type: "error", text: "Nätverksfel" });
    }
    setInstalling(null);
  };

  const uninstallPlugin = async (id: string) => {
    setFeedback(null);
    try {
      const resp = await fetch(`${BRIDGE_URL}/api/marketplace/uninstall/${id}`, { method: "POST" });
      const data = await resp.json();
      if (data.ok) {
        setFeedback({ type: "ok", text: "Avinstallerad. Starta om servern." });
        fetchMarketplace();
        fetchStats();
        fetchPlugins();
      } else {
        setFeedback({ type: "error", text: data.error || "Avinstallation misslyckades" });
      }
    } catch {
      setFeedback({ type: "error", text: "Nätverksfel" });
    }
  };

  const installFromUrl = async () => {
    if (!customUrl) return;
    setInstalling("url");
    setFeedback(null);
    try {
      const resp = await fetch(`${BRIDGE_URL}/api/marketplace/install-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: customUrl, id: customId || undefined }),
      });
      const data = await resp.json();
      if (data.ok) {
        setFeedback({ type: "ok", text: `Installerad från URL! Starta om servern.` });
        setCustomUrl("");
        setCustomId("");
        setUrlInstall(false);
        fetchPlugins();
        fetchStats();
      } else {
        setFeedback({ type: "error", text: data.error || "Installationen misslyckades" });
      }
    } catch {
      setFeedback({ type: "error", text: "Nätverksfel" });
    }
    setInstalling(null);
  };

  const ratePlugin = async (id: string, rating: number) => {
    await fetch(`${BRIDGE_URL}/api/marketplace/rate/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    fetchMarketplace();
  };

  const enabledCount = plugins.filter(p => p.enabled).length;
  const totalTools = plugins.filter(p => p.enabled).reduce((sum, p) => sum + p.toolCount, 0);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Plugins</h2>
          <p className="text-[10px] text-slate-500">
            {enabledCount} aktiva · {totalTools} verktyg
            {stats && ` · ${stats.totalAvailable} i marketplace`}
          </p>
        </div>
        <button onClick={() => { fetchPlugins(); fetchMarketplace(); fetchStats(); }} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Uppdatera">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/60 rounded-lg p-0.5">
        <button
          onClick={() => setTab("marketplace")}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            tab === "marketplace" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Marketplace
        </button>
        <button
          onClick={() => setTab("installed")}
          className={`flex-1 text-xs py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
            tab === "installed" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          <Puzzle className="w-3.5 h-3.5" />
          Installerade ({plugins.length})
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${
          feedback.type === "ok"
            ? "border-emerald-700/50 bg-emerald-950/30 text-emerald-300"
            : "border-red-700/50 bg-red-950/30 text-red-300"
        }`}>
          {feedback.type === "ok" ? "✅" : "❌"} {feedback.text}
        </div>
      )}

      {/* Marketplace Tab */}
      {tab === "marketplace" && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Sök plugins..."
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-600/50"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                !selectedCategory
                  ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                  : "border-slate-700/50 text-slate-400 hover:text-white"
              }`}
            >
              Alla
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                  cat.id === selectedCategory
                    ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                    : "border-slate-700/50 text-slate-400 hover:text-white"
                }`}
              >
                {cat.emoji} {cat.label} ({cat.count})
              </button>
            ))}
          </div>

          {/* Plugin Grid */}
          <div className="space-y-2">
            {marketplace.map(p => (
              <div key={p.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white">{p.name}</span>
                      <span className="text-[10px] text-slate-500">v{p.version}</span>
                      {p.verified && (
                        <span title="Verifierad"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /></span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {p.installed ? (
                      <button
                        onClick={() => uninstallPlugin(p.id)}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-700/40 text-red-300 hover:bg-red-900/40 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Avinstallera
                      </button>
                    ) : (
                      <button
                        onClick={() => installPlugin(p.id)}
                        disabled={installing === p.id}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/40 text-blue-300 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" />
                        {installing === p.id ? "Installerar..." : "Installera"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <StarRating rating={p.rating} size={10} />
                    <span>{p.rating}</span>
                    <span className="text-slate-600">({p.ratingCount})</span>
                  </span>
                  <span>{p.downloads} nedladdningar</span>
                  <span>av {p.author}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {p.tags.slice(0, 3).map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">{t}</span>
                    ))}
                  </div>
                </div>
                {/* Quick rate */}
                {p.installed && (
                  <div className="mt-2 flex items-center gap-2 border-t border-slate-700/30 pt-2">
                    <span className="text-[10px] text-slate-500">Betygsätt:</span>
                    {[1, 2, 3, 4, 5].map(r => (
                      <button
                        key={r}
                        onClick={() => ratePlugin(p.id, r)}
                        className="hover:scale-125 transition-transform"
                        title={`${r} stjärnor`}
                      >
                        <Star className="w-3.5 h-3.5 text-yellow-400 hover:fill-yellow-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {marketplace.length === 0 && (
              <div className="text-center py-8">
                <Store className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Inga plugins hittades</p>
              </div>
            )}
          </div>

          {/* Install from URL */}
          <div className="border border-slate-700/40 rounded-xl overflow-hidden">
            <button
              onClick={() => setUrlInstall(!urlInstall)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              Installera från URL
              <span className="ml-auto text-slate-600">{urlInstall ? "▲" : "▼"}</span>
            </button>
            {urlInstall && (
              <div className="px-3 pb-3 space-y-2 border-t border-slate-700/30">
                <input
                  type="text"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/.../plugin.ts"
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-600/50 mt-2"
                />
                <input
                  type="text"
                  value={customId}
                  onChange={e => setCustomId(e.target.value)}
                  placeholder="Plugin-ID (valfritt, t.ex. 'my-plugin')"
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-600/50"
                />
                <button
                  onClick={installFromUrl}
                  disabled={!customUrl || installing === "url"}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/40 text-blue-300 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {installing === "url" ? "Installerar..." : "Installera från URL"}
                </button>
                <div className="flex items-start gap-1.5 text-[10px] text-slate-500">
                  <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Externa plugins sandboxas automatiskt. Farliga API:er (fs, child_process, eval) blockeras.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Installed Tab */}
      {tab === "installed" && (
        <div className="space-y-3">
          {plugins.length === 0 ? (
            <div className="text-center py-12">
              <Puzzle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 mb-2">Inga plugins laddade</p>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Installera plugins från Marketplace eller lägg till <code className="text-blue-400 bg-slate-800 px-1 rounded">.ts</code>-filer i <code className="text-blue-400 bg-slate-800 px-1 rounded">bridge/plugins/</code>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {plugins.map(p => (
                <div key={p.id} className={`bg-slate-800/60 border rounded-xl p-3 ${p.enabled ? "border-slate-700/50" : "border-slate-800/30 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Puzzle className={`w-4 h-4 ${p.enabled ? "text-blue-400" : "text-slate-600"}`} />
                      <span className="text-sm font-medium text-white">{p.name}</span>
                      <span className="text-[10px] text-slate-500">v{p.version}</span>
                    </div>
                    <button onClick={() => togglePlugin(p.id, !p.enabled)}
                      className={`${p.enabled ? "text-green-400" : "text-slate-600"}`}
                      title={p.enabled ? "Inaktivera" : "Aktivera"}>
                      {p.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </div>
                  {p.description && <p className="text-[10px] text-slate-500 mb-1">{p.description}</p>}
                  <div className="flex items-center gap-3 text-[10px] text-slate-600">
                    <span>{p.toolCount} verktyg</span>
                    {p.author && <span>av {p.author}</span>}
                    <span className="ml-auto">{formatTime(p.loadedAt)}</span>
                  </div>
                  {p.error && (
                    <div className="mt-1 text-[10px] text-red-400 bg-red-950/30 rounded-lg px-2 py-1">
                      ⚠ {p.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Skapa plugin</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Exportera ett objekt med <code className="text-blue-400">name</code>, <code className="text-blue-400">version</code>, <code className="text-blue-400">tools[]</code> från en <code className="text-blue-400">.ts</code>-fil i <code className="text-blue-400">bridge/plugins/</code>.
              Varje tool har <code className="text-blue-400">name</code>, <code className="text-blue-400">description</code>, <code className="text-blue-400">parameters</code> och <code className="text-blue-400">handler(input)</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
