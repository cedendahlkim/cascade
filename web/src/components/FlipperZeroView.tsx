import { useState, useEffect, useCallback, useRef } from "react";
import {
  Radio, Bluetooth, BluetoothOff, Battery, BatteryCharging,
  Cpu, Signal, Zap, Send, Play, Square, Trash2, Brain,
  Antenna, Nfc, Lightbulb, ChevronDown, ChevronUp,
  Loader2, Waves, ScanLine, Settings2, AlertCircle, Info,
  Terminal, Mic, MicOff, Plus, Volume2, Wifi, Eye,
} from "lucide-react";
import { BRIDGE_URL } from "../config";
import { flipperBle, FlipperBLE, type FlipperDeviceInfo, type FlipperConnectionState } from "../lib/flipperBle";
import {
  bleScanner, audioCapture, BleScanner, AudioCapture,
  type ScannedDevice, type CharacteristicInfo,
  DEVICE_TYPE_ICONS, KNOWN_SERVICES,
} from "../lib/bleScanner";

// ─── Types ────────────────────────────────────────────────

type ViewTab = "flipper" | "scanner" | "audio";

interface FlipperCommand {
  id: string;
  command: string;
  response: string;
  timestamp: string;
  status: "success" | "error" | "pending";
}

type FlipperModule = "sub_ghz" | "rfid" | "nfc" | "ir" | "gpio" | "badusb";

const MODULE_CONFIG: Record<FlipperModule, { label: string; icon: React.ElementType; color: string; bg: string; description: string }> = {
  sub_ghz: { label: "Sub-GHz", icon: Waves, color: "text-green-400", bg: "bg-green-950/60 border-green-800/50", description: "Radiofrekvenser (300-928 MHz)" },
  rfid:    { label: "RFID",    icon: ScanLine, color: "text-blue-400", bg: "bg-blue-950/60 border-blue-800/50", description: "125kHz RFID-taggar" },
  nfc:     { label: "NFC",     icon: Nfc, color: "text-purple-400", bg: "bg-purple-950/60 border-purple-800/50", description: "NFC-taggar (13.56 MHz)" },
  ir:      { label: "Infraröd", icon: Lightbulb, color: "text-red-400", bg: "bg-red-950/60 border-red-800/50", description: "IR-signaler" },
  gpio:    { label: "GPIO",    icon: Cpu, color: "text-amber-400", bg: "bg-amber-950/60 border-amber-800/50", description: "GPIO-pinnar" },
  badusb:  { label: "BadUSB",  icon: Zap, color: "text-cyan-400", bg: "bg-cyan-950/60 border-cyan-800/50", description: "DuckyScript" },
};

// ─── Component ────────────────────────────────────────────

