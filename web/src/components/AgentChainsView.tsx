import { useState, useEffect, useRef, useCallback } from "react";
import {
  GitBranch, Play, Trash2, Plus, RefreshCw, CheckCircle, XCircle,
  Copy, Zap, ArrowRight, RotateCcw, Clock, MessageSquare,
  Terminal, Globe, GitMerge, Repeat, Timer, Bell, Layers, ChevronDown,
  StopCircle, Eye,
} from "lucide-react";
import { BRIDGE_URL } from "../config";

// ─── Types ───────────────────────────────────────────────────

interface ChainNodePosition { x: number; y: number; }

interface ChainConnection {
  id: string;
  fromNodeId: string;
  fromPort: string;
  toNodeId: string;
  toPort: string;
}

interface ChainNode {
  id: string;
  type: string;
  name: string;
  position: ChainNodePosition;
  config: Record<string, unknown>;
}

interface AgentChain {
  id: string;
  name: string;
  description: string;
  nodes: ChainNode[];
  connections: ChainConnection[];
  createdAt: string;
  updatedAt: string;
  runCount: number;
  lastRunAt: string | null;
  lastStatus: string | null;
  scheduleId: string | null;
  tags: string[];
}

interface ChainNodeResult {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  output: string;
  durationMs: number;
  error?: string;
  skipped?: boolean;
  iteration?: number;
}

interface ChainRun {
  id: string;
  chainId: string;
  chainName: string;
  status: string;
  nodeResults: ChainNodeResult[];
  currentNodeId: string | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  variables: Record<string, string>;
}

interface ChainTemplate {
  name: string;
  description: string;
  nodes: ChainNode[];
  connections: ChainConnection[];
}

// ─── Constants ───────────────────────────────────────────────

const NODE_TYPES = [
  { type: "start", label: "Start", icon: Zap, color: "emerald" },
  { type: "ai_prompt", label: "AI Prompt", icon: MessageSquare, color: "blue" },
  { type: "command", label: "Kommando", icon: Terminal, color: "amber" },
  { type: "http_request", label: "HTTP", icon: Globe, color: "purple" },
  { type: "condition", label: "Villkor", icon: GitMerge, color: "orange" },
  { type: "loop", label: "Loop", icon: Repeat, color: "cyan" },
  { type: "delay", label: "Fördröjning", icon: Timer, color: "slate" },
  { type: "notification", label: "Notis", icon: Bell, color: "pink" },
  { type: "sub_chain", label: "Sub-chain", icon: Layers, color: "indigo" },
  { type: "end", label: "Slut", icon: StopCircle, color: "red" },
];

const CONDITION_TYPES = [
  { value: "contains", label: "Innehåller" },
  { value: "not_contains", label: "Innehåller inte" },
  { value: "equals", label: "Lika med" },
  { value: "not_equals", label: "Inte lika med" },
  { value: "regex", label: "Regex" },
  { value: "greater_than", label: "Större än" },
  { value: "less_than", label: "Mindre än" },
  { value: "is_empty", label: "Är tom" },
  { value: "is_not_empty", label: "Är inte tom" },
];

const NODE_W = 180;
const NODE_H = 60;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getNodeColor(type: string): string {
  const nt = NODE_TYPES.find(n => n.type === type);
  if (!nt) return "slate";
  return nt.color;
}

function getNodeBg(type: string): string {
  const c = getNodeColor(type);
  const map: Record<string, string> = {
    emerald: "bg-emerald-900/60 border-emerald-700/50",
    blue: "bg-blue-900/60 border-blue-700/50",
    amber: "bg-amber-900/60 border-amber-700/50",
    purple: "bg-purple-900/60 border-purple-700/50",
    orange: "bg-orange-900/60 border-orange-700/50",
    cyan: "bg-cyan-900/60 border-cyan-700/50",
    slate: "bg-slate-800/60 border-slate-600/50",
    pink: "bg-pink-900/60 border-pink-700/50",
    indigo: "bg-indigo-900/60 border-indigo-700/50",
    red: "bg-red-900/60 border-red-700/50",
  };
  return map[c] || "bg-slate-800/60 border-slate-700/50";
}

