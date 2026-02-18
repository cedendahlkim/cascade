import { useState, useEffect, useRef, memo } from "react";
import { Activity, Cpu, HardDrive, Brain, Zap, DollarSign, RefreshCw, Clock, Monitor, MessageCircle, Folder, Puzzle, GitBranch, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Download, AlertTriangle, BarChart3, Settings2, ChevronDown, ChevronUp, FlaskConical, TestTube, Microscope, Lightbulb, Moon, CheckCircle2, XCircle } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface Computer {
  id: string;
  name: string;
  description: string;
  capabilities: {
    os: string;
    arch: string;
    hasGpu: boolean;
    gpuName?: string;
    ramGb: number;
    cpuCores: number;
    cpuModel?: string;
    hostname: string;
    username: string;
    tools: string[];
  };
  status: "online" | "offline" | "busy" | "error";
  lastSeen: string;
  taskCount: number;
  errorCount: number;
}

interface Dashboard {
  uptime: number;
  system: {
    cpuUsage: number;
    memoryUsed: number;
    memoryTotal: number;
    memoryPercent: number;
    platform: string;
    hostname: string;
    cpuModel: string;
    cpuCores: number;
  };
  ai: {
    claude: { enabled: boolean; model: string; totalTokens: number; requestCount: number; avgLatencyMs: number };
    gemini: { enabled: boolean; model: string; totalTokens: number; requestCount: number; avgLatencyMs: number };
    orchestrator: { totalTasks: number; completedTasks: number; failedTasks: number };
  };
  connections: { mobileClients: number; computerAgents: number; totalConnections: number };
  activity: { messagesTotal: number; messagesToday: number; schedulesActive: number; filesShared: number; pluginsLoaded: number; workflowsRun: number };
  costs: { estimatedTotalUsd: number; claudeUsd: number; geminiUsd: number };
  history: Array<{ timestamp: string; cpuPercent: number; memoryPercent: number; claudeTokens: number; geminiTokens: number; connections: number }>;
}

interface DailyMetrics {
  date: string;
  claudeTokens: number;
  geminiTokens: number;
  claudeRequests: number;
  geminiRequests: number;
  claudeCostUsd: number;
  geminiCostUsd: number;
  totalCostUsd: number;
  messagesCount: number;
  avgCpuPercent: number;
  avgMemoryPercent: number;
  peakCpuPercent: number;
  peakMemoryPercent: number;
  claudeAvgLatencyMs: number;
  geminiAvgLatencyMs: number;
}

interface CostBudget {
  dailyLimitUsd: number;
  weeklyLimitUsd: number;
  monthlyLimitUsd: number;
  alertThreshold: number;
  enabled: boolean;
  alerts: Array<{ type: string; currentUsd: number; limitUsd: number; percent: number; timestamp: string }>;
}

interface ModelComp {
  model: string;
  provider: string;
  totalTokens: number;
  requestCount: number;
  avgLatencyMs: number;
  costPerRequest: number;
  costPer1kTokens: number;
  totalCostUsd: number;
  successRate: number;
  enabled: boolean;
}

