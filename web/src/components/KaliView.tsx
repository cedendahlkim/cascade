import { useState, useEffect, useRef, useCallback } from "react";
import {
  Terminal, Shield, Skull, Zap, Brain, Activity, Loader2,
  Play, Square, Trash2, ChevronDown, ChevronUp, Wifi, Globe,
  Lock, Unlock, Search, AlertTriangle, CheckCircle2, XCircle,
  Server, Database, Eye, Target, Send, RefreshCw, Copy, Clock,
} from "lucide-react";
import { BRIDGE_URL } from "../config";
import { io, Socket } from "socket.io-client";

interface KaliCommand {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
  running: boolean;
  tool?: string;
}

interface ScanResult {
  type: "nmap" | "nikto" | "sqlmap" | "dirb" | "whois" | "dig" | "custom";
  target: string;
  output: string;
  timestamp: number;
  status: "running" | "done" | "error";
}

const QUICK_TOOLS = [
  { id: "nmap-quick", label: "Nmap Quick", icon: Wifi, cmd: (t: string) => `nmap -sV -T4 ${t}`, desc: "Port scan + version detection" },
  { id: "nmap-vuln", label: "Nmap Vuln", icon: AlertTriangle, cmd: (t: string) => `nmap --script vuln -T4 ${t}`, desc: "Vulnerability scan" },
  { id: "nmap-os", label: "OS Detect", icon: Server, cmd: (t: string) => `nmap -O -T4 ${t}`, desc: "OS fingerprinting" },
  { id: "whois", label: "WHOIS", icon: Globe, cmd: (t: string) => `whois ${t}`, desc: "Domain registration info" },
  { id: "dig", label: "DNS Lookup", icon: Search, cmd: (t: string) => `dig ${t} ANY +noall +answer`, desc: "DNS records" },
  { id: "nikto", label: "Nikto", icon: Shield, cmd: (t: string) => `nikto -h ${t} -maxtime 60`, desc: "Web server scanner" },
  { id: "dirb", label: "Dirb", icon: Database, cmd: (t: string) => `dirb http://${t} /usr/share/wordlists/dirb/common.txt -r -z 10`, desc: "Directory brute force" },
  { id: "whatweb", label: "WhatWeb", icon: Eye, cmd: (t: string) => `whatweb ${t}`, desc: "Web technology fingerprint" },
  { id: "sslscan", label: "SSL Scan", icon: Lock, cmd: (t: string) => `sslscan ${t}`, desc: "SSL/TLS analysis" },
  { id: "traceroute", label: "Traceroute", icon: Target, cmd: (t: string) => `traceroute -m 15 ${t}`, desc: "Network path trace" },
];

const FRANK_PROMPTS = [
  "Analysera nmap-resultaten och identifiera sårbarheter",
  "Föreslå nästa steg baserat på skanningen",
  "Vilka attacker är möjliga mot dessa öppna portar?",
  "Skriv en rapport av säkerhetsanalysen",
  "Hur kan jag härda denna server?",
];