function getNodeIcon(type: string) {
  const nt = NODE_TYPES.find(n => n.type === type);
  return nt?.icon || Zap;
}

// ─── Canvas Component ────────────────────────────────────────

function ChainCanvas({
  nodes, connections, selectedNode, runResults,
  onSelectNode, onMoveNode, onConnect, onDeleteConnection,
}: {
  nodes: ChainNode[];
  connections: ChainConnection[];
  selectedNode: string | null;
  runResults?: ChainNodeResult[];
  onSelectNode: (id: string | null) => void;
  onMoveNode: (id: string, pos: ChainNodePosition) => void;
  onConnect: (fromId: string, fromPort: string, toId: string) => void;
  onDeleteConnection: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [connecting, setConnecting] = useState<{ fromId: string; fromPort: string; x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({
      nodeId,
      offsetX: e.clientX - rect.left - node.position.x,
      offsetY: e.clientY - rect.top - node.position.y,
    });
    onSelectNode(nodeId);
  }, [nodes, onSelectNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, e.clientX - rect.left - dragging.offsetX);
      const y = Math.max(0, e.clientY - rect.top - dragging.offsetY);
      onMoveNode(dragging.nodeId, { x, y });
    }
    if (connecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setConnecting({ ...connecting, x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, [dragging, connecting, onMoveNode]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setConnecting(null);
  }, []);

  const handlePortClick = useCallback((nodeId: string, port: string, isOutput: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutput) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setConnecting({ fromId: nodeId, fromPort: port, x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else if (connecting) {
      onConnect(connecting.fromId, connecting.fromPort, nodeId);
      setConnecting(null);
    }
  }, [connecting, onConnect]);

  const getPortPos = (node: ChainNode, port: string, isOutput: boolean): { x: number; y: number } => {
    const x = isOutput ? node.position.x + NODE_W : node.position.x;
    let y = node.position.y + NODE_H / 2;
    if (port === "true") y = node.position.y + NODE_H / 3;
    if (port === "false") y = node.position.y + (NODE_H * 2) / 3;
    if (port === "loop_body") y = node.position.y + NODE_H;
    if (port === "loop_done") y = node.position.y + NODE_H / 2;
    return { x, y };
  };

  const getNodeResult = (nodeId: string): ChainNodeResult | undefined => {
    if (!runResults) return undefined;
    const matches = runResults.filter((r: ChainNodeResult) => r.nodeId === nodeId);
    return matches.length > 0 ? matches[matches.length - 1] : undefined;
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-[400px] bg-slate-950/50 border border-slate-700/30 rounded-xl overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => onSelectNode(null)}
    >
      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {connections.map(conn => {
          const fromNode = nodes.find(n => n.id === conn.fromNodeId);
          const toNode = nodes.find(n => n.id === conn.toNodeId);
          if (!fromNode || !toNode) return null;
          const from = getPortPos(fromNode, conn.fromPort, true);
          const to = getPortPos(toNode, conn.toPort, false);
          const midX = (from.x + to.x) / 2;
          const result = getNodeResult(conn.fromNodeId);
          const isActive = result && !result.error;
          const isFailed = result?.error;
          return (
            <g key={conn.id}>
              <path
                d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                stroke={isFailed ? "#ef4444" : isActive ? "#22c55e" : "#475569"}
                strokeWidth={2}
                strokeDasharray={conn.fromPort === "false" ? "6 3" : undefined}
              />
              {/* Delete button on hover */}
              <circle
                cx={midX} cy={(from.y + to.y) / 2} r={6}
                fill="#1e293b" stroke="#475569" strokeWidth={1}
                className="pointer-events-auto cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                onClick={() => onDeleteConnection(conn.id)}
              />
              <text
                x={midX} y={(from.y + to.y) / 2 + 3}
                textAnchor="middle" fill="#94a3b8" fontSize={8}
                className="pointer-events-none opacity-0 hover:opacity-100"
              >✕</text>
              {conn.fromPort !== "out" && (
                <text x={from.x + 5} y={from.y - 5} fill="#94a3b8" fontSize={9}>
                  {conn.fromPort}
                </text>
              )}
            </g>
          );
        })}
        {/* Drawing connection */}
        {connecting && (
          <line
            x1={connecting.x - 50} y1={connecting.y}
            x2={connecting.x} y2={connecting.y}
            stroke="#60a5fa" strokeWidth={2} strokeDasharray="4 2"
          />
        )}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
        const Icon = getNodeIcon(node.type);
        const result = getNodeResult(node.id);
        const isSelected = selectedNode === node.id;
        return (
          <div
            key={node.id}
            className={`absolute rounded-lg border px-2.5 py-1.5 cursor-move select-none transition-shadow ${getNodeBg(node.type)} ${
              isSelected ? "ring-2 ring-blue-400 shadow-lg shadow-blue-500/20" : ""
            } ${result?.error ? "ring-1 ring-red-500" : result ? "ring-1 ring-green-500/50" : ""}`}
            style={{ left: node.position.x, top: node.position.y, width: NODE_W, minHeight: NODE_H, zIndex: 2 }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
          >
            <div className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              <span className="text-[11px] font-medium text-white truncate">{node.name}</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5 truncate">
              {node.type === "ai_prompt" && (node.config.prompt as string || "").slice(0, 30)}
              {node.type === "command" && (node.config.command as string || "").slice(0, 30)}
              {node.type === "condition" && `${node.config.conditionType || "contains"}: ${(node.config.conditionValue as string || "").slice(0, 20)}`}
              {node.type === "loop" && `${node.config.loopType || "count"} × ${node.config.iterations || 3}`}
              {node.type === "delay" && `${node.config.delayMs || 1000}ms`}
            </div>
            {result && (
              <div className={`text-[8px] mt-0.5 truncate ${result.error ? "text-red-400" : "text-green-400"}`}>
                {result.error ? `✗ ${result.error.slice(0, 40)}` : `✓ ${result.output.slice(0, 40)}`}
              </div>
            )}

            {/* Output port(s) */}
            {node.type !== "end" && (
              <>
                {node.type === "condition" ? (
                  <>
                    <div
                      className="absolute w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900 cursor-pointer hover:scale-125 transition-transform"
                      style={{ right: -6, top: NODE_H / 3 - 6 }}
                      title="True"
                      onClick={(e) => handlePortClick(node.id, "true", true, e)}
                    />
                    <div
                      className="absolute w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900 cursor-pointer hover:scale-125 transition-transform"
                      style={{ right: -6, top: (NODE_H * 2) / 3 - 6 }}
                      title="False"
                      onClick={(e) => handlePortClick(node.id, "false", true, e)}
                    />
                  </>
                ) : node.type === "loop" ? (
                  <>
                    <div
                      className="absolute w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-900 cursor-pointer hover:scale-125 transition-transform"
                      style={{ right: -6, top: NODE_H / 2 - 6 }}
                      title="Done"
                      onClick={(e) => handlePortClick(node.id, "loop_done", true, e)}
                    />
                    <div
                      className="absolute w-3 h-3 rounded-full bg-cyan-300 border-2 border-slate-900 cursor-pointer hover:scale-125 transition-transform"
                      style={{ left: NODE_W / 2 - 6, bottom: -6 }}
                      title="Loop body"
                      onClick={(e) => handlePortClick(node.id, "loop_body", true, e)}
                    />
                  </>
                ) : (
                  <div
                    className="absolute w-3 h-3 rounded-full bg-slate-400 border-2 border-slate-900 cursor-pointer hover:scale-125 transition-transform"
                    style={{ right: -6, top: NODE_H / 2 - 6 }}
                    title="Output"
                    onClick={(e) => handlePortClick(node.id, "out", true, e)}
                  />
                )}
              </>
            )}

            {/* Input port */}
            {node.type !== "start" && (
              <div
                className="absolute w-3 h-3 rounded-full bg-slate-500 border-2 border-slate-900 cursor-pointer hover:scale-125 transition-transform"
                style={{ left: -6, top: NODE_H / 2 - 6 }}
                title="Input"
                onClick={(e) => handlePortClick(node.id, "in", false, e)}
              />
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-slate-600 text-sm">Dra noder hit för att bygga en kedja</p>
        </div>
      )}
    </div>
  );
}

// ─── Node Config Panel ───────────────────────────────────────

function NodeConfigPanel({
  node, chains, onUpdate, onDelete,
}: {
  node: ChainNode;
  chains: AgentChain[];
  onUpdate: (config: Record<string, unknown>, name?: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(node.name);
  const [config, setConfig] = useState(node.config);

  useEffect(() => { setName(node.name); setConfig(node.config); }, [node]);

  const updateConfig = (key: string, value: unknown) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    onUpdate(next, name);
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 uppercase">{node.type}</span>
        <button onClick={onDelete} className="text-slate-600 hover:text-red-400 text-[10px]">Ta bort</button>
      </div>

      <input
        type="text" value={name}
        onChange={e => { setName(e.target.value); onUpdate(config, e.target.value); }}
        className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500"
        placeholder="Nodnamn"
      />

      {node.type === "ai_prompt" && (
        <>
          <textarea
            value={(config.prompt as string) || ""}
            onChange={e => updateConfig("prompt", e.target.value)}
            placeholder="AI-prompt... (använd {{prev}}, {{loop_index}})"
            className="w-full bg-slate-900 text-white rounded px-2 py-1.5 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500 font-mono h-20 resize-none"
          />
          <div className="flex gap-2">
            <select
              value={(config.agent as string) || "claude"}
              onChange={e => updateConfig("agent", e.target.value)}
              title="AI-agent"
              className="flex-1 bg-slate-900 text-slate-300 rounded px-2 py-1 text-[10px] border border-slate-700"
            >
              <option value="claude">Claude</option>
              <option value="gemini">Gemini</option>
            </select>
            <input
              type="number" value={(config.retries as number) || 0} min={0} max={5}
              onChange={e => updateConfig("retries", parseInt(e.target.value) || 0)}
              className="w-16 bg-slate-900 text-white rounded px-2 py-1 text-[10px] border border-slate-700"
              placeholder="Retries"
              title="Antal retry vid fel"
            />
          </div>
        </>
      )}

      {node.type === "command" && (
        <input
          type="text" value={(config.command as string) || ""}
          onChange={e => updateConfig("command", e.target.value)}
          placeholder="Kommando..."
          className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
        />
      )}

      {node.type === "http_request" && (
        <>
          <input
            type="text" value={(config.url as string) || ""}
            onChange={e => updateConfig("url", e.target.value)}
            placeholder="URL..."
            className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
          />
          <select
            value={(config.method as string) || "GET"}
            onChange={e => updateConfig("method", e.target.value)}
            title="HTTP-metod"
            className="w-full bg-slate-900 text-slate-300 rounded px-2 py-1 text-[10px] border border-slate-700"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </>
      )}

      {node.type === "condition" && (
        <>
          <select
            value={(config.conditionType as string) || "contains"}
            onChange={e => updateConfig("conditionType", e.target.value)}
            title="Villkorstyp"
            className="w-full bg-slate-900 text-slate-300 rounded px-2 py-1 text-[10px] border border-slate-700"
          >
            {CONDITION_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
          </select>
          <input
            type="text" value={(config.conditionValue as string) || ""}
            onChange={e => updateConfig("conditionValue", e.target.value)}
            placeholder="Värde att jämföra med..."
            className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text" value={(config.checkValue as string) || "{{prev}}"}
            onChange={e => updateConfig("checkValue", e.target.value)}
            placeholder="Variabel att kontrollera ({{prev}})"
            className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
          />
        </>
      )}

      {node.type === "loop" && (
        <>
          <select
            value={(config.loopType as string) || "count"}
            onChange={e => updateConfig("loopType", e.target.value)}
            title="Loop-typ"
            className="w-full bg-slate-900 text-slate-300 rounded px-2 py-1 text-[10px] border border-slate-700"
          >
            <option value="count">Antal gånger</option>
            <option value="until">Tills villkor uppfylls</option>
          </select>
          {(config.loopType as string) !== "until" ? (
            <input
              type="number" value={(config.iterations as number) || 3} min={1} max={50}
              onChange={e => updateConfig("iterations", parseInt(e.target.value) || 3)}
              className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700"
              placeholder="Antal iterationer"
            />
          ) : (
            <input
              type="text" value={(config.untilCondition as string) || ""}
              onChange={e => updateConfig("untilCondition", e.target.value)}
              placeholder="Sluta när output innehåller..."
              className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          )}
        </>
      )}

      {node.type === "delay" && (
        <input
          type="number" value={(config.delayMs as number) || 1000} min={100} max={60000}
          onChange={e => updateConfig("delayMs", parseInt(e.target.value) || 1000)}
          className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700"
          placeholder="Millisekunder"
        />
      )}

      {node.type === "notification" && (
        <input
          type="text" value={(config.message as string) || ""}
          onChange={e => updateConfig("message", e.target.value)}
          placeholder="Meddelande... (använd {{prev}})"
          className="w-full bg-slate-900 text-white rounded px-2 py-1 text-[11px] border border-slate-700 focus:outline-none focus:border-blue-500"
        />
      )}

      {node.type === "sub_chain" && (
        <select
          value={(config.chainId as string) || ""}
          onChange={e => updateConfig("chainId", e.target.value)}
          title="Sub-chain"
          className="w-full bg-slate-900 text-slate-300 rounded px-2 py-1 text-[10px] border border-slate-700"
        >
          <option value="">Välj kedja...</option>
          {chains.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      <input
        type="text" value={(config.outputVar as string) || ""}
        onChange={e => updateConfig("outputVar", e.target.value)}
        placeholder="Spara output som variabel (valfritt)"
        className="w-full bg-slate-900 text-slate-400 rounded px-2 py-1 text-[10px] border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function AgentChainsView() {
  const [chains, setChains] = useState<AgentChain[]>([]);
  const [templates, setTemplates] = useState<ChainTemplate[]>([]);
  const [runs, setRuns] = useState<ChainRun[]>([]);
  const [activeChain, setActiveChain] = useState<AgentChain | null>(null);
  const [activeRun, setActiveRun] = useState<ChainRun | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editNodes, setEditNodes] = useState<ChainNode[]>([]);
  const [editConnections, setEditConnections] = useState<ChainConnection[]>([]);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = useCallback(() => {
    fetch(`${BRIDGE_URL}/api/chains`).then(r => r.json()).then(setChains).catch(() => {});
    fetch(`${BRIDGE_URL}/api/chains/templates`).then(r => r.json()).then(setTemplates).catch(() => {});
    fetch(`${BRIDGE_URL}/api/chain-runs?limit=10`).then(r => r.json()).then(setRuns).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Editor Actions ──────────────────────────────────────

  const startNew = () => {
    setEditNodes([
      { id: "start-1", type: "start", name: "Start", position: { x: 50, y: 150 }, config: {} },
      { id: "end-1", type: "end", name: "Slut", position: { x: 600, y: 150 }, config: {} },
    ]);
    setEditConnections([]);
    setEditName("Ny kedja");
    setEditDesc("");
    setActiveChain(null);
    setIsEditing(true);
    setSelectedNode(null);
  };

  const startFromTemplate = (t: ChainTemplate) => {
    setEditNodes([...t.nodes]);
    setEditConnections([...t.connections]);
    setEditName(t.name);
    setEditDesc(t.description);
    setActiveChain(null);
    setIsEditing(true);
    setShowTemplates(false);
    setSelectedNode(null);
  };

  const editExisting = (chain: AgentChain) => {
    setEditNodes([...chain.nodes]);
    setEditConnections([...chain.connections]);
    setEditName(chain.name);
    setEditDesc(chain.description);
    setActiveChain(chain);
    setIsEditing(true);
    setSelectedNode(null);
  };

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const maxX = editNodes.reduce((m, n) => Math.max(m, n.position.x), 0);
    const node: ChainNode = {
      id, type, name: NODE_TYPES.find(n => n.type === type)?.label || type,
      position: { x: Math.min(maxX + 200, 800), y: 150 },
      config: type === "loop" ? { loopType: "count", iterations: 3 } : type === "condition" ? { conditionType: "contains" } : {},
    };
    setEditNodes([...editNodes, node]);
    setSelectedNode(id);
  };

  const moveNode = useCallback((id: string, pos: ChainNodePosition) => {
    setEditNodes(prev => prev.map(n => n.id === id ? { ...n, position: pos } : n));
  }, []);

  const connectNodes = useCallback((fromId: string, fromPort: string, toId: string) => {
    if (fromId === toId) return;
    const exists = editConnections.some(c => c.fromNodeId === fromId && c.fromPort === fromPort && c.toNodeId === toId);
    if (exists) return;
    setEditConnections(prev => [...prev, {
      id: `conn-${Date.now()}`, fromNodeId: fromId, fromPort, toNodeId: toId, toPort: "in",
    }]);
  }, [editConnections]);

  const deleteConnection = useCallback((id: string) => {
    setEditConnections(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateNodeConfig = (nodeId: string, config: Record<string, unknown>, name?: string) => {
    setEditNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config, ...(name ? { name } : {}) } : n));
  };

  const deleteNode = (nodeId: string) => {
    setEditNodes(prev => prev.filter(n => n.id !== nodeId));
    setEditConnections(prev => prev.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId));
    setSelectedNode(null);
  };

  const saveChain = async () => {
    if (!editName.trim()) return;
    const body = { name: editName, description: editDesc, nodes: editNodes, connections: editConnections };
    if (activeChain) {
      await fetch(`${BRIDGE_URL}/api/chains/${activeChain.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    } else {
      await fetch(`${BRIDGE_URL}/api/chains`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
    }
    setIsEditing(false);
    fetchData();
  };

  const runChainAction = async (id: string) => {
    setRunning(id);
    try {
      const res = await fetch(`${BRIDGE_URL}/api/chains/${id}/run`, { method: "POST" });
      const run = await res.json();
      setActiveRun(run);
      fetchData();
    } catch { /* ignore */ }
    setRunning(null);
  };

  const deleteChainAction = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/chains/${id}`, { method: "DELETE" });
    if (activeChain?.id === id) { setIsEditing(false); setActiveChain(null); }
    fetchData();
  };

  const selectedNodeObj = editNodes.find(n => n.id === selectedNode) || null;

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-blue-400" /> Agent Chains
          </h2>
          <p className="text-[10px] text-slate-500">{chains.length} kedjor · Visuell workflow builder</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={fetchData} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Uppdatera">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowTemplates(!showTemplates)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Mallar">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={startNew} className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors" title="Ny kedja">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Templates */}
      {showTemplates && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 space-y-2">
          <h3 className="text-xs font-semibold text-slate-300">Mallar</h3>
          {templates.map((t, i) => (
            <button key={i} onClick={() => startFromTemplate(t)}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/30 hover:border-blue-500/50 transition-colors">
              <div className="text-xs text-white font-medium">{t.name}</div>
              <div className="text-[10px] text-slate-500">{t.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      {isEditing && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Kedjans namn"
              className="flex-1 bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500" />
            <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Beskrivning"
              className="flex-1 bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:outline-none focus:border-blue-500" />
          </div>

          {/* Node palette */}
          <div className="flex flex-wrap gap-1">
            {NODE_TYPES.filter(nt => nt.type !== "start" && nt.type !== "end").map(nt => {
              const Icon = nt.icon;
              return (
                <button key={nt.type} onClick={() => addNode(nt.type)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700/50 text-[10px] text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
                  <Icon className="w-3 h-3" /> {nt.label}
                </button>
              );
            })}
          </div>

          {/* Canvas */}
          <ChainCanvas
            nodes={editNodes}
            connections={editConnections}
            selectedNode={selectedNode}
            runResults={activeRun?.chainId === activeChain?.id ? activeRun?.nodeResults : undefined}
            onSelectNode={setSelectedNode}
            onMoveNode={moveNode}
            onConnect={connectNodes}
            onDeleteConnection={deleteConnection}
          />

          {/* Node config */}
          {selectedNodeObj && (
            <NodeConfigPanel
              node={selectedNodeObj}
              chains={chains}
              onUpdate={(config, name) => updateNodeConfig(selectedNodeObj.id, config, name)}
              onDelete={() => deleteNode(selectedNodeObj.id)}
            />
          )}

          {/* Save/Cancel */}
          <div className="flex gap-2">
            <button onClick={saveChain} disabled={!editName.trim() || editNodes.length < 2}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              {activeChain ? "Uppdatera" : "Spara"}
            </button>
            <button onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors">
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Active Run Result */}
      {activeRun && !isEditing && (
        <div className={`bg-slate-800/60 border rounded-xl p-3 ${
          activeRun.status === "completed" ? "border-green-800/40" :
          activeRun.status === "failed" ? "border-red-800/40" : "border-amber-800/40"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                activeRun.status === "completed" ? "bg-green-900/60 text-green-300" :
                activeRun.status === "failed" ? "bg-red-900/60 text-red-300" :
                "bg-amber-900/60 text-amber-300"
              }`}>{activeRun.status}</span>
              <span className="text-xs text-white font-medium">{activeRun.chainName}</span>
            </div>
            <button onClick={() => setActiveRun(null)} className="text-[10px] text-slate-500 hover:text-white">✕</button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {activeRun.nodeResults.map((nr, i) => (
              <div key={i} className={`px-2 py-1.5 rounded-lg text-[10px] ${
                nr.error ? "bg-red-950/30 border border-red-800/30" :
                nr.skipped ? "bg-slate-800/30 border border-slate-700/30" :
                "bg-green-950/30 border border-green-800/30"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">{nr.nodeName} <span className="text-slate-600">({nr.nodeType})</span></span>
                  <span className="text-slate-500">{nr.durationMs}ms</span>
                </div>
                <p className="text-slate-400 mt-0.5 line-clamp-2">{nr.error || nr.output}</p>
              </div>
            ))}
          </div>
          {activeRun.error && <p className="text-[10px] text-red-400 mt-1">⚠ {activeRun.error}</p>}
        </div>
      )}

      {/* Chain List */}
      {!isEditing && chains.length === 0 && !showTemplates ? (
        <div className="text-center py-12">
          <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">Inga agent chains</p>
          <p className="text-xs text-slate-600 mb-4">Bygg visuella AI-kedjor med villkor, loopar och retry</p>
          <button onClick={startNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
            Skapa din första kedja
          </button>
        </div>
      ) : !isEditing && (
        <div className="space-y-2">
          {chains.map(c => (
            <div key={c.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">{c.name}</span>
                  <span className="text-[10px] text-slate-500">{c.nodes.length} noder</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => editExisting(c)} className="p-1 rounded text-slate-500 hover:text-blue-400 transition-colors" title="Redigera">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => runChainAction(c.id)} disabled={running === c.id}
                    className="p-1 rounded text-slate-500 hover:text-green-400 transition-colors disabled:opacity-50" title="Kör">
                    {running === c.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteChainAction(c.id)} className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors" title="Ta bort">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {c.description && <p className="text-[10px] text-slate-500 mb-1">{c.description}</p>}
              <div className="flex items-center gap-1 mb-1 flex-wrap">
                {c.nodes.filter(n => n.type !== "start" && n.type !== "end").slice(0, 6).map(n => (
                  <span key={n.id} className={`text-[9px] px-1.5 py-0.5 rounded ${getNodeBg(n.type)}`}>
                    {n.name}
                  </span>
                ))}
                {c.nodes.length > 8 && <span className="text-[9px] text-slate-600">+{c.nodes.length - 8}</span>}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-600">
                <span>Körningar: {c.runCount}</span>
                {c.lastRunAt && (
                  <span>
                    Senast: {formatTime(c.lastRunAt)}
                    {c.lastStatus === "completed" ? <CheckCircle className="w-3 h-3 inline ml-1 text-green-400" /> : <XCircle className="w-3 h-3 inline ml-1 text-red-400" />}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Runs */}
      {!isEditing && runs.length > 0 && !activeRun && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Senaste körningar</h3>
          <div className="space-y-1">
            {runs.map(r => (
              <button key={r.id} onClick={() => setActiveRun(r)}
                className="w-full text-left px-2 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">{r.chainName}</span>
                  <span className={`text-[10px] ${r.status === "completed" ? "text-green-400" : r.status === "failed" ? "text-red-400" : "text-amber-400"}`}>
                    {r.status === "completed" ? "✓" : r.status === "failed" ? "✗" : "⏳"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600">{r.nodeResults.length} noder · {formatTime(r.startedAt)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
