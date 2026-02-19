import { useState, useEffect, useCallback } from "react";
import { BRIDGE_URL } from "../config";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Clock, DollarSign,
  Zap, Download, RefreshCw, Activity, Brain, ChevronDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface ModelAnalytics {
  model: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  avgQuality: number;
  qualityCount: number;
  avgTokensPerRequest: number;
  peakHour: number;
  firstUsed: string;
  lastUsed: string;
}

interface HeatmapCell {
  dayOfWeek: number;
  hourOfDay: number;
  requests: number;
  tokens: number;
  costUsd: number;
}

interface CostForecast {
  currentDailyAvg: number;
  projectedWeekly: number;
  projectedMonthly: number;
  trend: "increasing" | "decreasing" | "stable";
  trendPercent: number;
  confidence: number;
}

interface SessionStats {
  totalSessions: number;
  avgSessionDurationMin: number;
  avgMessagesPerSession: number;
  longestSessionMin: number;
  mostActiveDay: string;
  mostActiveHour: number;
}

interface HourlyBucket {
  hour: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
  avgLatencyMs: number;
}

interface DailyCost {
  date: string;
  costUsd: number;
  model: string;
}

interface AnalyticsOverview {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  avgQuality: number;
  models: ModelAnalytics[];
  heatmap: HeatmapCell[];
  forecast: CostForecast;
  sessions: SessionStats;
  hourlyTrend: HourlyBucket[];
  dailyCosts: DailyCost[];
}

// ─── Helpers ─────────────────────────────────────────────────

const MODEL_COLORS: Record<string, string> = {
  claude: "#D97706",
  gemini: "#2563EB",
  deepseek: "#059669",
  grok: "#DC2626",
  ollama: "#7C3AED",
  frankenstein: "#10B981",
};

const DAY_LABELS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

