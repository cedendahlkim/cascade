import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRIDGE_URL } from "../config";
import { io, Socket } from "socket.io-client";
import { Play, Square, RefreshCw, Brain, Activity, DollarSign, AlertTriangle, Loader2, MessageSquareText, LineChart, Pause, Trash2, TrendingUp } from "lucide-react";

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

type FrankMessage = {
  id: string;
  role: "user" | "cascade";
  content: string;
  type: string;
  timestamp: string;
};

type TraderState = {
  running?: boolean;
  last_tick_at?: string;
  tick_count?: number;
  order_count?: number;
  exchange?: string;
  symbols?: string[];
  paper_mode?: boolean;
  risk_per_trade?: number;
  min_confidence?: number;
  portfolio?: {
    usdt_cash: number;
    positions: Record<string, {
      quantity: number;
      value_usd: number;
      avg_entry?: number;
      price?: number;
      unrealized_usdt?: number;
      unrealized_pct?: number;
      realized_usdt?: number;
    }>;
    total_value_usd: number;
  };
  recent_signals?: Array<{ symbol: string; action: string; confidence: number; quantity: number; price: number; timestamp: string; pattern?: string; pattern_similarity?: number; details?: any }>;
};

type TraderTradesResponse = {
  trades: any[];
  line_count: number;
};

type TradingExchange = "kraken" | "binance";

type EquityPoint = {
  t: number;
  total: number;
  cash: number;
  invested: number;
};

type SignalPoint = {
  t: number;
  symbol: string;
  action: string;
  conf: number;
  price: number;
};