export default function FlipperZeroView() {
  const [viewTab, setViewTab] = useState<ViewTab>("scanner");

  // ── Flipper state
  const [bleState, setBleState] = useState<FlipperConnectionState>("disconnected");
  const [deviceInfo, setDeviceInfo] = useState<FlipperDeviceInfo | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);
  const [hasFlipperDevice, setHasFlipperDevice] = useState(false);
  const [commands, setCommands] = useState<FlipperCommand[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [showCli, setShowCli] = useState(false);
  const [rxLog, setRxLog] = useState<string[]>([]);
  const [rpcActive, setRpcActive] = useState(false);
  const [activeModule, setActiveModule] = useState<FlipperModule>("sub_ghz");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // ── Scanner state
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [scannerScanning, setScannerScanning] = useState(false);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [connectingDevice, setConnectingDevice] = useState<string | null>(null);

  // ── Audio state
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [audioActive, setAudioActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioDeviceLabel, setAudioDeviceLabel] = useState("");
  const [audioSampleRate, setAudioSampleRate] = useState(0);
  const [recordings, setRecordings] = useState<{ id: string; blob: Blob; duration: number; timestamp: string; deviceLabel: string }[]>([]);
  const audioDurationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bleSupported = BleScanner.isSupported();

  // ─── Flipper BLE Events ─────────────────────────────────

  useEffect(() => {
    const unsub = flipperBle.on((event) => {
      switch (event.type) {
        case "state_change":
          setBleState(event.data as FlipperConnectionState);
          if (event.data === "rpc_active") setRpcActive(true);
          if (event.data === "disconnected") { setRpcActive(false); setHasFlipperDevice(false); }
          break;
        case "device_info":
          setDeviceInfo(event.data as FlipperDeviceInfo);
          break;
        case "battery_update":
          setDeviceInfo(prev => prev ? { ...prev, battery: event.data as number } : null);
          break;
        case "rx_line":
          setRxLog(prev => [...prev, event.data as string].slice(-200));
          setCommands(prev => {
            const pending = prev.find(c => c.status === "pending");
            if (pending) {
              return prev.map(c => c.id === pending.id
                ? { ...c, response: c.response ? c.response + "\n" + (event.data as string) : (event.data as string), status: "success" as const }
                : c
              );
            }
            return prev;
          });
          break;
        case "rpc_response":
          setRxLog(prev => [...prev, `[RPC] ${(event.data as Uint8Array).length} bytes`].slice(-200));
          break;
        case "error":
          setBleError(event.data as string);
          setTimeout(() => setBleError(null), 8000);
          break;
        case "disconnect":
          setDeviceInfo(null); setRpcActive(false); setHasFlipperDevice(false);
          break;
      }
    });
    return unsub;
  }, []);

  // ─── Scanner Events ─────────────────────────────────────

  useEffect(() => {
    const unsub = bleScanner.on((event) => {
      switch (event.type) {
        case "device_found":
        case "device_connected":
        case "device_disconnected":
          setScannedDevices([...bleScanner.devices]);
          setConnectingDevice(null);
          break;
        case "notification":
          // Could update UI with live data
          break;
        case "error":
          setBleError(event.data as string);
          setTimeout(() => setBleError(null), 8000);
          break;
      }
    });
    return unsub;
  }, []);

  // ─── Load audio devices on mount ────────────────────────

  useEffect(() => {
    AudioCapture.listAudioDevices().then(setAudioDevices).catch(() => {});
  }, []);

  // ─── Flipper Actions ────────────────────────────────────

  const handleFlipperScan = useCallback(async () => {
    setBleError(null);
    const dev = await flipperBle.scan();
    if (dev) setHasFlipperDevice(true);
  }, []);

  const handleFlipperConnect = useCallback(async () => {
    setBleError(null);
    await flipperBle.connect();
  }, []);

  const handleFlipperDisconnect = useCallback(async () => {
    await flipperBle.disconnect();
  }, []);

  const handleStartRpc = useCallback(async () => {
    await flipperBle.startRpcSession();
  }, []);

  const sendCliCommand = useCallback(async () => {
    if (!commandInput.trim()) return;
    const cmd: FlipperCommand = {
      id: `cmd-${Date.now()}`, command: commandInput.trim(),
      response: "", timestamp: new Date().toISOString(), status: "pending",
    };
    setCommands(prev => [cmd, ...prev]);
    setCommandInput("");
    try {
      await flipperBle.sendCliCommand(cmd.command);
      setTimeout(() => {
        setCommands(prev => prev.map(c =>
          c.id === cmd.id && c.status === "pending" ? { ...c, status: "success", response: c.response || "(inget svar)" } : c
        ));
      }, 3000);
    } catch (e) {
      setCommands(prev => prev.map(c =>
        c.id === cmd.id ? { ...c, response: e instanceof Error ? e.message : String(e), status: "error" } : c
      ));
    }
  }, [commandInput]);

  // ─── AI-driven Command Execution ────────────────────────

  const AI_QUICK_ACTIONS: { label: string; icon: string; commands: string[]; description: string }[] = [
    { label: "Enhetsinfo", icon: "ℹ️", commands: ["info"], description: "Visa all enhetsinformation" },
    { label: "Skanna Sub-GHz", icon: "📻", commands: ["subghz rx"], description: "Lyssna på radiofrekvenser" },
    { label: "Läs NFC", icon: "💳", commands: ["nfc detect"], description: "Detektera NFC-taggar" },
    { label: "Läs RFID", icon: "🏷️", commands: ["rfid read"], description: "Läs RFID-taggar" },
    { label: "IR-mottagare", icon: "📡", commands: ["ir rx"], description: "Fånga IR-signaler" },
    { label: "Bluetooth info", icon: "🔵", commands: ["bt info"], description: "Visa BT-status" },
    { label: "Lista filer", icon: "📁", commands: ["storage list /ext"], description: "Visa SD-kort" },
    { label: "Diskutrymme", icon: "💾", commands: ["storage info /ext"], description: "Visa ledigt utrymme" },
    { label: "GPIO-status", icon: "⚡", commands: ["gpio mode 0 0"], description: "Läs GPIO-pinnar" },
    { label: "Uptime", icon: "⏱️", commands: ["power info"], description: "Drifttid och batteri" },
  ];

  const runAiCommand = useCallback(async (command: string) => {
    const cmd: FlipperCommand = {
      id: `cmd-${Date.now()}`, command,
      response: "", timestamp: new Date().toISOString(), status: "pending",
    };
    setCommands(prev => [cmd, ...prev]);
    setShowCli(true);
    try {
      await flipperBle.sendCliCommand(command);
      setTimeout(() => {
        setCommands(prev => prev.map(c =>
          c.id === cmd.id && c.status === "pending" ? { ...c, status: "success", response: c.response || "(inget svar)" } : c
        ));
      }, 3000);
    } catch (e) {
      setCommands(prev => prev.map(c =>
        c.id === cmd.id ? { ...c, response: e instanceof Error ? e.message : String(e), status: "error" } : c
      ));
    }
  }, []);

  const runQuickAction = useCallback(async (action: typeof AI_QUICK_ACTIONS[number]) => {
    for (const cmd of action.commands) {
      await runAiCommand(cmd);
      // Small delay between commands
      if (action.commands.length > 1) await new Promise(r => setTimeout(r, 500));
    }
  }, [runAiCommand]);

  const askAi = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    const question = aiPrompt.trim();
    setAiPrompt("");
    setAiThinking(true);
    setAiResponse(null);

    try {
      // Ask Frankenstein to generate Flipper Zero commands
      const res = await fetch(`${BRIDGE_URL}/api/flipper/ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Användaren har en Flipper Zero ansluten via BLE. De vill: "${question}"

Du har tillgång till Flipper Zeros CLI. Svara med:
1. En kort förklaring av vad du gör (på svenska)
2. De exakta CLI-kommandona att köra (ett per rad, prefixat med CMD:)

Exempel:
Jag skannar Sub-GHz frekvenser för att hitta radiosignaler i närheten.
CMD: subghz rx

Vanliga kommandon:
- info (enhetsinfo)
- subghz rx (skanna radio)
- nfc detect (läs NFC)
- rfid read (läs RFID)
- ir rx (fånga IR)
- storage list /ext (lista filer)
- storage info /ext (diskutrymme)
- bt info (bluetooth status)
- power info (batteri/uptime)
- led r 255 (tänd röd LED)
- led g 255 (tänd grön LED)
- vibro 1 (vibrera)
- vibro 0 (stoppa vibration)`,
          deviceInfo: deviceInfo,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.analysis || data.response || "";
        setAiResponse(text);

        // Extract and run CMD: lines
        const cmdLines = text.split("\n").filter((l: string) => l.trim().startsWith("CMD:"));
        for (const line of cmdLines) {
          const cmd = line.replace(/^CMD:\s*/, "").trim();
          if (cmd) {
            await runAiCommand(cmd);
            await new Promise(r => setTimeout(r, 500));
          }
        }
      } else {
        // Fallback: try to parse the question locally
        const q = question.toLowerCase();
        let fallbackCmd = "info";
        let fallbackMsg = "Kör enhetsinfo som standard.";

        if (q.includes("radio") || q.includes("sub-ghz") || q.includes("subghz") || q.includes("frekvens")) {
          fallbackCmd = "subghz rx"; fallbackMsg = "Startar Sub-GHz-skanning för att lyssna på radiofrekvenser.";
        } else if (q.includes("nfc") || q.includes("kort") || q.includes("bricka")) {
          fallbackCmd = "nfc detect"; fallbackMsg = "Söker efter NFC-taggar i närheten.";
        } else if (q.includes("rfid") || q.includes("tagg")) {
          fallbackCmd = "rfid read"; fallbackMsg = "Läser RFID-taggar.";
        } else if (q.includes("ir") || q.includes("infraröd") || q.includes("fjärr")) {
          fallbackCmd = "ir rx"; fallbackMsg = "Lyssnar efter IR-signaler (fjärrkontroller).";
        } else if (q.includes("fil") || q.includes("sd") || q.includes("lista")) {
          fallbackCmd = "storage list /ext"; fallbackMsg = "Visar filer på SD-kortet.";
        } else if (q.includes("batteri") || q.includes("ström") || q.includes("power")) {
          fallbackCmd = "power info"; fallbackMsg = "Visar batteri och ströminfo.";
        } else if (q.includes("led") || q.includes("ljus") || q.includes("blinka")) {
          fallbackCmd = "led r 255"; fallbackMsg = "Tänder röd LED på Flipper.";
        } else if (q.includes("vibr")) {
          fallbackCmd = "vibro 1"; fallbackMsg = "Startar vibration.";
        } else if (q.includes("bluetooth") || q.includes("bt")) {
          fallbackCmd = "bt info"; fallbackMsg = "Visar Bluetooth-status.";
        }

        setAiResponse(fallbackMsg + `\nCMD: ${fallbackCmd}`);
        await runAiCommand(fallbackCmd);
      }
    } catch {
      // Full fallback
      setAiResponse("Kunde inte nå AI — kör enhetsinfo.");
      await runAiCommand("info");
    } finally {
      setAiThinking(false);
    }
  }, [aiPrompt, deviceInfo, runAiCommand]);

  // ─── Scanner Actions ────────────────────────────────────

  const handleScanDevice = useCallback(async () => {
    setScannerScanning(true);
    await bleScanner.scanOne();
    setScannerScanning(false);
    setScannedDevices([...bleScanner.devices]);
  }, []);

  const handleConnectDevice = useCallback(async (deviceId: string) => {
    setConnectingDevice(deviceId);
    await bleScanner.connectAndRead(deviceId);
    setScannedDevices([...bleScanner.devices]);
    setConnectingDevice(null);
  }, []);

  const handleDisconnectDevice = useCallback((deviceId: string) => {
    bleScanner.disconnect(deviceId);
    setScannedDevices([...bleScanner.devices]);
  }, []);

  const handleRemoveDevice = useCallback((deviceId: string) => {
    bleScanner.removeDevice(deviceId);
    setScannedDevices([...bleScanner.devices]);
    if (expandedDevice === deviceId) setExpandedDevice(null);
  }, [expandedDevice]);

  // ─── Audio Actions ──────────────────────────────────────

  const handleStartAudio = useCallback(async () => {
    try {
      const info = await audioCapture.start(
        selectedAudioDevice || undefined,
        (level) => setAudioLevel(level),
      );
      if (info) {
        setAudioActive(true);
        setAudioDeviceLabel(info.deviceLabel);
        setAudioSampleRate(info.sampleRate);
        setAudioDuration(0);
        audioDurationRef.current = setInterval(() => {
          setAudioDuration(audioCapture.getDuration());
        }, 500);
      }
    } catch (err) {
      setBleError(`Mikrofon-åtkomst nekad: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [selectedAudioDevice]);

  const handleStopAudio = useCallback(() => {
    if (audioDurationRef.current) {
      clearInterval(audioDurationRef.current);
      audioDurationRef.current = null;
    }
    const blob = audioCapture.stop();
    setAudioActive(false);
    setAudioLevel(0);
    if (blob && blob.size > 0) {
      setRecordings(prev => [{
        id: `rec-${Date.now()}`,
        blob,
        duration: audioDuration,
        timestamp: new Date().toISOString(),
        deviceLabel: audioDeviceLabel,
      }, ...prev]);
    }
  }, [audioDuration, audioDeviceLabel]);

  const handlePlayRecording = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  }, []);

  const handleDownloadRecording = useCallback((blob: Blob, timestamp: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `capture-${new Date(timestamp).toISOString().replace(/[:.]/g, "-")}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioDurationRef.current) clearInterval(audioDurationRef.current);
      audioCapture.stop();
    };
  }, []);

  // ─── Helpers ────────────────────────────────────────────

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const isFlipperConnected = bleState === "connected" || bleState === "rpc_active";

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">

      {/* ── Error Banner ── */}
      {bleError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/60 border border-red-800/50 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="min-w-0 break-words">{bleError}</span>
        </div>
      )}

      {/* ── View Tabs ── */}
      <div className="flex gap-1.5">
        {([
          { id: "scanner" as ViewTab, label: "📶 BLE Scanner", desc: "Alla enheter" },
          { id: "flipper" as ViewTab, label: "📡 Flipper Zero", desc: "Flipper" },
          { id: "audio" as ViewTab, label: "🎤 Ljud", desc: "Fånga ljud" },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setViewTab(t.id)}
            className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-medium border transition-colors text-center ${
              viewTab === t.id
                ? "bg-orange-950/60 border-orange-800/50 text-orange-400"
                : "bg-slate-800/40 border-slate-700/30 text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* ══ BLE SCANNER TAB ════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════ */}
      {viewTab === "scanner" && (
        <>
          {/* Scan Button */}
          <button
            onClick={handleScanDevice}
            disabled={scannerScanning || !bleSupported}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors"
          >
            {scannerScanning ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Söker...</>
            ) : (
              <><Plus className="w-4 h-4" /> Sök BLE-enhet</>
            )}
          </button>

          {!bleSupported && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Web Bluetooth stöds inte. Använd Chrome/Edge på Android.</span>
            </div>
          )}

          <p className="text-[10px] text-slate-600 -mt-1">
            Tryck "Sök" för varje enhet du vill lägga till. Välj enhet i BLE-dialogen.
          </p>

          {/* Device List */}
          {scannedDevices.length === 0 ? (
            <div className="glass-card rounded-xl p-8 border border-slate-700/50 text-center">
              <Wifi className="w-10 h-10 mx-auto mb-3 text-blue-400/20" />
              <p className="text-xs text-slate-500">Inga enheter hittade ännu</p>
              <p className="text-[10px] text-slate-600 mt-1">Tryck "Sök BLE-enhet" för att hitta Bluetooth-enheter i närheten</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scannedDevices.map(dev => (
                <div
                  key={dev.id}
                  className={`glass-card rounded-xl border transition-colors ${
                    dev.gattConnected ? "border-green-800/50 bg-green-950/20" : "border-slate-700/50"
                  }`}
                >
                  {/* Device Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => setExpandedDevice(expandedDevice === dev.id ? null : dev.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{DEVICE_TYPE_ICONS[dev.type]}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">{dev.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          {dev.gattConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                          {dev.serviceNames.length > 0
                            ? dev.serviceNames.slice(0, 3).join(", ")
                            : "Ej ansluten"}
                          {dev.battery !== null && <span>• 🔋 {dev.battery}%</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {connectingDevice === dev.id && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
                      {!dev.gattConnected && connectingDevice !== dev.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleConnectDevice(dev.id); }}
                          className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium"
                        >
                          Anslut
                        </button>
                      )}
                      {dev.gattConnected && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDisconnectDevice(dev.id); }}
                          className="px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/60 border border-red-800/30 text-red-400 text-[10px]"
                        >
                          Koppla från
                        </button>
                      )}
                      {expandedDevice === dev.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                  </div>

                  {/* Expanded Device Details */}
                  {expandedDevice === dev.id && (
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-700/30 pt-2">
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {dev.manufacturer && (
                          <div className="p-1.5 rounded bg-slate-800/40 border border-slate-700/30">
                            <div className="text-[9px] text-slate-500">Tillverkare</div>
                            <div className="text-[11px] text-white truncate">{dev.manufacturer}</div>
                          </div>
                        )}
                        {dev.firmware && (
                          <div className="p-1.5 rounded bg-slate-800/40 border border-slate-700/30">
                            <div className="text-[9px] text-slate-500">Firmware</div>
                            <div className="text-[11px] text-white truncate">{dev.firmware}</div>
                          </div>
                        )}
                        {dev.battery !== null && (
                          <div className="p-1.5 rounded bg-slate-800/40 border border-slate-700/30">
                            <div className="text-[9px] text-slate-500">Batteri</div>
                            <div className={`text-[11px] font-bold ${dev.battery > 20 ? "text-green-400" : "text-red-400"}`}>{dev.battery}%</div>
                          </div>
                        )}
                        <div className="p-1.5 rounded bg-slate-800/40 border border-slate-700/30">
                          <div className="text-[9px] text-slate-500">Typ</div>
                          <div className="text-[11px] text-white">{DEVICE_TYPE_ICONS[dev.type]} {dev.type}</div>
                        </div>
                      </div>

                      {/* Services */}
                      {dev.services.length > 0 && (
                        <div>
                          <div className="text-[10px] text-slate-500 mb-1">Tjänster ({dev.services.length}):</div>
                          <div className="flex flex-wrap gap-1">
                            {dev.services.map(s => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/30 text-[9px] text-slate-400">
                                {KNOWN_SERVICES[s] || s.slice(4, 8).toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Characteristics */}
                      {dev.characteristics.length > 0 && (
                        <div>
                          <div className="text-[10px] text-slate-500 mb-1">Karaktäristiker ({dev.characteristics.length}):</div>
                          <div className="space-y-1 max-h-[200px] overflow-y-auto">
                            {dev.characteristics.map((ch, i) => (
                              <div key={i} className="p-1.5 rounded bg-slate-900/40 border border-slate-700/20 text-[10px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-mono">{ch.uuid.slice(4, 8).toUpperCase()}</span>
                                  <div className="flex gap-1">
                                    {ch.properties.map(p => (
                                      <span key={p} className={`px-1 py-0.5 rounded text-[8px] font-medium ${
                                        p === "read" ? "bg-green-900/40 text-green-400" :
                                        p === "write" ? "bg-blue-900/40 text-blue-400" :
                                        p === "notify" ? "bg-purple-900/40 text-purple-400" :
                                        "bg-slate-800 text-slate-500"
                                      }`}>{p}</span>
                                    ))}
                                  </div>
                                </div>
                                {ch.value && (
                                  <div className="mt-0.5 text-green-300 font-mono break-all">{ch.value}</div>
                                )}
                                <div className="text-[9px] text-slate-600">{ch.serviceName}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleRemoveDevice(dev.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px]"
                        >
                          <Trash2 className="w-3 h-3" /> Ta bort
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* ══ FLIPPER ZERO TAB ═══════════════════════════════ */}
      {/* ════════════════════════════════════════════════════ */}
      {viewTab === "flipper" && (
        <>
          <div className="glass-card rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-orange-400" />
                <h2 className="text-sm font-bold text-white">Flipper Zero</h2>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-400 font-mono">BLE</span>
              </div>
              {isFlipperConnected ? (
                <span className="flex items-center gap-1.5 text-[11px] text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {rpcActive ? "RPC Aktiv" : "Ansluten"}
                </span>
              ) : bleState === "connecting" ? (
                <span className="flex items-center gap-1.5 text-[11px] text-amber-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Ansluter...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-600" /> Ej ansluten
                </span>
              )}
            </div>

            {!hasFlipperDevice && !isFlipperConnected && bleState !== "connecting" && (
              <button
                onClick={handleFlipperScan}
                disabled={!bleSupported}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white text-sm font-medium transition-colors"
              >
                <Bluetooth className="w-4 h-4" /> Sök Flipper Zero (BLE)
              </button>
            )}

            {hasFlipperDevice && !isFlipperConnected && bleState !== "connecting" && (
              <div className="space-y-2">
                <button onClick={handleFlipperConnect} className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium">
                  Anslut till Flipper Zero
                </button>
                <button onClick={() => setHasFlipperDevice(false)} className="w-full text-[10px] text-slate-500 hover:text-slate-400 py-1">Sök igen</button>
              </div>
            )}

            {isFlipperConnected && deviceInfo && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="text-[10px] text-slate-500">Batteri</div>
                    <div className="flex items-center gap-1">
                      {deviceInfo.battery > 20 ? <Battery className="w-3.5 h-3.5 text-green-400" /> : <BatteryCharging className="w-3.5 h-3.5 text-red-400" />}
                      <span className={`text-xs font-bold ${deviceInfo.battery > 20 ? "text-green-400" : "text-red-400"}`}>{deviceInfo.battery}%</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="text-[10px] text-slate-500">Firmware</div>
                    <div className="text-xs font-bold text-white truncate">{deviceInfo.firmware}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="text-[10px] text-slate-500">Hardware</div>
                    <div className="text-xs font-bold text-white truncate">{deviceInfo.hardware}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="text-[10px] text-slate-500">Tillverkare</div>
                    <div className="text-xs font-bold text-white truncate">{deviceInfo.manufacturer}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!rpcActive ? (
                    <button onClick={handleStartRpc} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium">
                      <Terminal className="w-3.5 h-3.5" /> Starta RPC
                    </button>
                  ) : (
                    <button onClick={() => flipperBle.sendRpcPing()} title="RPC Ping" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 border border-purple-800/30 text-purple-400 text-xs font-medium">
                      <Signal className="w-3.5 h-3.5" /> RPC Ping
                    </button>
                  )}
                  <button onClick={handleFlipperDisconnect} title="Koppla från" className="px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-950/60 border border-red-800/30 text-red-400 text-xs">
                    <BluetoothOff className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Module Selector */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {(Object.entries(MODULE_CONFIG) as [FlipperModule, typeof MODULE_CONFIG[FlipperModule]][]).map(([id, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={id} onClick={() => setActiveModule(id)}
                        className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                          activeModule === id ? `${cfg.bg} ${cfg.color}` : "bg-slate-800/40 border-slate-700/30 text-slate-500"
                        }`}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* AI Control Panel */}
          {isFlipperConnected && (
            <div className="glass-card rounded-xl p-4 border border-purple-800/30 bg-purple-950/20">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">AI-styrning</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400">Frankenstein</span>
              </div>

              {/* Ask AI */}
              <div className="flex gap-2 mb-3">
                <input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && askAi()}
                  placeholder="Beskriv vad du vill göra... (t.ex. 'skanna radio', 'läs NFC-kort')"
                  disabled={aiThinking}
                  className="flex-1 bg-slate-900 border border-purple-800/30 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <button
                  onClick={askAi}
                  disabled={!aiPrompt.trim() || aiThinking}
                  title="Fråga AI"
                  className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white text-xs font-medium transition-colors"
                >
                  {aiThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                </button>
              </div>

              {/* AI Response */}
              {aiThinking && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-950/40 border border-purple-800/20 mb-3">
                  <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  <span className="text-[11px] text-purple-300">Frankenstein tänker...</span>
                </div>
              )}
              {aiResponse && !aiThinking && (
                <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-800/20 mb-3">
                  <div className="text-[11px] text-purple-200 whitespace-pre-wrap leading-relaxed">
                    {aiResponse.split("\n").map((line, i) =>
                      line.trim().startsWith("CMD:") ? (
                        <div key={i} className="mt-1 px-2 py-1 rounded bg-slate-900/60 font-mono text-green-400 text-[10px]">
                          $ {line.replace(/^CMD:\s*/, "")}
                        </div>
                      ) : (
                        <div key={i}>{line}</div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="text-[10px] text-slate-500 mb-2">Snabbkommandon:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {AI_QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => runQuickAction(action)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/30 hover:border-purple-800/30 text-left transition-colors group"
                  >
                    <span className="text-sm">{action.icon}</span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-white group-hover:text-purple-300 truncate">{action.label}</div>
                      <div className="text-[9px] text-slate-500 truncate">{action.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CLI */}
          {isFlipperConnected && (
            <div className="glass-card rounded-xl border border-slate-700/50 overflow-hidden">
              <button onClick={() => setShowCli(!showCli)} className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-400"><Terminal className="w-3.5 h-3.5" /> Flipper CLI</span>
                {showCli ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              {showCli && (
                <div className="p-3 pt-0 space-y-2">
                  {rxLog.length > 0 && (
                    <div className="bg-slate-900/80 rounded-lg p-2 max-h-[150px] overflow-y-auto font-mono text-[10px]">
                      {rxLog.slice(-30).map((line, i) => (
                        <div key={i} className={line.startsWith("[") ? "text-slate-500" : "text-green-300"}>{line}</div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input value={commandInput} onChange={e => setCommandInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendCliCommand()}
                      placeholder={rpcActive ? "RPC aktiv" : "CLI-kommando..."}
                      disabled={rpcActive}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-600 disabled:opacity-50" />
                    <button onClick={sendCliCommand} disabled={!commandInput.trim() || rpcActive} title="Skicka"
                      className="px-3 py-2 rounded-md bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 text-white text-xs">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {commands.length > 0 && (
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                      {commands.map(cmd => (
                        <div key={cmd.id} className="rounded-md bg-slate-900/60 p-2 text-[10px] font-mono">
                          <div className="text-orange-400">$ {cmd.command}</div>
                          {cmd.status === "pending"
                            ? <div className="text-slate-500 mt-0.5"><Loader2 className="w-3 h-3 animate-spin inline" /> Väntar...</div>
                            : <div className={`mt-0.5 whitespace-pre-wrap ${cmd.status === "error" ? "text-red-400" : "text-green-300"}`}>{cmd.response}</div>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* ══ AUDIO CAPTURE TAB ══════════════════════════════ */}
      {/* ════════════════════════════════════════════════════ */}
      {viewTab === "audio" && (
        <>
          <div className="glass-card rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-pink-400" />
                <h2 className="text-sm font-bold text-white">Ljudfångst</h2>
              </div>
              {audioActive && (
                <span className="flex items-center gap-1.5 text-[11px] text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Spelar in • {formatDuration(audioDuration)}
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 mb-3">
              Fånga ljud från mikrofon, Bluetooth-headset eller andra ljudkällor anslutna till din telefon.
            </p>

            {/* Audio Device Selector */}
            {audioDevices.length > 0 && (
              <div className="mb-3">
                <label className="text-[10px] text-slate-500 block mb-1">Ljudkälla:</label>
                <select
                  value={selectedAudioDevice}
                  onChange={e => setSelectedAudioDevice(e.target.value)}
                  title="Välj ljudkälla"
                  disabled={audioActive}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white disabled:opacity-50"
                >
                  <option value="">Standard (inbyggd mikrofon)</option>
                  {audioDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Mikrofon ${d.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Record Controls */}
            {!audioActive ? (
              <button
                onClick={handleStartAudio}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
              >
                <Mic className="w-4 h-4" /> Starta inspelning
              </button>
            ) : (
              <div className="space-y-3">
                {/* Level Meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">{audioDeviceLabel}</span>
                    <span className="text-slate-500">{audioSampleRate} Hz</span>
                  </div>
                  <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${Math.min(100, audioLevel * 400)}%`,
                        background: audioLevel > 0.5 ? "#ef4444" : audioLevel > 0.2 ? "#f59e0b" : "#22c55e",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-600">
                    <span>Nivå: {(audioLevel * 100).toFixed(0)}%</span>
                    <span>{formatDuration(audioDuration)}</span>
                  </div>
                </div>

                <button
                  onClick={handleStopAudio}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                >
                  <Square className="w-4 h-4" /> Stoppa inspelning
                </button>
              </div>
            )}
          </div>

          {/* Recordings */}
          {recordings.length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-slate-700/50">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-pink-400" />
                Inspelningar ({recordings.length})
              </h3>
              <div className="space-y-2">
                {recordings.map(rec => (
                  <div key={rec.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <div className="min-w-0">
                      <div className="text-xs text-white truncate">{rec.deviceLabel}</div>
                      <div className="text-[10px] text-slate-500">
                        {formatDuration(rec.duration)} • {(rec.blob.size / 1024).toFixed(0)} KB • {formatTime(rec.timestamp)}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handlePlayRecording(rec.blob)}
                        title="Spela upp"
                        className="px-2 py-1 rounded bg-green-900/40 hover:bg-green-900/60 border border-green-800/30 text-green-400 text-[10px]"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDownloadRecording(rec.blob, rec.timestamp)}
                        className="px-2 py-1 rounded bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800/30 text-blue-400 text-[10px]"
                      >
                        Spara
                      </button>
                      <button
                        onClick={() => setRecordings(prev => prev.filter(r => r.id !== rec.id))}
                        title="Ta bort"
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
            <div className="text-[10px] text-slate-500 space-y-1">
              <p><strong className="text-slate-400">Tips:</strong> Anslut ett Bluetooth-headset till din telefon först, sedan välj det som ljudkälla här.</p>
              <p>Inspelningar sparas som WebM/Opus. Tryck "Spara" för att ladda ner.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
