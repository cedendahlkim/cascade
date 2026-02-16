import { useState, useEffect } from "react";
import { Clipboard, Copy, Download, Trash2, RefreshCw, Monitor, Smartphone } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface ClipboardEntry {
  id: number;
  content: string;
  type: "text" | "image";
  source: "mobile" | "desktop";
  timestamp: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ClipboardView() {
  const [history, setHistory] = useState<ClipboardEntry[]>([]);
  const [input, setInput] = useState("");
  const [desktopClip, setDesktopClip] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const fetchHistory = () => {
    fetch(`${BRIDGE_URL}/api/clipboard`).then(r => r.json()).then(setHistory).catch(() => {});
  };

  const fetchDesktop = () => {
    fetch(`${BRIDGE_URL}/api/clipboard/desktop`).then(r => r.json()).then(d => setDesktopClip(d.content)).catch(() => {});
  };

  useEffect(() => {
    fetchHistory();
    fetchDesktop();
    const interval = setInterval(() => { fetchHistory(); fetchDesktop(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendToDesktop = async () => {
    if (!input.trim()) return;
    await fetch(`${BRIDGE_URL}/api/clipboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input, type: "text", source: "mobile" }),
    });
    setInput("");
    fetchHistory();
  };

  const pullFromDesktop = async () => {
    const res = await fetch(`${BRIDGE_URL}/api/clipboard/from-desktop`, { method: "POST" });
    const data = await res.json();
    if (data.content) {
      fetchHistory();
      fetchDesktop();
    }
  };

  const copyToLocal = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const clearHistory = async () => {
    await fetch(`${BRIDGE_URL}/api/clipboard`, { method: "DELETE" });
    setHistory([]);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Urklipp</h2>
          <p className="text-[10px] text-slate-500">Synka urklipp mellan mobil och dator</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fetchHistory(); fetchDesktop(); }} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Uppdatera">
            <RefreshCw className="w-4 h-4" />
          </button>
          {history.length > 0 && (
            <button onClick={clearHistory} className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:text-red-400 transition-colors" title="Rensa historik">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop clipboard */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-slate-300">Datorns urklipp</span>
          <button onClick={pullFromDesktop} className="ml-auto text-[10px] text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg bg-blue-950/30 border border-blue-800/30" title="Hämta från dator">
            Hämta
          </button>
        </div>
        {desktopClip ? (
          <div className="flex items-start gap-2">
            <p className="text-xs text-slate-400 flex-1 font-mono bg-slate-900/60 rounded-lg p-2 max-h-20 overflow-y-auto whitespace-pre-wrap break-all">
              {desktopClip.slice(0, 500)}{desktopClip.length > 500 ? "..." : ""}
            </p>
            <button onClick={() => copyToLocal(desktopClip, -1)} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors shrink-0" title="Kopiera lokalt">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-slate-600 italic">Tomt eller kunde inte läsas</p>
        )}
      </div>

      {/* Send to desktop */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-4 h-4 text-green-400" />
          <span className="text-xs font-medium text-slate-300">Skicka till dator</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendToDesktop(); }}
            placeholder="Text att kopiera till datorn..."
            className="flex-1 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm border border-slate-700 focus:outline-none focus:border-green-500 placeholder:text-slate-500"
          />
          <button onClick={sendToDesktop} disabled={!input.trim()}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
            Skicka
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Historik</h3>
          <div className="space-y-1.5">
            {history.map(entry => (
              <div key={entry.id} className="flex items-start gap-2 bg-slate-800/40 border border-slate-700/30 rounded-xl px-3 py-2">
                {entry.source === "mobile" ? (
                  <Smartphone className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <Monitor className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 font-mono break-all line-clamp-3">{entry.content}</p>
                  <span className="text-[10px] text-slate-600">{formatTime(entry.timestamp)}</span>
                </div>
                <button
                  onClick={() => copyToLocal(entry.content, entry.id)}
                  className={`p-1.5 rounded-lg shrink-0 transition-colors ${copied === entry.id ? "text-green-400" : "text-slate-500 hover:text-white"}`}
                  title="Kopiera"
                >
                  {copied === entry.id ? <span className="text-[10px]">✓</span> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <div className="text-center py-8">
          <Clipboard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Ingen urklippshistorik</p>
          <p className="text-xs text-slate-600">Skicka text härifrån eller hämta från datorn</p>
        </div>
      )}
    </div>
  );
}
