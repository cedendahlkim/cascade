import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRIDGE_URL } from "../config";
import { io, Socket } from "socket.io-client";
import { Play, Square, RefreshCw, Brain, Activity, DollarSign, AlertTriangle, Loader2 } from "lucide-react";

type TraderStatus = {
  running: boolean;
  pid: number | null;
  started_at: string | null;
  last_update: number;
};

type TraderLive = {
  active: boolean;
  events: any[];
  last_update: number;
  event_count: number;
};

type TraderState = {
  running?: boolean;
  last_tick_at?: string;
  symbols?: string[];
  paper_mode?: boolean;
  risk_per_trade?: number;
  min_confidence?: number;
  portfolio?: {
    usdt_cash: number;
    positions: Record<string, { quantity: number; value_usd: number }>;
    total_value_usd: number;
  };
  recent_signals?: Array<{ symbol: string; action: string; confidence: number; quantity: number; price: number; timestamp: string; pattern?: string; pattern_similarity?: number }>;
};

export default function TradingView() {
  const [status, setStatus] = useState<TraderStatus | null>(null);
  const [live, setLive] = useState<TraderLive | null>(null);
  const [state, setState] = useState<TraderState | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<"start" | "stop" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [symbols, setSymbols] = useState("BTCUSDT,ETHUSDT");
  const [paperMode, setPaperMode] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(3600);
  const [riskPerTrade, setRiskPerTrade] = useState(0.02);
  const [minConfidence, setMinConfidence] = useState(0.6);

  const socketRef = useRef<Socket | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, lRes, stRes, logRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/trader/status`),
        fetch(`${BRIDGE_URL}/api/trader/live`),
        fetch(`${BRIDGE_URL}/api/trader/state`),
        fetch(`${BRIDGE_URL}/api/trader/log`),
      ]);

      if (sRes.ok) setStatus(await sRes.json());
      if (lRes.ok) setLive(await lRes.json());
      if (stRes.ok) {
        const st = await stRes.json();
        setState(st);
        if (Array.isArray(st?.symbols) && st.symbols.length > 0) setSymbols(st.symbols.join(","));
        if (typeof st?.paper_mode === "boolean") setPaperMode(st.paper_mode);
        if (typeof st?.risk_per_trade === "number") setRiskPerTrade(st.risk_per_trade);
        if (typeof st?.min_confidence === "number") setMinConfidence(st.min_confidence);
      }
      if (logRes.ok) {
        const data = await logRes.json();
        setLogLines(data.lines || []);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    const socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("trader_event", (ev: any) => {
      setLive((prev) => {
        const base: TraderLive = prev || { active: true, events: [], last_update: Date.now(), event_count: 0 };
        const nextEvents = [...base.events, ev].slice(-50);
        return { ...base, active: true, events: nextEvents, last_update: Date.now(), event_count: base.event_count + 1 };
      });
    });
    return () => { socket.disconnect(); };
  }, []);

  const startTrader = async () => {
    setActionBusy("start");
    setError(null);
    try {
      const payload = {
        symbols: symbols.split(",").map(s => s.trim()).filter(Boolean),
        paperMode,
        intervalSeconds,
        riskPerTrade,
        minConfidence,
      };
      const res = await fetch(`${BRIDGE_URL}/api/trader/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      await fetchAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setActionBusy(null);
    }
  };

  const stopTrader = async () => {
    setActionBusy("stop");
    setError(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/trader/stop`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      await fetchAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setActionBusy(null);
    }
  };

  const running = !!status?.running;
  const totalUsd = state?.portfolio?.total_value_usd ?? 0;
  const usdtCash = state?.portfolio?.usdt_cash ?? 0;
  const positions = state?.portfolio?.positions ?? {};

  const recentSignals = useMemo(() => {
    const list = state?.recent_signals || [];
    return [...list].slice(-10).reverse();
  }, [state?.recent_signals]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Trading Bot</h2>
          {running ? (
            <span className="text-[10px] bg-green-900/60 text-green-300 px-2 py-0.5 rounded-full border border-green-700/50">Kör</span>
          ) : (
            <span className="text-[10px] bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/50">Stoppad</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {running ? (
            <button
              onClick={stopTrader}
              disabled={actionBusy !== null}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-900/50 hover:bg-red-900/70 text-red-200 rounded-lg text-[11px] font-medium disabled:opacity-50"
            >
              {actionBusy === "stop" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
              Stoppa
            </button>
          ) : (
            <button
              onClick={startTrader}
              disabled={actionBusy !== null}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-900/50 hover:bg-emerald-900/70 text-emerald-200 rounded-lg text-[11px] font-medium disabled:opacity-50"
            >
              {actionBusy === "start" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Starta
            </button>
          )}
          <button
            onClick={fetchAll}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Uppdatera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] text-red-300 bg-red-950/30 border border-red-800/40 rounded-xl px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="break-all">{error}</span>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Konfiguration</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-slate-300">
            Symbols
            <input
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
              placeholder="BTCUSDT,ETHUSDT"
            />
          </label>
          <label className="text-[11px] text-slate-300">
            Interval (s)
            <input
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(Number(e.target.value))}
              type="number"
              min={5}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>
          <label className="text-[11px] text-slate-300">
            Risk per trade
            <input
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(Number(e.target.value))}
              type="number"
              step={0.001}
              min={0}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>
          <label className="text-[11px] text-slate-300">
            Min confidence
            <input
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              type="number"
              step={0.01}
              min={0}
              max={1}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={paperMode} onChange={(e) => setPaperMode(e.target.checked)} />
          Paper mode (recommended)
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <DollarSign className="w-3.5 h-3.5" /> Total
          </div>
          <div className="text-lg font-bold text-white">${totalUsd.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Cash: ${usdtCash.toLocaleString()}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <Activity className="w-3.5 h-3.5" /> Events
          </div>
          <div className="text-lg font-bold text-white">{live?.event_count ?? 0}</div>
          <div className="text-[10px] text-slate-500">Live: {live?.active ? "yes" : "no"}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Positions</div>
          <div className="text-lg font-bold text-white">{Object.keys(positions).length}</div>
          <div className="text-[10px] text-slate-500">Last tick: {state?.last_tick_at || "—"}</div>
        </div>
      </div>

      {Object.keys(positions).length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Portfolio</div>
          <div className="space-y-1">
            {Object.entries(positions).map(([sym, p]) => (
              <div key={sym} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">{sym}</span>
                <span className="text-slate-400">qty {p.quantity}</span>
                <span className="text-white">${p.value_usd}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentSignals.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Recent signals</div>
          <div className="space-y-1">
            {recentSignals.map((s, idx) => (
              <div key={idx} className="text-[11px] flex items-center gap-2">
                <span className="text-slate-500 font-mono">{new Date(s.timestamp).toLocaleTimeString("sv-SE")}</span>
                <span className="text-slate-300 font-medium">{s.symbol}</span>
                <span className={s.action === "BUY" ? "text-green-400" : s.action === "SELL" ? "text-red-400" : "text-slate-400"}>{s.action}</span>
                <span className="text-slate-500">conf {Math.round(s.confidence * 100)}%</span>
                <span className="text-slate-600">{s.pattern ? `${s.pattern} (${(s.pattern_similarity || 0).toFixed(2)})` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {logLines.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Log</div>
          <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap max-h-72 overflow-auto">
            {logLines.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