// ─── Component ───────────────────────────────────────────────

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [heatmapMetric, setHeatmapMetric] = useState<"requests" | "tokens" | "costUsd">("requests");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BRIDGE_URL}/api/analytics/overview?days=${days}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-slate-400 py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Ingen analytik-data ännu. Börja chatta för att generera data.</p>
      </div>
    );
  }

  const { forecast, sessions, models } = data;

  // Heatmap: find max for color scaling
  const heatmapMax = Math.max(1, ...data.heatmap.map(c => c[heatmapMetric]));

  // Daily cost chart: aggregate by date
  const dailyCostAgg: Record<string, Record<string, number>> = {};
  for (const dc of data.dailyCosts) {
    if (!dailyCostAgg[dc.date]) dailyCostAgg[dc.date] = {};
    dailyCostAgg[dc.date][dc.model] = (dailyCostAgg[dc.date][dc.model] || 0) + dc.costUsd;
  }
  const dailyCostDates = Object.keys(dailyCostAgg).sort().slice(-14);
  const maxDailyCost = Math.max(0.001, ...dailyCostDates.map(d =>
    Object.values(dailyCostAgg[d]).reduce((s, v) => s + v, 0)
  ));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Conversation Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(parseInt(e.target.value))}
            className="bg-slate-700 text-sm rounded px-2 py-1 border border-slate-600"
          >
            <option value={7}>7 dagar</option>
            <option value={14}>14 dagar</option>
            <option value={30}>30 dagar</option>
            <option value={90}>90 dagar</option>
          </select>
          <button
            onClick={fetchData}
            className="p-1.5 rounded bg-slate-700 hover:bg-slate-600"
            title="Uppdatera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={`${BRIDGE_URL}/api/analytics/export/csv`}
            download
            className="p-1.5 rounded bg-slate-700 hover:bg-slate-600"
            title="Exportera CSV"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Totalt anrop"
          value={formatNumber(data.totalRequests)}
          icon={<Zap className="w-4 h-4" />}
          color="text-blue-400"
        />
        <KpiCard
          label="Totalt tokens"
          value={formatNumber(data.totalTokens)}
          icon={<Activity className="w-4 h-4" />}
          color="text-green-400"
        />
        <KpiCard
          label="Total kostnad"
          value={formatCost(data.totalCostUsd)}
          icon={<DollarSign className="w-4 h-4" />}
          color="text-yellow-400"
        />
        <KpiCard
          label="Snitt latens"
          value={`${data.avgLatencyMs}ms`}
          icon={<Clock className="w-4 h-4" />}
          color="text-purple-400"
        />
      </div>

      {/* Cost Forecast */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Kostnadsprognos
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <div className="text-xs text-slate-500">Dagligt snitt</div>
            <div className="text-lg font-bold">{formatCost(forecast.currentDailyAvg)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Projicerat/vecka</div>
            <div className="text-lg font-bold">{formatCost(forecast.projectedWeekly)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Projicerat/månad</div>
            <div className="text-lg font-bold">{formatCost(forecast.projectedMonthly)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">Trend:</span>
          {forecast.trend === "increasing" && (
            <span className="text-red-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +{forecast.trendPercent}%/vecka
            </span>
          )}
          {forecast.trend === "decreasing" && (
            <span className="text-green-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> {forecast.trendPercent}%/vecka
            </span>
          )}
          {forecast.trend === "stable" && (
            <span className="text-slate-400 flex items-center gap-1">
              <Minus className="w-3.5 h-3.5" /> Stabil
            </span>
          )}
          <span className="text-slate-500 text-xs ml-2">
            (konfidens: {Math.round(forecast.confidence * 100)}%)
          </span>
        </div>
      </div>

      {/* Daily Cost Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Daglig kostnad (senaste 14 dagar)
        </h3>
        <div className="flex items-end gap-1 h-32">
          {dailyCostDates.map(date => {
            const modelCosts = dailyCostAgg[date] || {};
            const total = Object.values(modelCosts).reduce((s, v) => s + v, 0);
            const height = (total / maxDailyCost) * 100;
            return (
              <div
                key={date}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className="w-full rounded-t transition-all"
                  style={{ height: `${Math.max(2, height)}%` }}
                >
                  {/* Stacked bar */}
                  {Object.entries(modelCosts).map(([model, cost]) => (
                    <div
                      key={model}
                      className="w-full"
                      style={{
                        height: `${(cost / total) * 100}%`,
                        backgroundColor: MODEL_COLORS[model] || "#64748b",
                        minHeight: "2px",
                      }}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {date.slice(8)}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                  {date}: {formatCost(total)}
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2">
          {models.map(m => (
            <div key={m.model} className="flex items-center gap-1 text-xs">
              <div
                className="w-2.5 h-2.5 rounded"
                style={{ backgroundColor: MODEL_COLORS[m.model] || "#64748b" }}
              />
              <span className="text-slate-400 capitalize">{m.model}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Modelljämförelse
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs">
                <th className="text-left py-1.5 px-2">Modell</th>
                <th className="text-right py-1.5 px-2">Anrop</th>
                <th className="text-right py-1.5 px-2">Tokens</th>
                <th className="text-right py-1.5 px-2">Latens</th>
                <th className="text-right py-1.5 px-2">Kostnad</th>
                <th className="text-right py-1.5 px-2">$/1K tok</th>
                <th className="text-right py-1.5 px-2">Kvalitet</th>
              </tr>
            </thead>
            <tbody>
              {models.map(m => (
                <tr key={m.model} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-2 px-2 flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: MODEL_COLORS[m.model] || "#64748b" }}
                    />
                    <span className="capitalize font-medium">{m.model}</span>
                  </td>
                  <td className="text-right py-2 px-2">{formatNumber(m.totalRequests)}</td>
                  <td className="text-right py-2 px-2">{formatNumber(m.totalInputTokens + m.totalOutputTokens)}</td>
                  <td className="text-right py-2 px-2">{m.avgLatencyMs}ms</td>
                  <td className="text-right py-2 px-2">{formatCost(m.totalCostUsd)}</td>
                  <td className="text-right py-2 px-2">
                    {m.totalInputTokens + m.totalOutputTokens > 0
                      ? formatCost((m.totalCostUsd / (m.totalInputTokens + m.totalOutputTokens)) * 1000)
                      : "-"}
                  </td>
                  <td className="text-right py-2 px-2">
                    {m.qualityCount > 0 ? `${m.avgQuality.toFixed(1)}/5` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Aktivitets-heatmap
          </h3>
          <select
            value={heatmapMetric}
            onChange={e => setHeatmapMetric(e.target.value as typeof heatmapMetric)}
            className="bg-slate-700 text-xs rounded px-2 py-1 border border-slate-600"
          >
            <option value="requests">Anrop</option>
            <option value="tokens">Tokens</option>
            <option value="costUsd">Kostnad</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: "40px repeat(24, 1fr)" }}>
            {/* Hour labels */}
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-[9px] text-slate-500 text-center">
                {h.toString().padStart(2, "0")}
              </div>
            ))}
            {/* Rows */}
            {Array.from({ length: 7 }, (_, dow) => (
              <>
                <div key={`label-${dow}`} className="text-[10px] text-slate-500 flex items-center">
                  {DAY_LABELS[dow]}
                </div>
                {Array.from({ length: 24 }, (_, hour) => {
                  const cell = data.heatmap.find(c => c.dayOfWeek === dow && c.hourOfDay === hour);
                  const value = cell ? cell[heatmapMetric] : 0;
                  const intensity = value / heatmapMax;
                  return (
                    <div
                      key={`${dow}-${hour}`}
                      className="aspect-square rounded-sm transition-colors"
                      style={{
                        backgroundColor: intensity > 0
                          ? `rgba(59, 130, 246, ${Math.max(0.1, intensity)})`
                          : "rgba(51, 65, 85, 0.3)",
                      }}
                      title={`${DAY_LABELS[dow]} ${hour}:00 — ${heatmapMetric === "costUsd" ? formatCost(value) : formatNumber(value)}`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Sessionsstatistik
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatItem label="Totalt sessioner" value={sessions.totalSessions.toString()} />
          <StatItem label="Snitt längd" value={`${sessions.avgSessionDurationMin} min`} />
          <StatItem label="Snitt meddelanden" value={sessions.avgMessagesPerSession.toString()} />
          <StatItem label="Längsta session" value={`${sessions.longestSessionMin} min`} />
          <StatItem label="Mest aktiv dag" value={sessions.mostActiveDay || "-"} />
          <StatItem label="Mest aktiv timme" value={`${sessions.mostActiveHour}:00`} />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function KpiCard({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
      <div className={`flex items-center gap-1.5 text-xs ${color} mb-1`}>
        {icon}
        {label}
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
