import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";
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
  target_order_count?: number;
  target_order_remaining?: number;
  max_runtime_seconds?: number;
  exchange?: string;
  symbols?: string[];
  paper_mode?: boolean;
  risk_per_trade?: number;
  min_confidence?: number;
  kline_interval?: string;
  max_positions?: number;
  cooldown_seconds?: number;
  take_profit_pct?: number;
  stop_loss_pct?: number;
  trailing_stop_pct?: number;
  aggression?: number;
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

type TraderBurstPlan = {
  targetOrderCount: number;
  maxRuntimeSeconds?: number;
  symbolMode?: "selected" | "top20_all" | "top20_random";
  randomCount?: number;

  // Optional overrides (if omitted, current UI config is used)
  klineInterval?: string;
  riskPerTrade?: number;
  minConfidence?: number;
  maxPositions?: number;
  cooldownSeconds?: number;
  takeProfitPct?: number;
  stopLossPct?: number;
  trailingStopPct?: number;
  aggression?: number;
};

const TRADER_BURST_PREFIX = "TRADER_BURST_JSON:";

function parseTraderBurstPlan(text: string): { plan: TraderBurstPlan; rawJson: string } | { error: string } | null {
  if (!text) return null;
  const idx = text.indexOf(TRADER_BURST_PREFIX);
  if (idx < 0) return null;

  const after = text.slice(idx + TRADER_BURST_PREFIX.length);
  const fence = after.match(/```json\s*([\s\S]*?)```/i) || after.match(/```\s*([\s\S]*?)```/);
  const candidate = (fence ? fence[1] : after).trim();
  const a = candidate.indexOf("{");
  const b = candidate.lastIndexOf("}");
  if (a < 0 || b <= a) return { error: "No JSON object found after TRADER_BURST_JSON" };

  const rawJson = candidate.slice(a, b + 1).trim();
  try {
    const obj = JSON.parse(rawJson) as Partial<TraderBurstPlan>;
    const target = Number(obj?.targetOrderCount);
    if (!Number.isFinite(target) || target <= 0) return { error: "targetOrderCount must be a positive number" };

    const plan: TraderBurstPlan = {
      targetOrderCount: Math.max(1, Math.min(200, Math.floor(target))),
      maxRuntimeSeconds: obj?.maxRuntimeSeconds != null ? Math.max(10, Math.min(24 * 3600, Math.floor(Number(obj.maxRuntimeSeconds) || 0))) : undefined,
      symbolMode: obj?.symbolMode,
      randomCount: obj?.randomCount != null ? Math.max(1, Math.min(20, Math.floor(Number(obj.randomCount) || 0))) : undefined,
      klineInterval: typeof obj?.klineInterval === "string" ? obj.klineInterval : undefined,
      riskPerTrade: obj?.riskPerTrade != null ? Number(obj.riskPerTrade) : undefined,
      minConfidence: obj?.minConfidence != null ? Number(obj.minConfidence) : undefined,
      maxPositions: obj?.maxPositions != null ? Number(obj.maxPositions) : undefined,
      cooldownSeconds: obj?.cooldownSeconds != null ? Number(obj.cooldownSeconds) : undefined,
      takeProfitPct: obj?.takeProfitPct != null ? Number(obj.takeProfitPct) : undefined,
      stopLossPct: obj?.stopLossPct != null ? Number(obj.stopLossPct) : undefined,
      trailingStopPct: obj?.trailingStopPct != null ? Number(obj.trailingStopPct) : undefined,
      aggression: obj?.aggression != null ? Number(obj.aggression) : undefined,
    };

    return { plan, rawJson };
  } catch (e) {
    return { error: `Invalid JSON in TRADER_BURST_JSON: ${String(e)}` };
  }
}

type TraderSymbolsResponse = {
  exchange: TradingExchange;
  assets: string[];
  symbols: string[];
  max: number;
};

type PriceChartMode = "candles" | "line" | "area";
type PriceValueMode = "price" | "pct";
type PriceScale = "linear" | "log";

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