type ChartLine = { id: string; color: string; data: Array<{ t: number; y: number }> };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function downsample<T>(data: T[], maxPoints: number): T[] {
  if (maxPoints <= 0 || data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  const out: T[] = [];
  for (let i = 0; i < data.length; i += step) out.push(data[i]);
  const last = data[data.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

function fmtUsd(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toFixed(2)}`;
}

function MiniTimeSeriesChart(
  { lines, height = 96, maxPoints = 260 }: { lines: ChartLine[]; height?: number; maxPoints?: number },
) {
  const decimated = useMemo(
    () => lines.map((l) => ({ ...l, data: downsample(l.data, maxPoints) })),
    [lines, maxPoints],
  );

  let anyPoints = 0;
  for (const l of decimated) anyPoints += l.data.length;

  if (anyPoints < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-[11px] text-slate-500">
        Väntar på data…
      </div>
    );
  }

  let tMin = Infinity;
  let tMax = -Infinity;
  let yMinRaw = Infinity;
  let yMaxRaw = -Infinity;
  for (const l of decimated) {
    for (const p of l.data) {
      if (p.t < tMin) tMin = p.t;
      if (p.t > tMax) tMax = p.t;
      if (p.y < yMinRaw) yMinRaw = p.y;
      if (p.y > yMaxRaw) yMaxRaw = p.y;
    }
  }

  if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || !Number.isFinite(yMinRaw) || !Number.isFinite(yMaxRaw)) {
    return (
      <div className="h-24 flex items-center justify-center text-[11px] text-slate-500">
        Väntar på data…
      </div>
    );
  }

  const pad = (yMaxRaw - yMinRaw) * 0.08;
  const yMin = yMinRaw - pad;
  const yMax = yMaxRaw + pad;

  const toX = (t: number) => {
    if (tMax === tMin) return 0;
    return ((t - tMin) / (tMax - tMin)) * 100;
  };
  const toY = (y: number) => {
    if (yMax === yMin) return 50;
    const v = (y - yMin) / (yMax - yMin);
    return 60 - v * 60;
  };

  return (
    <div className="w-full">
      <svg viewBox="0 0 100 60" width="100%" height={height} preserveAspectRatio="none" className="block">
        {/* grid */}
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={0} x2={100} y1={(60 / 3) * i} y2={(60 / 3) * i} stroke="rgba(148,163,184,0.12)" strokeWidth={0.6} />
        ))}

        {decimated.map((line) => {
          const data = line.data;
          const parts = new Array<string>(data.length);
          for (let i = 0; i < data.length; i++) {
            const p = data[i];
            parts[i] = `${toX(p.t).toFixed(3)},${toY(p.y).toFixed(3)}`;
          }
          const pts = parts.join(" ");

          return (
            <polyline
              key={line.id}
              fill="none"
              stroke={line.color}
              strokeWidth={1.6}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={pts}
              opacity={0.95}
            />
          );
        })}
      </svg>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
        <span>{fmtUsd(yMinRaw)}</span>
        <span>{fmtUsd(yMaxRaw)}</span>
      </div>
    </div>
  );
}

function computeDrawdownPct(points: EquityPoint[]) {
  let peak = -Infinity;
  let worst = 0;
  for (const p of points) {
    peak = Math.max(peak, p.total);
    if (peak > 0) {
      const dd = ((peak - p.total) / peak) * 100;
      worst = Math.max(worst, dd);
    }
  }
  return worst;
}

const STRATEGY_REQ_PREFIX = "TRADING_STRATEGY_REQUEST:";
const STRATEGY_REPLY_PREFIX = "TRADING_STRATEGY_REPLY:";

export default function TradingView() {
  const [status, setStatus] = useState<TraderStatus | null>(null);
  const [live, setLive] = useState<TraderLive | null>(null);
  const [state, setState] = useState<TraderState | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState<"start" | "stop" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Frankenstein strategy chat (subset)
  const [strategyMessages, setStrategyMessages] = useState<FrankMessage[]>([]);
  const [strategyInput, setStrategyInput] = useState("");
  const [strategyThinking, setStrategyThinking] = useState(false);
  const [strategyStream, setStrategyStream] = useState("");

  const [exchange, setExchange] = useState<TradingExchange>("kraken");
  const [symbols, setSymbols] = useState("BTCUSDT,ETHUSDT");
  const [paperMode, setPaperMode] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(3600);
  const [riskPerTrade, setRiskPerTrade] = useState(0.02);
  const [minConfidence, setMinConfidence] = useState(0.6);

  // Live charting (front-end only, no extra deps)
  const [chartPaused, setChartPaused] = useState(false);
  const chartPausedRef = useRef(false);
  const [equitySeries, setEquitySeries] = useState<EquityPoint[]>([]);
  const [signalSeriesBySymbol, setSignalSeriesBySymbol] = useState<Record<string, SignalPoint[]>>({});
  const [priceChartSymbol, setPriceChartSymbol] = useState<string>("");
  const lastTickCountRef = useRef<number | null>(null);

  const [lastTickMs, setLastTickMs] = useState<number | null>(null);
  const [avgTickMs, setAvgTickMs] = useState<number | null>(null);
  const tickStartAtRef = useRef<number | null>(null);
  const tickEmaRef = useRef<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const awaitingStrategyReplyRef = useRef(false);

  useEffect(() => {
    chartPausedRef.current = chartPaused;
  }, [chartPaused]);

  const appendEquityPoint = useCallback((t: number, portfolio: any) => {
    const total = Number(portfolio?.total_value_usd ?? portfolio?.total_value ?? 0);
    const cash = Number(portfolio?.usdt_cash ?? portfolio?.cash ?? 0);
    if (!Number.isFinite(total) || total <= 0) return;
    const safeT = Number.isFinite(t) && t > 0 ? t : Date.now();

    setEquitySeries((prev) => {
      const last = prev[prev.length - 1];
      if (last && Math.abs(last.t - safeT) < 900) return prev; // de-dupe within ~1s
      const invested = Math.max(0, total - (Number.isFinite(cash) ? cash : 0));
      const next = [...prev, { t: safeT, total, cash: Number.isFinite(cash) ? cash : 0, invested }];
      return next.length > 600 ? next.slice(-600) : next;
    });
  }, []);

  const appendSignalPoint = useCallback((p: SignalPoint) => {
    setSignalSeriesBySymbol((prev) => {
      const list = prev[p.symbol] || [];
      const last = list[list.length - 1];
      if (last && Math.abs(last.t - p.t) < 900 && Math.abs(last.price - p.price) < 1e-9 && last.action === p.action) return prev;
      const nextList = [...list, p];
      const capped = nextList.length > 400 ? nextList.slice(-400) : nextList;
      return { ...prev, [p.symbol]: capped };
    });
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [sRes, lRes, stRes, logRes, tradesRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/trader/status`),
        fetch(`${BRIDGE_URL}/api/trader/live?limit=200`),
        fetch(`${BRIDGE_URL}/api/trader/state`),
        fetch(`${BRIDGE_URL}/api/trader/log?lines=400`),
        fetch(`${BRIDGE_URL}/api/trader/trades?limit=400`),
      ]);

      if (sRes.ok) setStatus(await sRes.json());
      if (lRes.ok) setLive(await lRes.json());
      if (stRes.ok) {
        const st = await stRes.json();
        setState(st);
        if (typeof st?.exchange === "string") {
          const ex = st.exchange.trim().toLowerCase();
          if (ex === "kraken" || ex === "binance") setExchange(ex);
        }
        if (Array.isArray(st?.symbols) && st.symbols.length > 0) setSymbols(st.symbols.join(","));
        if (typeof st?.paper_mode === "boolean") setPaperMode(st.paper_mode);
        if (typeof st?.risk_per_trade === "number") setRiskPerTrade(st.risk_per_trade);
        if (typeof st?.min_confidence === "number") setMinConfidence(st.min_confidence);

        if (!chartPausedRef.current) {
          const tickCount = typeof st?.tick_count === "number" ? st.tick_count : null;
          if (tickCount != null && tickCount !== lastTickCountRef.current) {
            lastTickCountRef.current = tickCount;
            const t = st?.last_tick_at ? Date.parse(st.last_tick_at) : Date.now();
            appendEquityPoint(t, st?.portfolio);
          }
        }

        if (Array.isArray(st?.symbols) && st.symbols.length > 0) {
          setPriceChartSymbol((prev) => prev || String(st.symbols[0]));
        }
      }
      if (logRes.ok) {
        const data = await logRes.json();
        setLogLines(data.lines || []);
      }

      if (tradesRes.ok) {
        const data = (await tradesRes.json()) as TraderTradesResponse;
        setTrades(Array.isArray(data.trades) ? data.trades : []);
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
      if (!ev) return;
      setLive((prev) => {
        const base: TraderLive = prev || { active: true, events: [], last_update: Date.now(), event_count: 0 };
        const nextEvents = [...base.events, ev].slice(-50);
        return { ...base, active: true, events: nextEvents, last_update: Date.now(), event_count: base.event_count + 1 };
      });

      if (chartPausedRef.current) return;

      if (ev?.type === "trader_tick_done" && ev?.portfolio) {
        const t = ev?.ts ? Date.parse(ev.ts) : Date.now();
        appendEquityPoint(t, ev.portfolio);
      }

      if (ev?.type === "trader_tick_start") {
        const t = ev?.ts ? Date.parse(ev.ts) : Date.now();
        tickStartAtRef.current = Number.isFinite(t) ? t : Date.now();
      }

      if (ev?.type === "trader_tick_done") {
        const end = ev?.ts ? Date.parse(ev.ts) : Date.now();
        const start = tickStartAtRef.current;
        if (start != null && Number.isFinite(end) && end >= start) {
          const ms = end - start;
          setLastTickMs(ms);
          const prev = tickEmaRef.current;
          const ema = prev == null ? ms : prev * 0.8 + ms * 0.2;
          tickEmaRef.current = ema;
          setAvgTickMs(ema);
        }
      }

      if (ev?.type === "trader_signal" && ev?.signal) {
        const sig = ev.signal;
        const symbol = String(ev?.symbol || sig?.symbol || "").trim().toUpperCase();
        const action = String(sig?.action || "");
        const price = Number(sig?.price || 0);
        const conf = Number(sig?.confidence || 0);
        if (symbol && Number.isFinite(price) && price > 0) {
          const t = sig?.timestamp ? Date.parse(sig.timestamp) : (ev?.ts ? Date.parse(ev.ts) : Date.now());
          appendSignalPoint({ t, symbol, action, conf: clamp(conf, 0, 1), price });
          setPriceChartSymbol((prev) => prev || symbol);
        }
      }
    });

    socket.on("frank_message", (msg: FrankMessage) => {
      // Collect only messages explicitly tagged for strategy chat.
      const text = msg?.content || "";
      const isTaggedUser = msg.role === "user" && text.trim().startsWith(STRATEGY_REQ_PREFIX);
      const isTaggedReply = msg.role === "cascade" && text.trim().startsWith(STRATEGY_REPLY_PREFIX);
      if (!isTaggedUser && !isTaggedReply) return;

      setStrategyMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (msg.role === "cascade") {
        setStrategyThinking(false);
        setStrategyStream("");
        awaitingStrategyReplyRef.current = false;
      }
    });

    socket.on("frank_stream", (data: { content: string }) => {
      if (!awaitingStrategyReplyRef.current) return;
      setStrategyStream(data?.content || "");
    });

    socket.on("frank_status", (s: { type: string }) => {
      if (!awaitingStrategyReplyRef.current) return;
      if (s?.type === "thinking") setStrategyThinking(true);
      if (s?.type === "done") setStrategyThinking(false);
    });

    return () => { socket.disconnect(); };
  }, []);

  // Seed charts from the live event buffer (when (re)loading the view)
  useEffect(() => {
    if (!live?.events || live.events.length === 0) return;
    setEquitySeries((prev) => {
      if (prev.length > 0) return prev;
      const pts: EquityPoint[] = [];
      for (const ev of live.events) {
        if (ev?.type !== "trader_tick_done" || !ev?.portfolio) continue;
        const t = ev?.ts ? Date.parse(ev.ts) : Date.now();
        const total = Number(ev?.portfolio?.total_value_usd ?? 0);
        const cash = Number(ev?.portfolio?.usdt_cash ?? 0);
        if (!Number.isFinite(total) || total <= 0) continue;
        pts.push({ t, total, cash: Number.isFinite(cash) ? cash : 0, invested: Math.max(0, total - (Number.isFinite(cash) ? cash : 0)) });
      }
      return pts.length > 0 ? pts.slice(-600) : prev;
    });
  }, [live?.events]);

  const sendStrategyMessage = async () => {
    const text = strategyInput.trim();
    if (!text || strategyThinking) return;

    setStrategyInput("");
    setStrategyThinking(true);
    setStrategyStream("");
    awaitingStrategyReplyRef.current = true;

    const snapshotState = state || (await fetch(`${BRIDGE_URL}/api/trader/state`).then((r) => r.json()).catch(() => null));
    const snapshotLive = live || (await fetch(`${BRIDGE_URL}/api/trader/live?limit=200`).then((r) => r.json()).catch(() => null));
    const snapshotTrades = trades.length > 0 ? trades : await fetch(`${BRIDGE_URL}/api/trader/trades?limit=200`).then((r) => r.json()).then((d) => d.trades || []).catch(() => []);

    const files = [
      { name: "trader_state.json", content: JSON.stringify(snapshotState, null, 2).slice(0, 200_000), type: "application/json", size: JSON.stringify(snapshotState).length, encoding: "text" },
      { name: "trader_live_events.json", content: JSON.stringify(snapshotLive, null, 2).slice(0, 200_000), type: "application/json", size: JSON.stringify(snapshotLive).length, encoding: "text" },
      { name: "trader_trades.json", content: JSON.stringify(snapshotTrades, null, 2).slice(0, 200_000), type: "application/json", size: JSON.stringify(snapshotTrades).length, encoding: "text" },
    ];

    const prompt = `${STRATEGY_REQ_PREFIX} ${text}\n\n` +
      `Du får bifogade trader_state.json + trader_live_events.json + trader_trades.json.\n` +
      `Analysera signaler/beslut, diskutera strategi, risk, parametrar och förbättringar.\n` +
      `Svara ALLTID med första raden exakt: ${STRATEGY_REPLY_PREFIX}`;

    socketRef.current?.emit("frank_message", { content: prompt, files });
  };

  const startTrader = async () => {
    setActionBusy("start");
    setError(null);
    try {
      const payload = {
        exchange,
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

  const equityStats = useMemo(() => {
    if (equitySeries.length < 2) return null;
    const start = equitySeries[0].total;
    const last = equitySeries[equitySeries.length - 1].total;
    const pnlPct = start > 0 ? ((last - start) / start) * 100 : 0;
    const drawdownPct = computeDrawdownPct(equitySeries);
    return { start, last, pnlPct, drawdownPct };
  }, [equitySeries]);

  const equityLines = useMemo<ChartLine[]>(
    () => [
      { id: "total", color: "#34d399", data: equitySeries.map((p) => ({ t: p.t, y: p.total })) },
      { id: "cash", color: "#60a5fa", data: equitySeries.map((p) => ({ t: p.t, y: p.cash })) },
      { id: "inv", color: "#f59e0b", data: equitySeries.map((p) => ({ t: p.t, y: p.invested })) },
    ],
    [equitySeries],
  );

  const priceSeries = useMemo(() => {
    if (!priceChartSymbol) return [];
    return signalSeriesBySymbol[priceChartSymbol] || [];
  }, [priceChartSymbol, signalSeriesBySymbol]);

  const priceMeta = useMemo(() => {
    if (priceSeries.length < 1) return null;
    const last = priceSeries[priceSeries.length - 1];
    return {
      price: last.price,
      action: last.action,
      conf: last.conf,
    };
  }, [priceSeries]);

  const priceLine = useMemo<ChartLine[]>(
    () => [{ id: "price", color: "#e2e8f0", data: priceSeries.map((p) => ({ t: p.t, y: p.price })) }],
    [priceSeries],
  );

  const recentSignals = useMemo(() => {
    const list = state?.recent_signals || [];
    return [...list].slice(-10).reverse();
  }, [state?.recent_signals]);

  const signalCount = useMemo(() => {
    // Prefer a real counter if present in API; otherwise derive from recent signal list.
    const anyState: any = state as any;
    const fromState = typeof anyState?.signal_count === "number" ? anyState.signal_count : null;
    if (fromState != null) return fromState;
    const list = state?.recent_signals;
    return Array.isArray(list) ? list.length : 0;
  }, [state]);

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
          <span className="text-[10px] bg-slate-800/60 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/50">{exchange.toUpperCase()}</span>
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
            Exchange
            <select
              value={exchange}
              onChange={(e) => {
                const ex = e.target.value as TradingExchange;
                setExchange(ex);
                // Friendly defaults (users can still edit symbols freely)
                if (ex === "kraken" && symbols.trim() === "BTCUSDT,ETHUSDT") setSymbols("XBTUSDT,ETHUSDT");
              }}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            >
              <option value="kraken">Kraken</option>
              <option value="binance">Binance</option>
            </select>
          </label>
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
            <TrendingUp className="w-3.5 h-3.5" /> Signals
          </div>
          <div className="text-lg font-bold text-white">{signalCount}</div>
          <div className="text-[10px] text-slate-500">
            Tick: {state?.tick_count ?? 0}
            {lastTickMs != null && (
              <span className="ml-2">
                {Math.round(lastTickMs)}ms
                {avgTickMs != null ? ` (avg ${Math.round(avgTickMs)}ms)` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Positions</div>
          <div className="text-lg font-bold text-white">{Object.keys(positions).length}</div>
          <div className="text-[10px] text-slate-500">Last tick: {state?.last_tick_at || "—"}</div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <LineChart className="w-3.5 h-3.5" /> Live charts
            {lastTickMs != null && (
              <span className="text-[10px] text-slate-500 font-mono">· {Math.round(lastTickMs)}ms</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChartPaused((v) => !v)}
              className={
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border " +
                (chartPaused
                  ? "bg-amber-950/30 text-amber-200 border-amber-700/40 hover:bg-amber-950/50"
                  : "bg-slate-900/40 text-slate-200 border-slate-700/50 hover:bg-slate-900/60")
              }
              title={chartPaused ? "Återuppta live-uppdatering" : "Pausa live-uppdatering"}
            >
              <Pause className="w-3.5 h-3.5" />
              {chartPaused ? "Pausad" : "Pausa"}
            </button>
            <button
              onClick={() => {
                setEquitySeries([]);
                setSignalSeriesBySymbol({});
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-900/40 text-slate-200 border border-slate-700/50 hover:bg-slate-900/60"
              title="Rensa chart-historik (endast UI)"
            >
              <Trash2 className="w-3.5 h-3.5" /> Rensa
            </button>
          </div>
        </div>

        {equityStats && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="text-slate-500">Start:</span>
            <span className="text-slate-200 font-mono">{fmtUsd(equityStats.start)}</span>
            <span className="text-slate-500">Nu:</span>
            <span className="text-slate-200 font-mono">{fmtUsd(equityStats.last)}</span>
            <span className="text-slate-500">PnL:</span>
            <span className={equityStats.pnlPct >= 0 ? "text-emerald-200 font-mono" : "text-red-200 font-mono"}>
              {equityStats.pnlPct >= 0 ? "+" : ""}{equityStats.pnlPct.toFixed(2)}%
            </span>
            <span className="text-slate-500">Max DD:</span>
            <span className="text-amber-200 font-mono">{equityStats.drawdownPct.toFixed(2)}%</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Equity</div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> total
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> cash
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> invested
                </span>
              </div>
            </div>
            <MiniTimeSeriesChart
              lines={equityLines}
              maxPoints={240}
            />
          </div>

          <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Price</div>
                {priceMeta && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    {fmtUsd(priceMeta.price)}
                    {priceMeta.action ? ` · ${priceMeta.action}` : ""}
                    {Number.isFinite(priceMeta.conf) ? ` ${(priceMeta.conf * 100).toFixed(0)}%` : ""}
                  </div>
                )}
              </div>
              <select
                value={priceChartSymbol}
                onChange={(e) => setPriceChartSymbol(e.target.value)}
                aria-label="Price chart symbol"
                title="Välj symbol för prisgraf"
                className="bg-slate-950/40 border border-slate-700/50 rounded-lg px-2 py-1 text-[11px] text-white"
              >
                {(Object.keys(signalSeriesBySymbol).length > 0
                  ? Object.keys(signalSeriesBySymbol)
                  : (state?.symbols || []).map((s) => String(s)))
                  .filter(Boolean)
                  .map((sym) => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
              </select>
            </div>
            <MiniTimeSeriesChart
              lines={priceLine}
              maxPoints={240}
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Källa: live <span className="font-mono">trader_signal</span> events (senaste {priceSeries.length}).
            </div>
          </div>
        </div>

        {Object.keys(positions).length > 0 && (
          <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Exposure</div>
            <div className="space-y-1">
              {Object.entries(positions)
                .map(([sym, p]) => ({ sym, val: Number(p?.value_usd ?? 0), pct: totalUsd > 0 ? (Number(p?.value_usd ?? 0) / totalUsd) * 100 : 0 }))
                .sort((a, b) => b.val - a.val)
                .slice(0, 8)
                .map((row) => (
                  <div key={row.sym} className="grid grid-cols-[72px_1fr_52px] gap-2 items-center text-[11px]">
                    <div className="text-slate-300 font-medium truncate">{row.sym}</div>
                    <svg viewBox="0 0 100 6" width="100%" height="8" preserveAspectRatio="none" className="block">
                      <rect x="0" y="0" width="100" height="6" rx="3" fill="rgba(30,41,59,1)" />
                      <rect x="0" y="0" width={clamp(row.pct, 0, 100)} height="6" rx="3" fill="rgba(16,185,129,0.7)" />
                    </svg>
                    <div className="text-slate-400 font-mono text-right">{row.pct.toFixed(1)}%</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {Object.keys(positions).length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Portfolio</div>
          <div className="space-y-1">
            {Object.entries(positions).map(([sym, p]) => (
              <div key={sym} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium">{sym}</span>
                <span className="text-slate-400">qty {p.quantity}</span>
                <span className="text-slate-500">avg {p.avg_entry ?? "—"}</span>
                <span className={typeof p.unrealized_pct === "number" && p.unrealized_pct >= 0 ? "text-emerald-300" : "text-red-300"}>
                  {typeof p.unrealized_pct === "number" ? `${p.unrealized_pct.toFixed(2)}%` : "—"}
                </span>
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

      {Array.isArray(live?.events) && live!.events.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Live events (senaste {Math.min(200, live!.events.length)})</div>
          <div className="space-y-1">
            {[...live!.events].slice(-60).reverse().map((ev, idx) => (
              <details key={idx} className="text-[11px]">
                <summary className="cursor-pointer list-none flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500 font-mono">{ev?.ts ? new Date(ev.ts).toLocaleTimeString("sv-SE") : "—"}</span>
                  <span className="text-slate-400">{ev?.type || "event"}</span>
                  {ev?.symbol && <span className="text-slate-200 font-medium">{ev.symbol}</span>}
                </summary>
                <pre className="mt-2 bg-slate-950/50 border border-slate-700/50 rounded-lg p-2 text-[10px] text-slate-300 font-mono whitespace-pre-wrap max-h-64 overflow-auto">{JSON.stringify(ev, null, 2)}</pre>
              </details>
            ))}
          </div>
        </div>
      )}

      {trades.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Trades / trace (trades.jsonl)</div>
          <div className="space-y-1">
            {[...trades].slice(-80).reverse().map((t, idx) => (
              <details key={idx} className="text-[11px]">
                <summary className="cursor-pointer list-none flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500 font-mono">{t?.signal?.timestamp ? new Date(t.signal.timestamp).toLocaleString("sv-SE") : "—"}</span>
                  <span className="text-slate-400">{t?.type || "record"}</span>
                  {t?.signal?.symbol && <span className="text-slate-200 font-medium">{t.signal.symbol}</span>}
                  {t?.signal?.action && <span className={t.signal.action === "BUY" ? "text-emerald-300" : t.signal.action === "SELL" ? "text-red-300" : "text-slate-400"}>{t.signal.action}</span>}
                  {typeof t?.order?.realized_pct === "number" && <span className={t.order.realized_pct >= 0 ? "text-emerald-300" : "text-red-300"}>{t.order.realized_pct.toFixed(2)}%</span>}
                </summary>
                <pre className="mt-2 bg-slate-950/50 border border-slate-700/50 rounded-lg p-2 text-[10px] text-slate-300 font-mono whitespace-pre-wrap max-h-64 overflow-auto">{JSON.stringify(t, null, 2)}</pre>
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <MessageSquareText className="w-3.5 h-3.5" /> Strategi med Frankenstein
          </div>
        </div>

        <div className="space-y-1 max-h-56 overflow-auto">
          {strategyMessages.length === 0 && (
            <div className="text-[11px] text-slate-500">Skicka en fråga här så analyserar Frankenstein senaste tick + events + trades.</div>
          )}
          {strategyMessages.map((m) => {
            const content = (m.content || "").replace(STRATEGY_REQ_PREFIX, "").replace(STRATEGY_REPLY_PREFIX, "").trim();
            return (
              <div key={m.id} className={m.role === "user" ? "text-[11px] text-slate-200" : "text-[11px] text-emerald-200"}>
                <span className="text-slate-500 font-mono mr-2">{new Date(m.timestamp).toLocaleTimeString("sv-SE")}</span>
                <span className="font-semibold mr-2">{m.role === "user" ? "Du" : "Frank"}:</span>
                <span className="whitespace-pre-wrap">{content}</span>
              </div>
            );
          })}
          {strategyStream && (
            <div className="text-[11px] text-emerald-200">
              <span className="text-slate-500 font-mono mr-2">…</span>
              <span className="font-semibold mr-2">Frank:</span>
              <span className="whitespace-pre-wrap">{strategyStream.replace(STRATEGY_REPLY_PREFIX, "").trim()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={strategyInput}
            onChange={(e) => setStrategyInput(e.target.value)}
            placeholder="T.ex. 'Varför HOLD på BTC? Vad ändrar vi för att handla mer säkert?'"
            className="flex-1 bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-2 text-[11px] text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendStrategyMessage();
            }}
          />
          <button
            onClick={sendStrategyMessage}
            disabled={strategyThinking || !strategyInput.trim()}
            className="px-3 py-2 rounded-lg bg-emerald-900/50 hover:bg-emerald-900/70 text-emerald-200 text-[11px] font-medium disabled:opacity-50"
            title="Skicka (Ctrl+Enter)"
          >
            {strategyThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skicka"}
          </button>
        </div>
        <div className="text-[10px] text-slate-500">
          Skickar med: trader_state.json + live events + trades. Svar visas här, och finns även i 🧟 Frankenstein-chatten.
        </div>
      </div>
    </div>
  );
}