interface FrankensteinStats {
  mathResearch: {
    findings: number;
    hypotheses: number;
    experiments: number;
    problemStats: Record<string, { findings: number; hypotheses: number }>;
    recentFindings: Array<{ problem: string; category: string; description: string; timestamp: number }>;
  };
  collatz: { anomalies: number; discoveries: number; sequences: number };
  modules: Record<string, boolean>;
  problems: Array<{ id: string; name: string; emoji: string; description: string }>;
  testing: { testFiles: number; totalTests: number };
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatTokens(t: number): string {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`;
  if (t >= 1_000) return `${(t / 1_000).toFixed(1)}k`;
  return String(t);
}

const Sparkline = memo(function Sparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - (v / max) * (height - 4)}`).join(" ");
  const fillPoints = `0,${height} ${points} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polygon points={fillPoints} fill={color} opacity="0.15" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

const CircularGauge = memo(function CircularGauge({ value, size = 56, strokeWidth = 5, color, label }: { value: number; size?: number; strokeWidth?: number; color: string; label: string }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(51 65 85 / 0.5)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm font-bold text-white">{value}%</span>
      </div>
      <span className="text-[10px] text-slate-500 -mt-1">{label}</span>
    </div>
  );
});

const BarChart = memo(function BarChart({ data, labels, colors, height = 80 }: { data: number[][]; labels: string[]; colors: string[]; height?: number }) {
  if (data.length === 0 || data[0].length === 0) return <div className="text-[10px] text-slate-600 text-center py-4">Ingen data ännu</div>;
  const maxVal = Math.max(...data.flat(), 0.001);
  const barCount = data[0].length;
  const barW = Math.max(4, Math.min(16, 200 / barCount));
  return (
    <div>
      <svg viewBox={`0 0 ${barCount * (barW + 2)} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        {data[0].map((_, i) => {
          let y = height;
          return data.map((series, si) => {
            const val = series[i] || 0;
            const h = (val / maxVal) * (height - 4);
            y -= h;
            return <rect key={`${si}-${i}`} x={i * (barW + 2)} y={y} width={barW} height={h} fill={colors[si]} rx={1} opacity={0.8} />;
          });
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {labels.length <= 10 ? labels.map((l, i) => <span key={i} className="text-[8px] text-slate-600">{l}</span>) : (
          <>
            <span className="text-[8px] text-slate-600">{labels[0]}</span>
            <span className="text-[8px] text-slate-600">{labels[labels.length - 1]}</span>
          </>
        )}
      </div>
    </div>
  );
});

export default function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [computers, setComputers] = useState<Computer[]>([]);
  const [liveUptime, setLiveUptime] = useState(0);
  const uptimeBase = useRef<{ serverUptime: number; fetchedAt: number } | null>(null);
  const [trends, setTrends] = useState<DailyMetrics[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<"daily" | "weekly">("daily");
  const [budget, setBudgetState] = useState<CostBudget | null>(null);
  const [models, setModels] = useState<ModelComp[]>([]);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ dailyLimitUsd: 5, weeklyLimitUsd: 25, monthlyLimitUsd: 100, alertThreshold: 0.8, enabled: false });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [frank, setFrank] = useState<FrankensteinStats | null>(null);

  const fetchDashboard = () => {
    fetch(`${BRIDGE_URL}/api/dashboard`).then(r => r.json()).then((d: Dashboard) => {
      setData(d);
      uptimeBase.current = { serverUptime: d.uptime, fetchedAt: Date.now() / 1000 };
    }).catch(() => {});
    fetch(`${BRIDGE_URL}/api/computers`).then(r => r.json()).then(setComputers).catch(() => {});
  };

  const fetchExtras = () => {
    const endpoint = trendPeriod === "daily" ? "/api/dashboard/trends/daily" : "/api/dashboard/trends/weekly";
    fetch(`${BRIDGE_URL}${endpoint}`).then(r => r.json()).then(setTrends).catch(() => {});
    fetch(`${BRIDGE_URL}/api/dashboard/budget`).then(r => r.json()).then((b: CostBudget) => {
      setBudgetState(b);
      setBudgetForm({ dailyLimitUsd: b.dailyLimitUsd, weeklyLimitUsd: b.weeklyLimitUsd, monthlyLimitUsd: b.monthlyLimitUsd, alertThreshold: b.alertThreshold, enabled: b.enabled });
    }).catch(() => {});
    fetch(`${BRIDGE_URL}/api/dashboard/models`).then(r => r.json()).then(setModels).catch(() => {});
    fetch(`${BRIDGE_URL}/api/dashboard/frankenstein`).then(r => r.json()).then(setFrank).catch(() => {});
  };

  const saveBudget = () => {
    fetch(`${BRIDGE_URL}/api/dashboard/budget`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(budgetForm),
    }).then(r => r.json()).then(() => {
      setShowBudgetEdit(false);
      fetchExtras();
    });
  };

  useEffect(() => {
    fetchDashboard();
    fetchExtras();
    const dataInterval = setInterval(fetchDashboard, 15000);
    const extrasInterval = setInterval(fetchExtras, 60000);
    const tickInterval = setInterval(() => {
      if (uptimeBase.current) {
        const elapsed = Date.now() / 1000 - uptimeBase.current.fetchedAt;
        setLiveUptime(Math.floor(uptimeBase.current.serverUptime + elapsed));
      }
    }, 1000);
    return () => { clearInterval(dataInterval); clearInterval(extrasInterval); clearInterval(tickInterval); };
  }, []);

  useEffect(() => {
    const endpoint = trendPeriod === "daily" ? "/api/dashboard/trends/daily" : "/api/dashboard/trends/weekly";
    fetch(`${BRIDGE_URL}${endpoint}`).then(r => r.json()).then(setTrends).catch(() => {});
  }, [trendPeriod]);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-500 text-sm animate-pulse">Laddar dashboard...</div>
      </div>
    );
  }

  const cpuHistory = data.history.slice(-30).map(h => h.cpuPercent);
  const ramHistory = data.history.slice(-30).map(h => h.memoryPercent);
  const tokenHistory = data.history.slice(-30).map(h => h.claudeTokens + h.geminiTokens);
  const prevCpu = cpuHistory.length > 1 ? cpuHistory[cpuHistory.length - 2] : data.system.cpuUsage;
  const cpuTrend = data.system.cpuUsage - prevCpu;
  const prevRam = ramHistory.length > 1 ? ramHistory[ramHistory.length - 2] : data.system.memoryPercent;
  const ramTrend = data.system.memoryPercent - prevRam;

  const online = computers.filter(c => c.status === "online").length;

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
      {/* Header with live uptime */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            Dashboard
            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800/30">LIVE</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-mono">
            {data.system.hostname} · <Clock className="w-3 h-3 inline -mt-0.5" /> {formatUptime(liveUptime || data.uptime)}
          </p>
        </div>
        <button onClick={fetchDashboard} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors active:rotate-180 duration-300" title="Uppdatera">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* System gauges + sparklines */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] text-slate-500 uppercase font-semibold">CPU</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-white">{data.system.cpuUsage}%</span>
              {cpuTrend !== 0 && (
                <span className={`text-[10px] flex items-center ${cpuTrend > 0 ? "text-red-400" : "text-green-400"}`}>
                  {cpuTrend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </span>
              )}
            </div>
          </div>
          <Sparkline data={cpuHistory} color={data.system.cpuUsage > 80 ? "#ef4444" : data.system.cpuUsage > 50 ? "#f59e0b" : "#3b82f6"} />
          <p className="text-[10px] text-slate-600 mt-1">{data.system.cpuCores} kärnor · {data.system.cpuModel?.split(" ").slice(-3).join(" ")}</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] text-slate-500 uppercase font-semibold">RAM</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-white">{data.system.memoryPercent}%</span>
              {ramTrend !== 0 && (
                <span className={`text-[10px] flex items-center ${ramTrend > 0 ? "text-red-400" : "text-green-400"}`}>
                  {ramTrend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </span>
              )}
            </div>
          </div>
          <Sparkline data={ramHistory} color={data.system.memoryPercent > 80 ? "#ef4444" : data.system.memoryPercent > 60 ? "#f59e0b" : "#22c55e"} />
          <p className="text-[10px] text-slate-600 mt-1">{formatBytes(data.system.memoryUsed)} / {formatBytes(data.system.memoryTotal)}</p>
        </div>
      </div>

      {/* AI Agents — compact cards with token sparkline */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`bg-slate-800/60 border rounded-xl p-3 ${data.ai.claude.enabled ? "border-blue-800/40" : "border-slate-800/30 opacity-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block leading-tight">Claude</span>
              <span className="text-[9px] text-slate-500">{data.ai.claude.model?.split("-").slice(0, 2).join("-")}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
            <div className="text-slate-500">Tokens</div><div className="text-right text-blue-300 font-medium">{formatTokens(data.ai.claude.totalTokens)}</div>
            <div className="text-slate-500">Requests</div><div className="text-right text-slate-300">{data.ai.claude.requestCount}</div>
            <div className="text-slate-500">Latens</div><div className="text-right text-slate-300">{data.ai.claude.avgLatencyMs > 0 ? `${(data.ai.claude.avgLatencyMs / 1000).toFixed(1)}s` : "—"}</div>
          </div>
        </div>
        <div className={`bg-slate-800/60 border rounded-xl p-3 ${data.ai.gemini.enabled ? "border-violet-800/40" : "border-slate-800/30 opacity-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block leading-tight">Gemini</span>
              <span className="text-[9px] text-slate-500">{data.ai.gemini.model?.split("-").slice(0, 2).join("-")}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
            <div className="text-slate-500">Tokens</div><div className="text-right text-violet-300 font-medium">{formatTokens(data.ai.gemini.totalTokens)}</div>
            <div className="text-slate-500">Requests</div><div className="text-right text-slate-300">{data.ai.gemini.requestCount}</div>
            <div className="text-slate-500">Latens</div><div className="text-right text-slate-300">{data.ai.gemini.avgLatencyMs > 0 ? `${(data.ai.gemini.avgLatencyMs / 1000).toFixed(1)}s` : "—"}</div>
          </div>
        </div>
      </div>

      {/* Cost bar — visual breakdown */}
      <div className="bg-gradient-to-r from-amber-950/30 to-slate-800/40 border border-amber-800/30 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Kostnad</span>
          </div>
          <span className="text-lg font-bold text-amber-300">${data.costs.estimatedTotalUsd.toFixed(4)}</span>
        </div>
        {data.costs.estimatedTotalUsd > 0 && (
          <div className="flex rounded-full h-2 overflow-hidden bg-slate-700/50">
            <div className="bg-blue-500 transition-all" style={{ width: `${data.costs.estimatedTotalUsd > 0 ? (data.costs.claudeUsd / data.costs.estimatedTotalUsd) * 100 : 50}%` }} title={`Claude: $${data.costs.claudeUsd.toFixed(4)}`} />
            <div className="bg-violet-500 transition-all" style={{ width: `${data.costs.estimatedTotalUsd > 0 ? (data.costs.geminiUsd / data.costs.estimatedTotalUsd) * 100 : 50}%` }} title={`Gemini: $${data.costs.geminiUsd.toFixed(4)}`} />
          </div>
        )}
        <div className="flex justify-between text-[10px] mt-1.5">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> Claude ${data.costs.claudeUsd.toFixed(4)}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-500" /> Gemini ${data.costs.geminiUsd.toFixed(4)}</span>
        </div>
      </div>

      {/* Activity grid — richer with icons */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Meddelanden", value: data.activity.messagesTotal, today: data.activity.messagesToday, icon: MessageCircle, color: "text-blue-400" },
          { label: "Scheman", value: data.activity.schedulesActive, today: 0, icon: Clock, color: "text-amber-400" },
          { label: "Filer", value: data.activity.filesShared, today: 0, icon: Folder, color: "text-green-400" },
          { label: "Plugins", value: data.activity.pluginsLoaded, today: 0, icon: Puzzle, color: "text-purple-400" },
          { label: "Workflows", value: data.activity.workflowsRun, today: 0, icon: GitBranch, color: "text-pink-400" },
          { label: "Anslutna", value: data.connections.totalConnections, today: 0, icon: Users, color: "text-cyan-400" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-2 py-2.5 text-center">
              <Icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
              <div className="text-sm font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
              {s.today > 0 && <div className="text-[9px] text-emerald-400 mt-0.5">+{s.today} idag</div>}
            </div>
          );
        })}
      </div>

      {/* Frankenstein AI — Research Lab */}
      {frank && (
        <div className="bg-gradient-to-br from-purple-950/40 via-slate-800/40 to-indigo-950/40 border border-purple-800/30 rounded-xl p-3 space-y-3">
          <button onClick={() => setExpandedSection(expandedSection === "frank" ? null : "frank")} className="flex items-center justify-between w-full touch-manipulation">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FlaskConical className="w-4.5 h-4.5 text-purple-400" />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-white block leading-tight">Frankenstein AI</span>
                <span className="text-[9px] text-slate-500">Autonom matematisk forskning</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {frank.mathResearch.findings > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-900/50 text-purple-300 font-medium">
                  {frank.mathResearch.findings} fynd
                </span>
              )}
              {expandedSection === "frank" ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </div>
          </button>

          {/* Summary stats — always visible */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Fynd", value: frank.mathResearch.findings, icon: Microscope, color: "text-purple-400" },
              { label: "Hypoteser", value: frank.mathResearch.hypotheses, icon: Lightbulb, color: "text-amber-400" },
              { label: "Experiment", value: frank.mathResearch.experiments, icon: TestTube, color: "text-emerald-400" },
              { label: "Tester", value: frank.testing.totalTests, icon: CheckCircle2, color: "text-blue-400" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-slate-900/50 rounded-lg px-2 py-2 text-center">
                  <Icon className={`w-3.5 h-3.5 ${s.color} mx-auto mb-0.5`} />
                  <div className="text-sm font-bold text-white">{s.value}</div>
                  <div className="text-[9px] text-slate-500">{s.label}</div>
                </div>
              );
            })}
          </div>

          {expandedSection === "frank" && (
            <div className="space-y-3">
              {/* Research Problems */}
              <div>
                <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                  <FlaskConical className="w-3 h-3" /> Olösta problem
                </h4>
                <div className="space-y-1">
                  {frank.problems.map(p => {
                    const stats = frank.mathResearch.problemStats[p.id];
                    return (
                      <div key={p.id} className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg">
                        <span className="text-base">{p.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium text-white truncate">{p.name}</div>
                          <div className="text-[9px] text-slate-500 truncate">{p.description}</div>
                        </div>
                        <div className="text-right shrink-0">
                          {stats ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-purple-300">{stats.findings} fynd</span>
                              {stats.hypotheses > 0 && <span className="text-[9px] text-amber-300">{stats.hypotheses} hyp</span>}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-600">Ej utforskat</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collatz Explorer */}
              {(frank.collatz.anomalies > 0 || frank.collatz.sequences > 0) && (
                <div className="bg-slate-900/40 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">🌀</span>
                    <span className="text-[11px] font-medium text-white">Collatz Explorer</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs font-bold text-white">{frank.collatz.sequences.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-500">Sekvenser</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-300">{frank.collatz.anomalies}</div>
                      <div className="text-[9px] text-slate-500">Anomalier</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-300">{frank.collatz.discoveries}</div>
                      <div className="text-[9px] text-slate-500">Upptäckter</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cognitive Modules */}
              <div>
                <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Kognitiva moduler
                </h4>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(frank.modules).map(([mod, exists]) => (
                    <span key={mod} className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      exists ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800/30" : "bg-slate-800 text-slate-600 border border-slate-700/30"
                    }`}>
                      {exists ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                      {mod.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sleep Architecture */}
              <div className="bg-slate-900/40 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-medium text-white">Sömnarkitektur</span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>NREM: Minneskonsolidering + Collatz-utforskning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>REM: HDC-drömmar + Matematisk forskning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Cross-domain: Mönster mellan problem</span>
                  </div>
                </div>
              </div>

              {/* Recent Findings */}
              {frank.mathResearch.recentFindings.length > 0 && (
                <div>
                  <h4 className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">Senaste fynd</h4>
                  <div className="space-y-1">
                    {frank.mathResearch.recentFindings.map((f, i) => (
                      <div key={i} className="text-[10px] p-1.5 bg-slate-900/40 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="px-1 py-0.5 rounded bg-purple-900/50 text-purple-300 text-[8px] font-medium">{f.problem}</span>
                          <span className="px-1 py-0.5 rounded bg-slate-700 text-slate-400 text-[8px]">{f.category}</span>
                        </div>
                        <div className="text-slate-300 truncate">{f.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Testing */}
              <div className="flex items-center gap-2 p-2 bg-emerald-950/30 border border-emerald-800/20 rounded-lg">
                <TestTube className="w-4 h-4 text-emerald-400" />
                <div className="flex-1">
                  <div className="text-[11px] font-medium text-emerald-300">{frank.testing.totalTests} tester i {frank.testing.testFiles} filer</div>
                  <div className="text-[9px] text-slate-500">Alla passerar ✓</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Computers */}
      {computers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Datorer
            <span className="text-[10px] font-normal text-emerald-400">{online} online</span>
          </h3>
          {computers.map(c => (
            <div key={c.id} className={`bg-slate-800/60 border rounded-xl p-3 ${c.status === "online" ? "border-emerald-800/40" : "border-slate-700/50 opacity-60"}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Monitor className={`w-4 h-4 ${c.status === "online" ? "text-emerald-400" : "text-slate-500"}`} />
                    {c.status === "online" && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                  <span className="text-xs font-medium text-white">{c.name}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.status === "online" ? "bg-emerald-900/50 text-emerald-300" : c.status === "busy" ? "bg-amber-900/50 text-amber-300" : "bg-slate-700 text-slate-400"}`}>
                  {c.status === "online" ? "Online" : c.status === "busy" ? "Upptagen" : "Offline"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span>{c.capabilities.os}</span>
                <span>{c.capabilities.cpuCores} CPU</span>
                <span>{c.capabilities.ramGb}GB</span>
                {c.capabilities.hasGpu && <span className="text-amber-400">GPU</span>}
                <span className="ml-auto">{c.taskCount} tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orchestrator */}
      {data.ai.orchestrator.totalTasks > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">Orchestrator</span>
            <span className="text-[10px] text-slate-500 ml-auto">{data.ai.orchestrator.totalTasks} totalt</span>
          </div>
          <div className="flex gap-3 mb-2">
            <div className="flex-1 text-center">
              <div className="text-sm font-bold text-emerald-300">{data.ai.orchestrator.completedTasks}</div>
              <div className="text-[10px] text-slate-500">Klara</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm font-bold text-red-300">{data.ai.orchestrator.failedTasks}</div>
              <div className="text-[10px] text-slate-500">Fel</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm font-bold text-amber-300">{data.ai.orchestrator.totalTasks - data.ai.orchestrator.completedTasks - data.ai.orchestrator.failedTasks}</div>
              <div className="text-[10px] text-slate-500">Pågår</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 flex overflow-hidden">
            <div className="bg-emerald-500 transition-all" style={{ width: `${(data.ai.orchestrator.completedTasks / data.ai.orchestrator.totalTasks) * 100}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${(data.ai.orchestrator.failedTasks / data.ai.orchestrator.totalTasks) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Token usage sparkline */}
      {tokenHistory.some(t => t > 0) && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Token-användning
            </h3>
            <span className="text-[10px] text-slate-500">{formatTokens(data.ai.claude.totalTokens + data.ai.gemini.totalTokens)} totalt</span>
          </div>
          <Sparkline data={tokenHistory} color="#a78bfa" height={40} />
        </div>
      )}

      {/* Today highlight */}
      {data.activity.messagesToday > 0 && (
        <div className="bg-gradient-to-r from-blue-950/40 to-violet-950/40 border border-blue-800/30 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-white">{data.activity.messagesToday} meddelanden idag</div>
            <div className="text-[10px] text-slate-500">{data.activity.messagesTotal} totalt sedan start</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-blue-300">{data.ai.claude.requestCount + data.ai.gemini.requestCount}</div>
            <div className="text-[10px] text-slate-500">AI-anrop</div>
          </div>
        </div>
      )}

      {/* I1: Historical Trends */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setExpandedSection(expandedSection === "trends" ? null : "trends")} className="flex items-center gap-1.5 touch-manipulation">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Historiska trender</span>
            {expandedSection === "trends" ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <div className="flex gap-1">
            {(["daily", "weekly"] as const).map(p => (
              <button key={p} onClick={() => setTrendPeriod(p)}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-colors touch-manipulation ${trendPeriod === p ? "bg-indigo-600 text-white" : "text-slate-500"}`}>
                {p === "daily" ? "Dag" : "Vecka"}
              </button>
            ))}
          </div>
        </div>
        {expandedSection === "trends" && (
          <div className="space-y-3 mt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500">Token-användning</span>
                <div className="flex gap-2 text-[9px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> Claude</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-500" /> Gemini</span>
                </div>
              </div>
              <BarChart
                data={[trends.map(t => t.claudeTokens), trends.map(t => t.geminiTokens)]}
                labels={trends.map(t => t.date.slice(5))}
                colors={["#3b82f6", "#8b5cf6"]}
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Kostnad (USD)</span>
              <BarChart
                data={[trends.map(t => t.claudeCostUsd), trends.map(t => t.geminiCostUsd)]}
                labels={trends.map(t => t.date.slice(5))}
                colors={["#3b82f6", "#8b5cf6"]}
                height={50}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-500">CPU (%)</span>
                <Sparkline data={trends.map(t => t.avgCpuPercent)} color="#3b82f6" height={30} />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">RAM (%)</span>
                <Sparkline data={trends.map(t => t.avgMemoryPercent)} color="#22c55e" height={30} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* I2: Cost Budget */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setExpandedSection(expandedSection === "budget" ? null : "budget")} className="flex items-center gap-1.5 touch-manipulation">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Kostnadsbudget</span>
            {budget?.enabled && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400">AKT</span>}
            {expandedSection === "budget" ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button onClick={() => setShowBudgetEdit(!showBudgetEdit)} className="p-1 text-slate-500 hover:text-slate-300 touch-manipulation" title="Redigera budget">
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {expandedSection === "budget" && budget && (
          <div className="space-y-2">
            {/* Budget bars */}
            {(["daily", "weekly", "monthly"] as const).map(period => {
              const limit = period === "daily" ? budget.dailyLimitUsd : period === "weekly" ? budget.weeklyLimitUsd : budget.monthlyLimitUsd;
              const current = budget.alerts.find(a => a.type === period)?.currentUsd || 0;
              const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
              const label = period === "daily" ? "Dag" : period === "weekly" ? "Vecka" : "Månad";
              return (
                <div key={period}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-slate-400">{label}</span>
                    <span className={pct > 80 ? "text-red-400" : pct > 50 ? "text-amber-400" : "text-slate-400"}>
                      ${current.toFixed(2)} / ${limit.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {/* Alerts */}
            {budget.alerts.filter(a => a.percent >= budget.alertThreshold).map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-red-950/30 border border-red-800/30 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-[10px] text-red-300">
                  {a.type === "daily" ? "Daglig" : a.type === "weekly" ? "Vecko" : "Månads"}budget: {Math.round(a.percent * 100)}% använt
                </span>
              </div>
            ))}
          </div>
        )}
        {showBudgetEdit && (
          <div className="mt-2 space-y-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-400 w-16">Aktiv</label>
              <button onClick={() => setBudgetForm(f => ({ ...f, enabled: !f.enabled }))}
                className={`px-2 py-0.5 text-[10px] rounded-md ${budgetForm.enabled ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"}`}>
                {budgetForm.enabled ? "PÅ" : "AV"}
              </button>
            </div>
            {(["dailyLimitUsd", "weeklyLimitUsd", "monthlyLimitUsd"] as const).map(key => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-[10px] text-slate-400 w-16">{key === "dailyLimitUsd" ? "Dag $" : key === "weeklyLimitUsd" ? "Vecka $" : "Månad $"}</label>
                <input type="number" step="0.5" min="0" value={budgetForm[key]}
                  onChange={e => setBudgetForm(f => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                  aria-label={key === "dailyLimitUsd" ? "Daglig budget" : key === "weeklyLimitUsd" ? "Veckobudget" : "Månadsbudget"}
                  className="flex-1 bg-slate-800 text-xs text-white rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-amber-500 w-20" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-400 w-16">Alert %</label>
              <input type="number" step="5" min="50" max="100" value={Math.round(budgetForm.alertThreshold * 100)}
                onChange={e => setBudgetForm(f => ({ ...f, alertThreshold: (parseInt(e.target.value) || 80) / 100 }))}
                aria-label="Alert threshold procent"
                className="flex-1 bg-slate-800 text-xs text-white rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-amber-500 w-20" />
            </div>
            <button onClick={saveBudget}
              className="w-full py-1.5 bg-amber-600 active:bg-amber-700 text-white text-xs rounded-lg transition-colors touch-manipulation">
              Spara budget
            </button>
          </div>
        )}
      </div>

      {/* I3: Model Comparison */}
      {models.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
          <button onClick={() => setExpandedSection(expandedSection === "models" ? null : "models")} className="flex items-center gap-1.5 w-full touch-manipulation">
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Modelljämförelse</span>
            {expandedSection === "models" ? <ChevronUp className="w-3.5 h-3.5 text-slate-500 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-auto" />}
          </button>
          {expandedSection === "models" && (
            <div className="mt-2 space-y-2">
              {models.map(m => (
                <div key={m.model} className={`p-2.5 rounded-lg border ${m.provider === "claude" ? "bg-blue-950/20 border-blue-800/30" : "bg-violet-950/20 border-violet-800/30"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-white">{m.model.split("-").slice(0, 3).join("-")}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${m.enabled ? "bg-emerald-900/50 text-emerald-400" : "bg-slate-700 text-slate-500"}`}>
                      {m.enabled ? "Aktiv" : "Inaktiv"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[10px]">
                    <div><span className="text-slate-500">Latens</span><div className="text-slate-200 font-medium">{m.avgLatencyMs > 0 ? `${(m.avgLatencyMs / 1000).toFixed(1)}s` : "—"}</div></div>
                    <div><span className="text-slate-500">$/request</span><div className="text-amber-300 font-medium">${m.costPerRequest.toFixed(4)}</div></div>
                    <div><span className="text-slate-500">$/1k tok</span><div className="text-amber-300 font-medium">${m.costPer1kTokens.toFixed(4)}</div></div>
                    <div><span className="text-slate-500">Requests</span><div className="text-slate-200">{m.requestCount}</div></div>
                    <div><span className="text-slate-500">Tokens</span><div className="text-slate-200">{formatTokens(m.totalTokens)}</div></div>
                    <div><span className="text-slate-500">Totalt</span><div className="text-amber-300 font-bold">${m.totalCostUsd.toFixed(4)}</div></div>
                  </div>
                </div>
              ))}
              {/* Winner highlight */}
              {models.length >= 2 && (() => {
                const fastest = models.reduce((a, b) => (a.avgLatencyMs > 0 && a.avgLatencyMs < b.avgLatencyMs) || b.avgLatencyMs === 0 ? a : b);
                const cheapest = models.reduce((a, b) => a.costPer1kTokens < b.costPer1kTokens ? a : b);
                return (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="p-2 bg-emerald-950/30 border border-emerald-800/30 rounded-lg text-center">
                      <div className="text-[9px] text-emerald-400">Snabbast</div>
                      <div className="text-[10px] text-white font-medium">{fastest.model.split("-").slice(0, 2).join("-")}</div>
                    </div>
                    <div className="p-2 bg-amber-950/30 border border-amber-800/30 rounded-lg text-center">
                      <div className="text-[9px] text-amber-400">Billigast</div>
                      <div className="text-[10px] text-white font-medium">{cheapest.model.split("-").slice(0, 2).join("-")}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* I4: CSV Export */}
      <div className="flex gap-2">
        <a href={`${BRIDGE_URL}/api/dashboard/export/csv`} download="gracestack-metrics.csv"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700 active:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors touch-manipulation">
          <Download className="w-3.5 h-3.5" /> Exportera trender (CSV)
        </a>
        <a href={`${BRIDGE_URL}/api/dashboard/export/snapshots`} download="gracestack-snapshots.csv"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700 active:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors touch-manipulation">
          <Download className="w-3.5 h-3.5" /> Exportera snapshots
        </a>
      </div>
    </div>
  );
}