type Candle = {
  t: number; // bucket start (ms)
  open: number;
  high: number;
  low: number;
  close: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toCandles(points: Array<{ t: number; price: number }>, bucketMs: number): Candle[] {
  if (!Number.isFinite(bucketMs) || bucketMs <= 0) return [];
  if (points.length < 1) return [];

  const out: Candle[] = [];
  let cur: Candle | null = null;
  let lastClose: number | null = null;

  for (const p of points) {
    const t = Number.isFinite(p.t) ? p.t : Date.now();
    const price = Number.isFinite(p.price) ? p.price : NaN;
    if (!Number.isFinite(price) || price <= 0) continue;

    const bucket = Math.floor(t / bucketMs) * bucketMs;

    if (!cur || cur.t !== bucket) {
      // If we only get ~1 price tick per bucket, using prev close as open makes candles show movement.
      const open: number = lastClose != null && Number.isFinite(lastClose) ? lastClose : price;
      cur = { t: bucket, open, high: Math.max(open, price), low: Math.min(open, price), close: price };
      out.push(cur);
    } else {
      cur.high = Math.max(cur.high, price);
      cur.low = Math.min(cur.low, price);
      cur.close = price;
    }

    lastClose = cur.close;
  }

  return out;
}

function MiniCandleChart(
  {
    candles,
    height = 96,
    maxCandles = 180,
    showAxis = true,
    interactive = true,
    upColor = "rgba(16,185,129,0.95)",
    downColor = "rgba(248,113,113,0.95)",
  }: {
    candles: Candle[];
    height?: number;
    maxCandles?: number;
    showAxis?: boolean;
    interactive?: boolean;
    upColor?: string;
    downColor?: string;
  },
) {
  const data = useMemo(() => downsample(candles, maxCandles), [candles, maxCandles]);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <div className="h-24 flex items-center justify-center text-[11px] text-slate-500">
        Väntar på data…
      </div>
    );
  }

  let yMinRaw = Infinity;
  let yMaxRaw = -Infinity;
  for (const c of data) {
    yMinRaw = Math.min(yMinRaw, c.low);
    yMaxRaw = Math.max(yMaxRaw, c.high);
  }
  if (!Number.isFinite(yMinRaw) || !Number.isFinite(yMaxRaw) || yMinRaw <= 0) {
    return (
      <div className="h-24 flex items-center justify-center text-[11px] text-slate-500">
        Väntar på data…
      </div>
    );
  }

  const pad = (yMaxRaw - yMinRaw) * 0.08;
  const yMin = yMinRaw - pad;
  const yMax = yMaxRaw + pad;
  const toY = (y: number) => {
    if (yMax === yMin) return 50;
    const v = (y - yMin) / (yMax - yMin);
    return 60 - v * 60;
  };

  const n = data.length;
  const cw = 100 / n;
  const bodyW = Math.max(0.7, cw * 0.62);

  const hover = hoverIdx != null && hoverIdx >= 0 && hoverIdx < n ? data[hoverIdx] : null;
  const hoverXMid = hover ? hoverIdx! * cw + cw * 0.5 : null;
  const hoverLabel = hover ? `${fmtCompactTime(hover.t)}  ${fmtUsd(hover.close)}` : "";

  const handleMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = rect.width > 0 ? (x / rect.width) * 100 : 0;
    const idx = clamp(Math.floor(pct / cw), 0, n - 1);
    setHoverIdx(idx);
  };

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 100 60"
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="block"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* grid */}
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={0} x2={100} y1={(60 / 3) * i} y2={(60 / 3) * i} stroke="rgba(148,163,184,0.12)" strokeWidth={0.6} />
        ))}

        {data.map((c, idx) => {
          const up = c.close >= c.open;
          const color = up ? upColor : downColor;
          const xMid = idx * cw + cw * 0.5;
          const yHigh = toY(c.high);
          const yLow = toY(c.low);
          const yOpen = toY(c.open);
          const yClose = toY(c.close);
          const yTop = Math.min(yOpen, yClose);
          const yBot = Math.max(yOpen, yClose);
          const bodyH = Math.max(0.8, yBot - yTop);
          const xBody = xMid - bodyW * 0.5;

          return (
            <g key={c.t}>
              {/* wick */}
              <line x1={xMid} y1={yHigh} x2={xMid} y2={yLow} stroke={color} strokeWidth={1.0} opacity={0.9} />
              {/* body */}
              <rect x={xBody} y={yTop} width={bodyW} height={bodyH} fill={color} opacity={0.9} rx={0.25} />
            </g>
          );
        })}

        {hover && hoverXMid != null && (
          <g>
            <line x1={hoverXMid} y1={0} x2={hoverXMid} y2={60} stroke="rgba(226,232,240,0.35)" strokeWidth={0.6} />
            <rect x={clamp(hoverXMid - 26, 1, 99 - 52)} y={1} width={52} height={10} rx={2} fill="rgba(2,6,23,0.75)" stroke="rgba(148,163,184,0.22)" />
            <text x={clamp(hoverXMid, 1 + 26, 99 - 26)} y={8.3} textAnchor="middle" fontSize={4.2} fill="rgba(226,232,240,0.92)" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
              {hoverLabel}
            </text>
          </g>
        )}
      </svg>

      {showAxis && (
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>{fmtUsd(yMinRaw)}</span>
          <span>{fmtUsd(yMaxRaw)}</span>
        </div>
      )}
    </div>
  );
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