export default function KaliView() {
  const [target, setTarget] = useState("");
  const [commands, setCommands] = useState<KaliCommand[]>([]);
  const [customCmd, setCustomCmd] = useState("");
  const [running, setRunning] = useState(false);
  const [kaliStatus, setKaliStatus] = useState<"checking" | "online" | "offline">("checking");
  const [showTools, setShowTools] = useState(true);
  const [showFrank, setShowFrank] = useState(false);
  const [frankInput, setFrankInput] = useState("");
  const [frankThinking, setFrankThinking] = useState(false);
  const [frankResponse, setFrankResponse] = useState("");
  const [frankStream, setFrankStream] = useState("");
  const [activeTab, setActiveTab] = useState<"terminal" | "scans" | "recon">("terminal");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const cmdIdRef = useRef(0);

  // Check Kali container status
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/workspace/ai/terminal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: "whoami", runner: "kali", timeout: 5 }),
        });
        if (res.ok) {
          const data = await res.json();
          setKaliStatus(data.exitCode === 0 ? "online" : "offline");
        } else {
          setKaliStatus("offline");
        }
      } catch {
        setKaliStatus("offline");
      }
    };
    check();
  }, []);

  // Socket for Frankenstein
  useEffect(() => {
    const socket = io(BRIDGE_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("frank_message", (msg: { role: string; content: string }) => {
      if (msg.role === "cascade") {
        setFrankResponse(msg.content);
        setFrankThinking(false);
        setFrankStream("");
      }
    });
    socket.on("frank_stream", (data: { content: string }) => setFrankStream(data.content));
    socket.on("frank_status", (s: { type: string }) => {
      if (s.type === "thinking") setFrankThinking(true);
      if (s.type === "done") { setFrankThinking(false); }
    });

    return () => { socket.disconnect(); };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: "smooth" });
  }, [commands]);

  const runKaliCommand = useCallback(async (command: string, toolName?: string) => {
    const id = `cmd-${++cmdIdRef.current}`;
    const entry: KaliCommand = { id, command, output: "", exitCode: -1, timestamp: Date.now(), running: true, tool: toolName };
    setCommands(prev => [...prev, entry]);
    setRunning(true);

    try {
      const res = await fetch(`${BRIDGE_URL}/api/workspace/ai/terminal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, runner: "kali", timeout: 120 }),
      });
      const data = await res.json();
      setCommands(prev => prev.map(c => c.id === id ? { ...c, output: data.stdout || data.stderr || data.output || "(no output)", exitCode: data.exitCode ?? 1, running: false } : c));

      // Also store as scan result if it's a tool
      if (toolName) {
        setScanResults(prev => [...prev, {
          type: toolName as ScanResult["type"],
          target: target,
          output: data.stdout || data.stderr || data.output || "",
          timestamp: Date.now(),
          status: data.exitCode === 0 ? "done" : "error",
        }]);
      }
    } catch (err) {
      setCommands(prev => prev.map(c => c.id === id ? { ...c, output: `Error: ${err}`, exitCode: 1, running: false } : c));
    } finally {
      setRunning(false);
    }
  }, [target]);

  const runQuickTool = useCallback((tool: typeof QUICK_TOOLS[0]) => {
    const t = target.trim();
    if (!t) return;
    runKaliCommand(tool.cmd(t), tool.id);
  }, [target, runKaliCommand]);

  const runCustom = useCallback(() => {
    const cmd = customCmd.trim();
    if (!cmd) return;
    runKaliCommand(cmd);
    setCustomCmd("");
  }, [customCmd, runKaliCommand]);

  const askFrank = useCallback((prompt?: string) => {
    const text = prompt || frankInput.trim();
    if (!text || frankThinking) return;
    setFrankInput("");
    setFrankThinking(true);
    setFrankResponse("");
    setFrankStream("");

    // Build context from recent commands
    const recentOutput = commands.slice(-3).map(c => `$ ${c.command}\n${c.output.slice(0, 2000)}`).join("\n\n");
    const fullPrompt = `[Kali Linux Security Analysis Context]\nTarget: ${target || "N/A"}\n\nRecent terminal output:\n${recentOutput}\n\nUser request: ${text}`;

    socketRef.current?.emit("frank_message", { content: fullPrompt });
  }, [frankInput, frankThinking, commands, target]);

  const clearTerminal = () => setCommands([]);

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const statusColor = kaliStatus === "online" ? "text-emerald-400" : kaliStatus === "offline" ? "text-red-400" : "text-amber-400";
  const statusBg = kaliStatus === "online" ? "bg-emerald-400" : kaliStatus === "offline" ? "bg-red-400" : "bg-amber-400";

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-red-900/30 bg-gradient-to-r from-slate-900 via-red-950/20 to-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Skull className="w-5 h-5 text-red-400" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${statusBg} ring-2 ring-slate-900`} />
            </div>
            <div>
              <h2 className="text-sm font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Kali Linux
              </h2>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] ${statusColor}`}>
                  {kaliStatus === "checking" ? "Kontrollerar..." : kaliStatus === "online" ? "Container aktiv" : "Container offline"}
                </span>
                <span className="text-[10px] text-slate-600">•</span>
                <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
                  <Brain className="w-2.5 h-2.5" /> Frankenstein sudo
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFrank(!showFrank)}
              className={`p-1.5 rounded-lg transition-colors ${showFrank ? "bg-purple-600/30 text-purple-300" : "text-slate-500 hover:text-purple-400"}`}
              title="Frankenstein AI Assistant"
            >
              <Brain className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTools(!showTools)}
              className={`p-1.5 rounded-lg transition-colors ${showTools ? "bg-red-600/20 text-red-300" : "text-slate-500 hover:text-red-400"}`}
              title="Quick Tools"
            >
              <Shield className="w-4 h-4" />
            </button>
            <button onClick={clearTerminal} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors" title="Rensa terminal">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Target input */}
        <div className="mt-2 flex gap-2">
          <div className="flex-1 relative">
            <Target className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400/60" />
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Target: IP, domän eller URL..."
              className="w-full bg-slate-900/80 border border-red-900/30 rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>

        {/* Tab bar */}
        <div className="mt-2 flex gap-1">
          {[
            { id: "terminal" as const, label: "Terminal", icon: Terminal },
            { id: "scans" as const, label: `Skanningar (${scanResults.length})`, icon: Activity },
            { id: "recon" as const, label: "Recon", icon: Search },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                activeTab === tab.id ? "bg-red-900/30 text-red-300 border border-red-700/30" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Tools Panel */}
      {showTools && (
        <div className="shrink-0 px-3 py-2 border-b border-slate-800/50 bg-slate-900/40">
          <div className="grid grid-cols-5 gap-1.5">
            {QUICK_TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => runQuickTool(tool)}
                disabled={!target.trim() || running}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg bg-slate-800/50 hover:bg-red-900/20 border border-slate-700/30 hover:border-red-700/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                title={tool.desc}
              >
                <tool.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400 transition-colors" />
                <span className="text-[9px] text-slate-400 group-hover:text-red-300">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Terminal / Scans */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showFrank ? "border-r border-slate-800/50" : ""}`}>
          {activeTab === "terminal" && (
            <>
              {/* Terminal output */}
              <div ref={terminalRef} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] space-y-2">
                {commands.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <Skull className="w-10 h-10 text-red-500/50 mb-2" />
                    <p className="text-[12px] text-slate-500">Kali Linux Terminal</p>
                    <p className="text-[10px] text-slate-600 mt-1">Ange ett target ovan och välj ett verktyg, eller skriv ett kommando nedan</p>
                  </div>
                )}
                {commands.map(cmd => (
                  <div key={cmd.id} className="group">
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-400 select-none">┌──(</span>
                      <span className="text-emerald-400">frankenstein㉿kali</span>
                      <span className="text-red-400 select-none">)-[</span>
                      <span className="text-blue-300">~</span>
                      <span className="text-red-400 select-none">]</span>
                      {cmd.tool && <span className="text-[9px] text-amber-400/60 bg-amber-900/20 px-1 rounded">{cmd.tool}</span>}
                      <span className="text-[9px] text-slate-600 ml-auto">{new Date(cmd.timestamp).toLocaleTimeString()}</span>
                      <button onClick={() => copyOutput(cmd.output)} className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-white transition-all" title="Kopiera output">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-400 select-none">└─</span>
                      <span className="text-red-400 select-none">$</span>
                      <span className="text-white">{cmd.command}</span>
                    </div>
                    {cmd.running ? (
                      <div className="flex items-center gap-1.5 mt-1 ml-4 text-amber-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-[10px] animate-pulse">Kör...</span>
                      </div>
                    ) : (
                      <div className="mt-1 ml-4">
                        <pre className="whitespace-pre-wrap text-slate-300 text-[10px] leading-relaxed max-h-80 overflow-y-auto">{cmd.output}</pre>
                        <div className="flex items-center gap-1.5 mt-1">
                          {cmd.exitCode === 0 ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span className={`text-[9px] ${cmd.exitCode === 0 ? "text-emerald-500" : "text-red-500"}`}>
                            exit {cmd.exitCode}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Command input */}
              <div className="shrink-0 px-3 py-2 border-t border-slate-800/50 bg-slate-900/60">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-red-400 text-[11px] select-none shrink-0">frankenstein㉿kali $</span>
                  <input
                    value={customCmd}
                    onChange={(e) => setCustomCmd(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") runCustom(); }}
                    placeholder="Skriv kommando..."
                    disabled={running || kaliStatus !== "online"}
                    className="flex-1 bg-transparent text-[11px] text-white placeholder-slate-600 focus:outline-none disabled:opacity-40"
                  />
                  <button
                    onClick={runCustom}
                    disabled={!customCmd.trim() || running || kaliStatus !== "online"}
                    title="Kör kommando"
                    className="p-1.5 text-red-400 hover:text-red-300 disabled:opacity-30 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "scans" && (
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {scanResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <Activity className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-[11px] text-slate-500">Inga skanningar ännu</p>
                  <p className="text-[10px] text-slate-600">Kör ett verktyg från Quick Tools</p>
                </div>
              ) : (
                scanResults.map((scan, i) => (
                  <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          scan.status === "done" ? "bg-emerald-900/40 text-emerald-300" :
                          scan.status === "error" ? "bg-red-900/40 text-red-300" :
                          "bg-amber-900/40 text-amber-300"
                        }`}>
                          {scan.type.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-white font-medium">{scan.target}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span className="text-[9px] text-slate-600">{new Date(scan.timestamp).toLocaleTimeString()}</span>
                        <button onClick={() => copyOutput(scan.output)} className="p-1 text-slate-600 hover:text-white" title="Kopiera">
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setShowFrank(true);
                            setFrankInput(`Analysera detta ${scan.type}-resultat för ${scan.target}`);
                          }}
                          className="p-1 text-slate-600 hover:text-purple-400"
                          title="Fråga Frankenstein"
                        >
                          <Brain className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-slate-900/50 rounded-lg p-2">
                      {scan.output.slice(0, 3000)}{scan.output.length > 3000 ? "\n... (truncated)" : ""}
                    </pre>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "recon" && (
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
              <div className="text-[11px] text-slate-400 mb-2">
                Snabb recon-pipeline — kör alla steg automatiskt mot target
              </div>
              <button
                onClick={async () => {
                  if (!target.trim()) return;
                  const t = target.trim();
                  const pipeline = [
                    { cmd: `whois ${t} | head -40`, tool: "whois" },
                    { cmd: `dig ${t} ANY +noall +answer`, tool: "dig" },
                    { cmd: `nmap -sV -T4 --top-ports 100 ${t}`, tool: "nmap-quick" },
                    { cmd: `whatweb ${t} 2>/dev/null || echo "whatweb not available"`, tool: "whatweb" },
                  ];
                  for (const step of pipeline) {
                    await runKaliCommand(step.cmd, step.tool);
                  }
                  // Ask Frank to analyze
                  setShowFrank(true);
                  setTimeout(() => askFrank("Analysera alla recon-resultat och ge en säkerhetssammanfattning med rekommendationer"), 2000);
                }}
                disabled={!target.trim() || running}
                title="Kör full recon-pipeline mot target"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-900/40 to-orange-900/40 hover:from-red-900/60 hover:to-orange-900/60 border border-red-700/30 rounded-xl text-sm font-medium text-red-200 disabled:opacity-30 transition-all"
              >
                <Zap className="w-4 h-4" />
                Kör Full Recon Pipeline
              </button>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "WHOIS + DNS", desc: "Domäninfo + DNS-records", cmds: [`whois ${target} | head -40`, `dig ${target} ANY +noall +answer`] },
                  { label: "Port Scan", desc: "Top 1000 portar + versioner", cmds: [`nmap -sV -T4 ${target}`] },
                  { label: "Web Recon", desc: "WhatWeb + headers", cmds: [`whatweb ${target} 2>/dev/null`, `curl -sI ${target} | head -20`] },
                  { label: "SSL Analysis", desc: "TLS-konfiguration", cmds: [`sslscan ${target} 2>/dev/null || echo "sslscan not available"`] },
                ].map((group, i) => (
                  <button
                    key={i}
                    onClick={async () => {
                      for (const cmd of group.cmds) {
                        await runKaliCommand(cmd, group.label.toLowerCase().replace(/\s/g, "-"));
                      }
                    }}
                    disabled={!target.trim() || running}
                    title={group.desc}
                    className="flex flex-col items-start p-3 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 hover:border-red-700/30 rounded-xl transition-all disabled:opacity-30 text-left"
                  >
                    <span className="text-[11px] font-medium text-white">{group.label}</span>
                    <span className="text-[9px] text-slate-500">{group.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Frankenstein AI Panel */}
        {showFrank && (
          <div className="w-80 flex flex-col bg-slate-900/80 border-l border-purple-900/20">
            <div className="shrink-0 px-3 py-2 border-b border-purple-900/20 bg-gradient-to-r from-purple-950/30 to-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧟</span>
                <div>
                  <h3 className="text-[12px] font-bold text-purple-300">Frankenstein AI</h3>
                  <span className="text-[9px] text-purple-500">Säkerhetsanalys-assistent</span>
                </div>
              </div>
            </div>

            {/* Quick prompts */}
            <div className="shrink-0 px-2 py-2 border-b border-slate-800/30 space-y-1">
              {FRANK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => askFrank(prompt)}
                  disabled={frankThinking}
                  className="w-full text-left px-2 py-1 rounded-lg text-[10px] text-purple-400/80 hover:text-purple-300 hover:bg-purple-900/20 transition-colors disabled:opacity-40 truncate"
                >
                  → {prompt}
                </button>
              ))}
            </div>

            {/* Response area */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {frankThinking && (
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  <span className="text-[11px] text-purple-400 animate-pulse">Frankenstein analyserar...</span>
                </div>
              )}
              {frankStream && (
                <div className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {frankStream}
                </div>
              )}
              {frankResponse && !frankThinking && (
                <div className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {frankResponse}
                </div>
              )}
              {!frankResponse && !frankThinking && !frankStream && (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                  <Brain className="w-8 h-8 text-purple-600 mb-2" />
                  <p className="text-[10px] text-slate-500 text-center">
                    Frankenstein kan analysera dina skanningsresultat och föreslå nästa steg
                  </p>
                </div>
              )}
            </div>

            {/* Frank input */}
            <div className="shrink-0 px-2 py-2 border-t border-slate-800/30">
              <div className="flex gap-1.5">
                <input
                  value={frankInput}
                  onChange={(e) => setFrankInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") askFrank(); }}
                  placeholder="Fråga Frankenstein..."
                  disabled={frankThinking}
                  className="flex-1 bg-slate-800/50 border border-purple-900/30 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={() => askFrank()}
                  disabled={!frankInput.trim() || frankThinking}
                  title="Skicka till Frankenstein"
                  className="p-1.5 bg-purple-600/30 text-purple-300 rounded-lg hover:bg-purple-600/50 disabled:opacity-30 transition-colors"
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