function fmtPct(n: number, digits = 2) {
  const v = Number.isFinite(n) ? n : 0;
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

function fmtCompactTime(t: number) {
  const d = new Date(Number.isFinite(t) ? t : Date.now());
  // HH:MM:SS (sv-SE) keeps it clean and predictable
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function MiniTimeSeriesChart(
  {
    lines,
    height = 96,
    maxPoints = 260,
    colorByDelta = false,
    fill = false,
    showAxis = true,
    yScale = "linear",
    formatY,
    upColor = "rgba(16,185,129,0.95)",
    downColor = "rgba(248,113,113,0.95)",
  }: {
    lines: ChartLine[];
    height?: number;
    maxPoints?: number;
    colorByDelta?: boolean;
    fill?: boolean;
    showAxis?: boolean;
    yScale?: "linear" | "log";
    formatY?: (n: number) => string;
    upColor?: string;
    downColor?: string;
  },
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

          if (colorByDelta) {
            // Red/green movement segments (up = green, down = red)
            const segs: ReactNode[] = [];
            for (let i = 1; i < data.length; i++) {
              const a = data[i - 1];
              const b = data[i];
              const up = b.y >= a.y;
              segs.push(
                <line
                  key={`${line.id}-seg-${i}`}
                  x1={toX(a.t)}
                  y1={toY(a.y)}
                  x2={toX(b.t)}
                  y2={toY(b.y)}
                  stroke={up ? upColor : downColor}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={0.95}
                />,
              );
            }
            return <g key={line.id}>{segs}</g>;
          }

          const parts = new Array<string>(data.length);
          for (let i = 0; i < data.length; i++) {
            const p = data[i];
            parts[i] = `${toX(p.t).toFixed(3)},${toY(p.y).toFixed(3)}`;
          }
          const pts = parts.join(" ");

          // Optional area fill (used for "Area" mode)
          const fillPts = fill && data.length >= 2
            ? `${pts} 100,60 0,60`
            : null;

          return (
            <g key={line.id}>
              {fillPts && (
                <polygon
                  points={fillPts}
                  fill="rgba(34,211,238,0.10)"
                  opacity={0.9}
                />
              )}
              <polyline
                fill="none"
                stroke={line.color}
                strokeWidth={1.8}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pts}
                opacity={0.95}
              />
            </g>
          );
        })}
      </svg>

      {showAxis && (
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>{(formatY || fmtUsd)(yMinRaw)}</span>
          <span>{(formatY || fmtUsd)(yMaxRaw)}</span>
        </div>
      )}
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

  // Config (avoid reversion by server polling)
  const [configDirty, setConfigDirty] = useState(false);
  const configDirtyRef = useRef(false);

  const [exchange, setExchange] = useState<TradingExchange>("kraken");
  const [symbols, setSymbols] = useState("BTCUSDT,ETHUSDT");
  const [paperMode, setPaperMode] = useState(true);

  const [intervalSeconds, setIntervalSeconds] = useState(3600);
  const [riskPerTrade, setRiskPerTrade] = useState(0.02);
  const [minConfidence, setMinConfidence] = useState(0.6);

  const [klineInterval, setKlineInterval] = useState("1h");
  const [maxPositions, setMaxPositions] = useState(2);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [takeProfitPct, setTakeProfitPct] = useState(0);
  const [stopLossPct, setStopLossPct] = useState(0);
  const [trailingStopPct, setTrailingStopPct] = useState(0);
  const [aggression, setAggression] = useState(0.5);

  const [symbolUniverse, setSymbolUniverse] = useState<string[]>([]);
  const [symbolQuery, setSymbolQuery] = useState("");
  const [symbolUniverseError, setSymbolUniverseError] = useState<string | null>(null);

  // Live charting (front-end only, no extra deps)
  const [chartPaused, setChartPaused] = useState(false);
  const chartPausedRef = useRef(false);
  const [equitySeries, setEquitySeries] = useState<EquityPoint[]>([]);
  const [signalSeriesBySymbol, setSignalSeriesBySymbol] = useState<Record<string, SignalPoint[]>>({});
  const [priceChartSymbol, setPriceChartSymbol] = useState<string>("");
  const [priceChartMode, setPriceChartMode] = useState<PriceChartMode>("candles");
  const [priceTimeframeMs, setPriceTimeframeMs] = useState<number>(60_000);
  const [priceValueMode, setPriceValueMode] = useState<PriceValueMode>("price");
  const [priceScale, setPriceScale] = useState<PriceScale>("linear");
  const [priceRangeMs, setPriceRangeMs] = useState<number>(3_600_000); // 1h window by default
  const [rangeNowEpoch, setRangeNowEpoch] = useState<number>(() => Date.now());
  const [autoFollow, setAutoFollow] = useState(true);
  const autoFollowRef = useRef(true);
  const [lastMarketPriceAt, setLastMarketPriceAt] = useState<number | null>(null);
  const [uiNowEpoch, setUiNowEpoch] = useState<number>(() => Date.now());
  const lastTickCountRef = useRef<number | null>(null);

  const [lastTickMs, setLastTickMs] = useState<number | null>(null);
  const [avgTickMs, setAvgTickMs] = useState<number | null>(null);
  const tickStartAtRef = useRef<number | null>(null);
  const tickEmaRef = useRef<number | null>(null);

  const [socketEpoch, setSocketEpoch] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const awaitingStrategyReplyRef = useRef(false);

  // Strategy chat (Frankenstein)
  const [strategyMessages, setStrategyMessages] = useState<FrankMessage[]>([]);
  const [strategyInput, setStrategyInput] = useState("");
  const [strategyThinking, setStrategyThinking] = useState(false);
  const [strategyStream, setStrategyStream] = useState("");

  // AI execution (paper-only) from strategy replies
  const [allowAiExecution, setAllowAiExecution] = useState(false);
  const [pendingBurstPlan, setPendingBurstPlan] = useState<TraderBurstPlan | null>(null);
  const [pendingBurstPlanError, setPendingBurstPlanError] = useState<string | null>(null);

  useEffect(() => {
    chartPausedRef.current = chartPaused;
  }, [chartPaused]);

  useEffect(() => {
    autoFollowRef.current = autoFollow;
  }, [autoFollow]);

  useEffect(() => {
    const t = setInterval(() => setUiNowEpoch(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (priceChartMode === "candles" && priceScale === "log") setPriceScale("linear");
    if (priceValueMode === "pct" && priceScale === "log") setPriceScale("linear");
  }, [priceChartMode, priceValueMode, priceScale]);

  useEffect(() => {
    configDirtyRef.current = configDirty;
  }, [configDirty]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `${BRIDGE_URL}/api/trader/symbols?exchange=${encodeURIComponent(exchange)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = (await res.json()) as Partial<TraderSymbolsResponse>;
        const list = Array.isArray(j?.symbols)
          ? j.symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
          : [];
        if (cancelled) return;
        setSymbolUniverse(list);
        setSymbolUniverseError(null);
      } catch (e) {
        if (cancelled) return;
        setSymbolUniverse([]);
        setSymbolUniverseError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exchange]);

  const selectedSymbols = useMemo(() => {
    return symbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }, [symbols]);

  const filteredUniverse = useMemo(() => {
    const q = symbolQuery.trim().toUpperCase();
    if (!q) return symbolUniverse;
    return symbolUniverse.filter((s) => s.includes(q));
  }, [symbolUniverse, symbolQuery]);

  const toggleSymbol = useCallback((sym: string) => {
    const upper = sym.trim().toUpperCase();
    if (!upper) return;
    setConfigDirty(true);
    setSymbols((prev) => {
      const list = prev
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      const set = new Set(list);
      if (set.has(upper)) {
        return list.filter((s) => s !== upper).join(",");
      }
      return [...list, upper].slice(0, 20).join(",");
    });
  }, []);

  const setAllTopSymbols = useCallback(() => {
    setConfigDirty(true);
    setSymbols(symbolUniverse.slice(0, 20).join(","));
  }, [symbolUniverse]);

  const clearSymbols = useCallback(() => {
    setConfigDirty(true);
    setSymbols("");
  }, []);

  const setRandomSymbols = useCallback((count: number) => {
    const n = Math.max(1, Math.min(20, Math.floor(count)));
    if (symbolUniverse.length === 0) return;
    setConfigDirty(true);

    // Fisher–Yates shuffle (small list => fine)
    const arr = symbolUniverse.slice(0, 20);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    setSymbols(arr.slice(0, n).join(","));
  }, [symbolUniverse]);

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
      // Keep more history so we can switch ranges/timeframes without the chart feeling "empty".
      const capped = nextList.length > 2400 ? nextList.slice(-2400) : nextList;
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
        // Avoid clobbering local config edits (UI is polled every 3s).
        if (!configDirtyRef.current) {
          if (typeof st?.exchange === "string") {
            const ex = st.exchange.trim().toLowerCase();
            if (ex === "kraken" || ex === "binance") setExchange(ex);
          }
          if (Array.isArray(st?.symbols) && st.symbols.length > 0) setSymbols(st.symbols.join(","));
          if (typeof st?.paper_mode === "boolean") setPaperMode(st.paper_mode);
          if (typeof st?.risk_per_trade === "number") setRiskPerTrade(st.risk_per_trade);
          if (typeof st?.min_confidence === "number") setMinConfidence(st.min_confidence);

          if (typeof st?.kline_interval === "string" && st.kline_interval.trim()) setKlineInterval(st.kline_interval.trim());
          if (typeof st?.max_positions === "number") setMaxPositions(st.max_positions);
          if (typeof st?.cooldown_seconds === "number") setCooldownSeconds(st.cooldown_seconds);
          if (typeof st?.take_profit_pct === "number") setTakeProfitPct(st.take_profit_pct);
          if (typeof st?.stop_loss_pct === "number") setStopLossPct(st.stop_loss_pct);
          if (typeof st?.trailing_stop_pct === "number") setTrailingStopPct(st.trailing_stop_pct);
          if (typeof st?.aggression === "number") setAggression(st.aggression);
        }

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

    socket.on("connect", () => {
      setSocketEpoch((n) => n + 1);
    });

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
          if (autoFollowRef.current) {
            setRangeNowEpoch((prev) => Math.max(prev, Number.isFinite(t) ? t : Date.now()));
          }
          setPriceChartSymbol((prev) => prev || symbol);
        }
      }
    });

    socket.on("market_prices", (data: any) => {
      if (!data || chartPausedRef.current) return;
      const exchange = String(data?.exchange || "").toLowerCase();
      if (exchange && exchange !== "kraken" && exchange !== "binance") return;

      const t = data?.ts ? Date.parse(String(data.ts)) : Date.now();
      const safeT = Number.isFinite(t) ? t : Date.now();
      setLastMarketPriceAt(safeT);
      if (autoFollowRef.current) {
        setRangeNowEpoch((prev) => Math.max(prev, safeT));
      }
      const prices = data?.prices && typeof data.prices === "object" ? data.prices : null;
      if (!prices) return;

      for (const [sym, v] of Object.entries(prices)) {
        const symbol = String(sym || "").trim().toUpperCase();
        const price = Number(v);
        if (!symbol || !Number.isFinite(price) || price <= 0) continue;
        appendSignalPoint({ t: safeT, symbol, action: "", conf: 0, price });
        setPriceChartSymbol((prev) => prev || symbol);
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
        const parsed = parseTraderBurstPlan(text);
        if (parsed) {
          if ("plan" in parsed) {
            setPendingBurstPlan(parsed.plan);
            setPendingBurstPlanError(null);
          } else {
            setPendingBurstPlan(null);
            setPendingBurstPlanError(parsed.error);
          }
        }
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

  const marketPollMs = useMemo(() => {
    if (!Number.isFinite(priceTimeframeMs)) return 1000;
    if (priceTimeframeMs <= 15_000) return 1000;
    if (priceTimeframeMs <= 60_000) return 2000;
    return 5000;
  }, [priceTimeframeMs]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const symList = symbols
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 12);

    socket.emit("market_subscribe", {
      exchange,
      symbols: symList,
      intervalMs: marketPollMs,
    });

    return () => {
      socket.emit("market_unsubscribe");
    };
  }, [socketEpoch, exchange, symbols, marketPollMs]);

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
      `Svara ALLTID med första raden exakt: ${STRATEGY_REPLY_PREFIX}\n\n` +
      `Om användaren ber dig att EXEKVERA (t.ex. 'lägg 20 bra ordrar'), lägg till ett block i slutet:\n` +
      `${TRADER_BURST_PREFIX}\n` +
      "```json\n" +
      `{"targetOrderCount":20,"maxRuntimeSeconds":900,"symbolMode":"top20_random","randomCount":5,"klineInterval":"5m","aggression":0.85}\n` +
      "```\n" +
      `Regler: detta körs paper-only. Om något verkar farligt/otydligt: föreslå plan men be om bekräftelse i text.`;

    socketRef.current?.emit("frank_message", { content: prompt, files });
  };

  const startTrader = async () => {
    const payload = {
      exchange,
      symbols: symbols.split(",").map((s) => s.trim()).filter(Boolean),
      paperMode,
      intervalSeconds,
      riskPerTrade,
      minConfidence,
      klinesInterval: klineInterval,
      maxPositions,
      cooldownSeconds,
      takeProfitPct,
      stopLossPct,
      trailingStopPct,
      aggression,
    };
    await startTraderWithPayload(payload);
  };

  const startTraderWithPayload = async (payload: any) => {
    setActionBusy("start");
    setError(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/trader/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setConfigDirty(false);
      await fetchAll();
    } catch (e) {
      setError(String(e));
    } finally {
      setActionBusy(null);
    }
  };

  const executeBurstPlan = async () => {
    if (!pendingBurstPlan) return;
    if (running) {
      setError("Stoppa trader först (burst startar en ny process)");
      return;
    }
    if (!allowAiExecution) {
      setError("Slå på 'AI execution' först (paper only)");
      return;
    }

    const plan = pendingBurstPlan;
    const mode = plan.symbolMode || "selected";
    const pickN = plan.randomCount != null ? plan.randomCount : 5;

    let resolvedSymbols: string[] = [];
    if (mode === "top20_all") {
      resolvedSymbols = symbolUniverse.slice(0, 20);
    } else if (mode === "top20_random") {
      const arr = symbolUniverse.slice(0, 20);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
      resolvedSymbols = arr.slice(0, Math.max(1, Math.min(20, pickN)));
    } else {
      resolvedSymbols = selectedSymbols;
    }

    if (resolvedSymbols.length === 0) {
      setError("No symbols selected. Välj coins först (eller använd top-20 pickern)");
      return;
    }

    // Burst runs should tick quickly regardless of the user's normal interval (default is often 3600s).
    const burstIntervalSeconds = clamp(Math.round(intervalSeconds), 5, 15);

    const payload = {
      exchange,
      symbols: resolvedSymbols,
      // Safety: AI execution is ALWAYS paper-only
      paperMode: true,
      intervalSeconds: burstIntervalSeconds,
      riskPerTrade: plan.riskPerTrade ?? riskPerTrade,
      minConfidence: plan.minConfidence ?? minConfidence,
      klinesInterval: plan.klineInterval ?? klineInterval,
      maxPositions: plan.maxPositions ?? maxPositions,
      cooldownSeconds: plan.cooldownSeconds ?? cooldownSeconds,
      takeProfitPct: plan.takeProfitPct ?? takeProfitPct,
      stopLossPct: plan.stopLossPct ?? stopLossPct,
      trailingStopPct: plan.trailingStopPct ?? trailingStopPct,
      aggression: plan.aggression ?? aggression,
      targetOrderCount: plan.targetOrderCount,
      maxRuntimeSeconds: plan.maxRuntimeSeconds ?? 900,
    };

    await startTraderWithPayload(payload);
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
      setConfigDirty(false);
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

  const rangeEnd = rangeNowEpoch;
  const rangeStart = Math.max(0, rangeEnd - (Number.isFinite(priceRangeMs) ? priceRangeMs : 0));

  const symbolList = useMemo(() => {
    const fromState = Array.isArray(state?.symbols) ? state!.symbols.map((s) => String(s)) : [];
    const fromConfig = symbols.split(",").map((s) => s.trim()).filter(Boolean);
    const fromData = Object.keys(signalSeriesBySymbol);
    const merged = [...fromState, ...fromConfig, ...fromData]
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(merged)).slice(0, 20);
  }, [state?.symbols, symbols, signalSeriesBySymbol]);

  const priceSeriesAll = useMemo(() => {
    if (!priceChartSymbol) return [];
    return signalSeriesBySymbol[priceChartSymbol] || [];
  }, [priceChartSymbol, signalSeriesBySymbol]);

  const priceSeries = useMemo(() => {
    if (priceSeriesAll.length === 0) return [];
    return priceSeriesAll.filter((p) => p.t >= rangeStart && p.t <= rangeEnd);
  }, [priceSeriesAll, rangeStart, rangeEnd]);

  const priceCandles = useMemo(() => {
    // Standard OHLC aggregation: open=first, high=max, low=min, close=last per bucket
    return toCandles(priceSeries.map((p) => ({ t: p.t, price: p.price })), priceTimeframeMs).slice(-260);
  }, [priceSeries, priceTimeframeMs]);

  const priceMeta = useMemo(() => {
    // Show last price + delta based on selected timeframe (candle close-to-close)
    if (priceSeries.length < 1) return null;

    const lastPoint = priceSeries[priceSeries.length - 1];
    const lastPrice = lastPoint?.price;
    if (!Number.isFinite(lastPrice) || lastPrice <= 0) return null;

    const lastCandle = priceCandles.length >= 1 ? priceCandles[priceCandles.length - 1] : null;
    const prevCandle = priceCandles.length >= 2 ? priceCandles[priceCandles.length - 2] : null;

    const prevClose = prevCandle?.close;
    const close = lastCandle?.close ?? lastPrice;
    const delta = (typeof prevClose === "number" && Number.isFinite(prevClose)) ? (close - prevClose) : null;
    const deltaPct = (typeof prevClose === "number" && prevClose > 0 && delta !== null)
      ? (delta / prevClose) * 100
      : null;
    return {
      price: close,
      action: lastPoint.action,
      conf: lastPoint.conf,
      delta,
      deltaPct,
    };
  }, [priceSeries, priceCandles]);

  const priceLine = useMemo<ChartLine[]>(() => {
    if (priceSeries.length === 0) return [{ id: "price", color: "#e2e8f0", data: [] }];
    if (priceValueMode === "pct") {
      const base = priceSeries[0]?.price;
      const safeBase = Number.isFinite(base) && base > 0 ? base : null;
      return [{
        id: "pct",
        color: "#22d3ee",
        data: priceSeries
          .filter((p) => safeBase != null && Number.isFinite(p.price))
          .map((p) => ({ t: p.t, y: ((p.price - safeBase!) / safeBase!) * 100 })),
      }];
    }

    return [{ id: "price", color: "#e2e8f0", data: priceSeries.map((p) => ({ t: p.t, y: p.price })) }];
  }, [priceSeries, priceValueMode]);

  const watchRows = useMemo(() => {
    const rows = symbolList.map((sym) => {
      const s = signalSeriesBySymbol[sym] || [];
      const inRange = s.filter((p) => p.t >= rangeStart && p.t <= rangeEnd);
      const last = inRange.length > 0 ? inRange[inRange.length - 1] : (s.length > 0 ? s[s.length - 1] : null);
      const base = inRange.length > 0 ? inRange[0] : (s.length > 0 ? s[Math.max(0, s.length - 60)] : null);
      const lastPrice = last?.price;
      const basePrice = base?.price;
      const deltaPct = (Number.isFinite(lastPrice) && Number.isFinite(basePrice) && (basePrice as number) > 0)
        ? (((lastPrice as number) - (basePrice as number)) / (basePrice as number)) * 100
        : null;
      const candles = toCandles(inRange.map((p) => ({ t: p.t, price: p.price })), priceTimeframeMs).slice(-64);
      return { sym, lastPrice: Number.isFinite(lastPrice) ? (lastPrice as number) : null, deltaPct, candles };
    });

    // Sort: selected first, then biggest abs move
    return rows.sort((a, b) => {
      if (a.sym === priceChartSymbol) return -1;
      if (b.sym === priceChartSymbol) return 1;
      const ad = a.deltaPct == null ? -1 : Math.abs(a.deltaPct);
      const bd = b.deltaPct == null ? -1 : Math.abs(b.deltaPct);
      return bd - ad;
    });
  }, [symbolList, signalSeriesBySymbol, rangeStart, rangeEnd, priceTimeframeMs, priceChartSymbol]);

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

  const marketAgeMs = lastMarketPriceAt != null ? Math.max(0, uiNowEpoch - lastMarketPriceAt) : null;
  const marketIsLive = marketAgeMs != null && marketAgeMs <= Math.max(9000, marketPollMs * 3);
  const marketAgeLabel = marketAgeMs == null ? "—" : `${Math.round(marketAgeMs / 1000)}s`;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 trading-surface">
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
          <span
            className={
              "text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 " +
              (marketIsLive
                ? "bg-emerald-950/25 text-emerald-200 border-emerald-700/30"
                : "bg-amber-950/20 text-amber-200 border-amber-700/30")
            }
            title="Freshness för market_prices"
          >
            <span className={"w-1.5 h-1.5 rounded-full " + (marketIsLive ? "bg-emerald-400" : "bg-amber-400") + " animate-pulse-dot"} />
            Market {marketIsLive ? "live" : "stale"} · {marketAgeLabel}
          </span>
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

      <div className="trading-card rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Konfiguration</div>
          <div className="flex items-center gap-2">
            {running && <span className="text-[10px] text-slate-500">Stoppa för att ändra</span>}
            {configDirty && !running && (
              <button
                type="button"
                onClick={() => {
                  setConfigDirty(false);
                  fetchAll();
                }}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/50 border border-slate-700/50 text-slate-200 hover:bg-slate-900/70"
                title="Återställ fälten från serverns nuvarande state"
              >
                Återställ
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-slate-300">
            Exchange
            <select
              value={exchange}
              onChange={(e) => {
                setConfigDirty(true);
                const ex = e.target.value as TradingExchange;
                setExchange(ex);
                // Friendly defaults (users can still edit symbols freely)
                if (ex === "kraken" && symbols.trim() === "BTCUSDT,ETHUSDT") setSymbols("XBTUSDT,ETHUSDT");
              }}
              disabled={running}
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
              onChange={(e) => {
                setConfigDirty(true);
                setSymbols(e.target.value);
              }}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
              placeholder="BTCUSDT,ETHUSDT"
            />
          </label>

          <div className="col-span-2 rounded-lg border border-slate-700/40 bg-slate-950/30 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Top 20 coins</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRandomSymbols(5)}
                  disabled={running || symbolUniverse.length === 0}
                  className="px-2 py-0.5 rounded-md bg-slate-900/50 border border-slate-700/50 text-slate-200 hover:bg-slate-900/70 text-[10px] disabled:opacity-50"
                  title="Slumpa 5 (casino-mode)"
                >
                  🎲 Random 5
                </button>
                <button
                  type="button"
                  onClick={setAllTopSymbols}
                  disabled={running || symbolUniverse.length === 0}
                  className="px-2 py-0.5 rounded-md bg-slate-900/50 border border-slate-700/50 text-slate-200 hover:bg-slate-900/70 text-[10px] disabled:opacity-50"
                  title="Välj hela top-listan"
                >
                  Add all
                </button>
                <button
                  type="button"
                  onClick={clearSymbols}
                  disabled={running}
                  className="px-2 py-0.5 rounded-md bg-slate-900/50 border border-slate-700/50 text-slate-200 hover:bg-slate-900/70 text-[10px] disabled:opacity-50"
                  title="Rensa symboler"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <input
                value={symbolQuery}
                onChange={(e) => setSymbolQuery(e.target.value)}
                disabled={running}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
                placeholder="Search (ex: SOL, DOGE, BTC…)"
              />
              <div className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                {selectedSymbols.length}/20
              </div>
            </div>

            {symbolUniverseError && (
              <div className="mt-1 text-[10px] text-red-300">
                Universe error: {symbolUniverseError}
              </div>
            )}

            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-1 max-h-28 overflow-auto pr-1">
              {filteredUniverse.map((sym) => {
                const active = selectedSymbols.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymbol(sym)}
                    disabled={running}
                    className={
                      "px-2 py-1 rounded-lg border text-[11px] font-mono text-left transition-colors " +
                      (active
                        ? "bg-emerald-950/40 border-emerald-700/40 text-emerald-200 hover:bg-emerald-950/55"
                        : "bg-slate-900/30 border-slate-700/40 text-slate-200 hover:bg-slate-900/45")
                    }
                    title={active ? "Click to remove" : "Click to add"}
                  >
                    {active ? "✓ " : ""}{sym}
                  </button>
                );
              })}
            </div>

            {(klineInterval === "1m" || klineInterval === "5m") && selectedSymbols.length >= 12 && (
              <div className="mt-2 text-[10px] text-amber-200/90">
                ⚠️ Short interval + many coins can be slow / rate-limited. Tip: use 15m/1h or fewer symbols.
              </div>
            )}
          </div>
          <label className="text-[11px] text-slate-300">
            Interval (s)
            <input
              value={intervalSeconds}
              onChange={(e) => {
                setConfigDirty(true);
                setIntervalSeconds(Number(e.target.value));
              }}
              type="number"
              min={5}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>

          <label className="text-[11px] text-slate-300">
            Kline interval
            <select
              value={klineInterval}
              onChange={(e) => {
                setConfigDirty(true);
                setKlineInterval(e.target.value);
              }}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            >
              {[
                { v: "1m", label: "1m (casino)" },
                { v: "5m", label: "5m" },
                { v: "15m", label: "15m" },
                { v: "1h", label: "1h" },
                { v: "4h", label: "4h" },
                { v: "1d", label: "1d" },
              ].map((o) => (
                <option key={o.v} value={o.v}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-slate-300">
            Risk per trade
            <input
              value={riskPerTrade}
              onChange={(e) => {
                setConfigDirty(true);
                setRiskPerTrade(Number(e.target.value));
              }}
              type="number"
              step={0.001}
              min={0}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
            <div className="mt-1 text-[10px] text-slate-500">
              Tip: 0.02 = 2% of portfolio. Values &gt; 1 are treated as USD (ex: 60 = $60).
            </div>
          </label>
          <label className="text-[11px] text-slate-300">
            Min confidence
            <input
              value={minConfidence}
              onChange={(e) => {
                setConfigDirty(true);
                setMinConfidence(Number(e.target.value));
              }}
              type="number"
              step={0.01}
              min={0}
              max={1}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
            <div className="mt-1 text-[10px] text-slate-500">
              Only gates BUY/SELL (HOLD signals can still have confidence).
            </div>
          </label>

          <label className="text-[11px] text-slate-300">
            Max positions
            <input
              value={maxPositions}
              onChange={(e) => {
                setConfigDirty(true);
                setMaxPositions(Number(e.target.value));
              }}
              type="number"
              min={1}
              max={20}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>

          <label className="text-[11px] text-slate-300">
            Cooldown (s)
            <input
              value={cooldownSeconds}
              onChange={(e) => {
                setConfigDirty(true);
                setCooldownSeconds(Number(e.target.value));
              }}
              type="number"
              min={0}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>

          <label className="text-[11px] text-slate-300">
            Take profit (%)
            <input
              value={takeProfitPct}
              onChange={(e) => {
                setConfigDirty(true);
                setTakeProfitPct(Number(e.target.value));
              }}
              type="number"
              min={0}
              step={0.1}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>

          <label className="text-[11px] text-slate-300">
            Stop loss (%)
            <input
              value={stopLossPct}
              onChange={(e) => {
                setConfigDirty(true);
                setStopLossPct(Number(e.target.value));
              }}
              type="number"
              min={0}
              step={0.1}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>

          <label className="text-[11px] text-slate-300">
            Trailing stop (%)
            <input
              value={trailingStopPct}
              onChange={(e) => {
                setConfigDirty(true);
                setTrailingStopPct(Number(e.target.value));
              }}
              type="number"
              min={0}
              step={0.1}
              disabled={running}
              className="mt-1 w-full bg-slate-900/60 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white"
            />
          </label>

          <label className="text-[11px] text-slate-300">
            Aggression
            <input
              value={Math.round(aggression * 100)}
              onChange={(e) => {
                setConfigDirty(true);
                setAggression(Number(e.target.value) / 100);
              }}
              type="range"
              min={0}
              max={100}
              step={1}
              disabled={running}
              className="mt-2 w-full"
            />
            <div className="mt-1 text-[10px] text-slate-500">
              {Math.round(aggression * 100)} · Chill → Degenerate
            </div>
          </label>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={paperMode}
            onChange={(e) => {
              setConfigDirty(true);
              setPaperMode(e.target.checked);
            }}
            disabled={running}
          />
          Paper mode (recommended)
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="trading-card rounded-xl p-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <DollarSign className="w-3.5 h-3.5" /> Total
          </div>
          <div className="text-lg font-bold text-white">${totalUsd.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Cash: ${usdtCash.toLocaleString()}</div>
        </div>
        <div className="trading-card rounded-xl p-3">
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
        <div className="trading-card rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Positions</div>
          <div className="text-lg font-bold text-white">{Object.keys(positions).length}</div>
          <div className="text-[10px] text-slate-500">Last tick: {state?.last_tick_at || "—"}</div>
        </div>
      </div>

      <div className="trading-card rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
            <LineChart className="w-3.5 h-3.5 text-cyan-300" /> Market view
            <span className="text-[10px] text-slate-500 font-mono">· {priceChartSymbol || "—"}</span>
            {lastTickMs != null && (
              <span className="text-[10px] text-slate-500 font-mono">· tick {Math.round(lastTickMs)}ms</span>
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
              type="button"
              onClick={() => {
                if (autoFollow) {
                  setAutoFollow(false);
                } else {
                  setAutoFollow(true);
                  setRangeNowEpoch(Date.now());
                }
              }}
              className={
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border " +
                (autoFollow
                  ? "bg-emerald-950/20 text-emerald-200 border-emerald-700/30 hover:bg-emerald-950/35"
                  : "bg-slate-900/40 text-slate-200 border-slate-700/50 hover:bg-slate-900/60")
              }
              title={autoFollow ? "Frys range (stannar i tiden)" : "Hoppa till nu och följ marknaden"}
            >
              <Activity className="w-3.5 h-3.5" />
              {autoFollow ? "Följer" : "Fryst"}
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

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-3">
          <div className="space-y-3">
            <div className="bg-slate-950/30 border border-slate-700/40 rounded-xl p-2 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Price</div>
                  {priceMeta && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      <span>{fmtUsd(priceMeta.price)}</span>
                      {typeof priceMeta.deltaPct === "number" && typeof priceMeta.delta === "number" && (
                        <span className={priceMeta.delta >= 0 ? "text-emerald-200" : "text-red-200"}>
                          {" "}({priceMeta.delta >= 0 ? "+" : ""}{priceMeta.deltaPct.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-wrap justify-end">
                  <select
                    value={priceChartSymbol}
                    onChange={(e) => setPriceChartSymbol(e.target.value)}
                    aria-label="Price chart symbol"
                    title="Välj symbol"
                    className="bg-slate-950/40 border border-slate-700/50 rounded-lg px-2 py-1 text-[11px] text-white"
                  >
                    {symbolList
                      .filter(Boolean)
                      .map((sym) => (
                        <option key={sym} value={sym}>{sym}</option>
                      ))}
                  </select>

                  <select
                    value={String(priceTimeframeMs)}
                    onChange={(e) => setPriceTimeframeMs(Number(e.target.value) || 60_000)}
                    aria-label="Price chart timeframe"
                    title="Candle timeframe (OHLC)"
                    className="bg-slate-950/40 border border-slate-700/50 rounded-lg px-2 py-1 text-[11px] text-white"
                  >
                    <option value={1_000}>1s</option>
                    <option value={5_000}>5s</option>
                    <option value={15_000}>15s</option>
                    <option value={60_000}>1m</option>
                    <option value={300_000}>5m</option>
                    <option value={900_000}>15m</option>
                    <option value={3_600_000}>1h</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="segmented" aria-label="Chart mode">
                  <button
                    type="button"
                    onClick={() => {
                      setPriceChartMode("candles");
                      setPriceValueMode("price");
                    }}
                    className={"segmented-btn " + (priceChartMode === "candles" ? "segmented-btn-active" : "")}
                  >
                    Candles
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceChartMode("line")}
                    className={"segmented-btn " + (priceChartMode === "line" ? "segmented-btn-active" : "")}
                  >
                    Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceChartMode("area")}
                    className={"segmented-btn " + (priceChartMode === "area" ? "segmented-btn-active" : "")}
                  >
                    Area
                  </button>
                </div>

                <div className="segmented" aria-label="Value mode">
                  <button
                    type="button"
                    onClick={() => setPriceValueMode("price")}
                    className={"segmented-btn " + (priceValueMode === "price" ? "segmented-btn-active" : "")}
                  >
                    Price
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceValueMode("pct");
                      if (priceChartMode === "candles") setPriceChartMode("line");
                    }}
                    className={"segmented-btn " + (priceValueMode === "pct" ? "segmented-btn-active" : "")}
                  >
                    %
                  </button>
                </div>

                <div className="segmented" aria-label="Scale">
                  <button
                    type="button"
                    onClick={() => setPriceScale("linear")}
                    className={"segmented-btn " + (priceScale === "linear" ? "segmented-btn-active" : "")}
                  >
                    Lin
                  </button>
                  <button
                    type="button"
                    disabled={priceChartMode === "candles" || priceValueMode === "pct"}
                    onClick={() => setPriceScale("log")}
                    className={
                      "segmented-btn " +
                      (priceScale === "log" ? "segmented-btn-active" : "") +
                      ((priceChartMode === "candles" || priceValueMode === "pct") ? " opacity-40 cursor-not-allowed" : "")
                    }
                    title={(priceChartMode === "candles" || priceValueMode === "pct") ? "Log scale stöds ej för candles/%" : "Log scale"}
                  >
                    Log
                  </button>
                </div>

                <div className="segmented" aria-label="Range">
                  {[15 * 60_000, 60 * 60_000, 4 * 60 * 60_000, 24 * 60 * 60_000].map((ms) => (
                    <button
                      key={ms}
                      type="button"
                      onClick={() => setPriceRangeMs(ms)}
                      className={"segmented-btn " + (priceRangeMs === ms ? "segmented-btn-active" : "")}
                    >
                      {ms === 15 * 60_000 ? "15m" : ms === 60 * 60_000 ? "1h" : ms === 4 * 60 * 60_000 ? "4h" : "24h"}
                    </button>
                  ))}
                </div>
              </div>

              {priceChartMode === "candles" ? (
                <MiniCandleChart
                  candles={priceCandles}
                  maxCandles={220}
                  height={220}
                />
              ) : (
                <MiniTimeSeriesChart
                  lines={priceLine}
                  maxPoints={420}
                  height={220}
                  colorByDelta
                  fill={priceChartMode === "area"}
                  yScale={priceScale}
                  formatY={priceValueMode === "pct" ? (n) => fmtPct(n, 2) : fmtUsd}
                />
              )}

              <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between gap-2">
                <span>
                  Källa: <span className="font-mono">market_prices</span> · {marketIsLive ? "live" : "stale"} {marketAgeLabel}
                </span>
                <span className="font-mono">pts {priceSeries.length}</span>
              </div>
            </div>

            <div className="bg-slate-950/30 border border-slate-700/40 rounded-xl p-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Equity</div>
                {equityStats && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    PnL <span className={equityStats.pnlPct >= 0 ? "text-emerald-200" : "text-red-200"}>{fmtPct(equityStats.pnlPct, 2)}</span>
                    <span className="ml-2">DD <span className="text-amber-200">{fmtPct(-equityStats.drawdownPct, 2)}</span></span>
                  </div>
                )}
              </div>
              <MiniTimeSeriesChart
                lines={equityLines}
                maxPoints={320}
                height={140}
                showAxis={false}
              />
            </div>
          </div>

          <div className="bg-slate-950/30 border border-slate-700/40 rounded-xl p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Watchlist</div>
              <div className="text-[10px] text-slate-500 font-mono">{watchRows.length}</div>
            </div>
            <div className="mt-2 space-y-2 max-h-[420px] overflow-auto pr-1">
              {watchRows.map((row) => {
                const selected = row.sym === priceChartSymbol;
                const dp = row.deltaPct;
                return (
                  <button
                    key={row.sym}
                    type="button"
                    onClick={() => setPriceChartSymbol(row.sym)}
                    className={
                      "w-full text-left rounded-xl border p-2 transition-colors " +
                      (selected
                        ? "bg-slate-900/60 border-cyan-500/40"
                        : "bg-slate-950/20 border-slate-700/40 hover:bg-slate-900/40")
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-200 font-semibold tracking-wide">{row.sym}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-[11px] text-slate-200 font-mono">{row.lastPrice != null ? fmtUsd(row.lastPrice) : "—"}</div>
                        <div className={
                          "text-[11px] font-mono " +
                          (dp == null ? "text-slate-500" : dp >= 0 ? "text-emerald-200" : "text-red-200")
                        }>
                          {dp == null ? "—" : fmtPct(dp, 2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1">
                      <MiniCandleChart
                        candles={row.candles}
                        height={48}
                        maxCandles={48}
                        showAxis={false}
                        interactive={false}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {Object.keys(positions).length > 0 && (
          <div className="bg-slate-950/30 border border-slate-700/40 rounded-xl p-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Exposure</div>
            <div className="space-y-1">
              {Object.entries(positions)
                .map(([sym, p]) => ({ sym, val: Number(p?.value_usd ?? 0), pct: totalUsd > 0 ? (Number(p?.value_usd ?? 0) / totalUsd) * 100 : 0 }))
                .sort((a, b) => b.val - a.val)
                .slice(0, 10)
                .map((row) => (
                  <div key={row.sym} className="grid grid-cols-[72px_1fr_52px] gap-2 items-center text-[11px]">
                    <div className="text-slate-300 font-medium truncate">{row.sym}</div>
                    <svg viewBox="0 0 100 6" width="100%" height="8" preserveAspectRatio="none" className="block">
                      <rect x="0" y="0" width="100" height="6" rx="3" fill="rgba(30,41,59,1)" />
                      <rect x="0" y="0" width={clamp(row.pct, 0, 100)} height="6" rx="3" fill="rgba(34,211,238,0.65)" />
                    </svg>
                    <div className="text-slate-400 font-mono text-right">{row.pct.toFixed(1)}%</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {Object.keys(positions).length > 0 && (
        <div className="trading-card rounded-xl p-3">
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
        <div className="trading-card rounded-xl p-3">
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

      <div className="trading-card rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            <MessageSquareText className="w-3.5 h-3.5" /> Strategi med Frankenstein
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-[11px] text-slate-300">
            <input
              type="checkbox"
              checked={allowAiExecution}
              onChange={(e) => setAllowAiExecution(e.target.checked)}
              disabled={running}
            />
            AI execution (paper-only)
          </label>
          <div className="text-[10px] text-slate-500">AI kan föreslå en burst-plan → du trycker Execute.</div>
        </div>

        {pendingBurstPlanError && (
          <div className="text-[11px] text-amber-200 bg-amber-950/25 border border-amber-700/30 rounded-lg px-2 py-1">
            Burst parse: {pendingBurstPlanError}
          </div>
        )}

        {pendingBurstPlan && (
          <div className="bg-slate-950/40 border border-slate-700/40 rounded-lg p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Burst plan</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={executeBurstPlan}
                  disabled={actionBusy !== null || running || !allowAiExecution}
                  className="px-2 py-0.5 rounded-md bg-emerald-900/50 border border-emerald-700/40 text-emerald-200 hover:bg-emerald-900/70 text-[10px] disabled:opacity-50"
                  title="Startar trader med targetOrderCount och stoppar automatiskt"
                >
                  Execute
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingBurstPlan(null);
                    setPendingBurstPlanError(null);
                  }}
                  disabled={actionBusy !== null}
                  className="px-2 py-0.5 rounded-md bg-slate-900/50 border border-slate-700/50 text-slate-200 hover:bg-slate-900/70 text-[10px] disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="mt-1 text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
              targetOrderCount={pendingBurstPlan.targetOrderCount}
              {pendingBurstPlan.maxRuntimeSeconds != null ? `  maxRuntimeSeconds=${pendingBurstPlan.maxRuntimeSeconds}` : ""}
              {pendingBurstPlan.symbolMode ? `  symbolMode=${pendingBurstPlan.symbolMode}` : ""}
              {pendingBurstPlan.randomCount != null ? `  randomCount=${pendingBurstPlan.randomCount}` : ""}
              {pendingBurstPlan.klineInterval ? `\nklines=${pendingBurstPlan.klineInterval}` : ""}
              {pendingBurstPlan.aggression != null ? `  aggression=${pendingBurstPlan.aggression}` : ""}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              Obs: "20 ordrar" betyder upp till 20 fyllda BUY/SELL enligt botens signaler. Den kan stoppa tidigare om maxRuntimeSeconds nås.
            </div>
          </div>
        )}

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
