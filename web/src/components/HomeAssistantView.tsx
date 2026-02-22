import { useState, useEffect, useCallback } from "react";
import {
  Loader2, RefreshCw, Wifi, WifiOff, Zap, Brain, Mic, MicOff,
  Send, Home, Lightbulb, Thermometer, Lock, Speaker, Camera,
  Power, Settings, Activity, ChevronDown, ChevronUp, Play,
  Volume2, Sun, Moon, CloudRain, Wind, ToggleLeft, ToggleRight,
} from "lucide-react";
import { BRIDGE_URL } from "../config";

interface HAStatus {
  configured: boolean;
  online: boolean;
  url: string;
  version: string;
  entities: number;
  geminiEnabled: boolean;
  openclawAvailable: boolean;
}

interface Device {
  entity_id: string;
  state: string;
  name: string;
  last_changed: string;
}

interface Automation {
  entity_id: string;
  name: string;
  state: string;
  last_triggered: string | null;
}

const DOMAIN_ICONS: Record<string, typeof Home> = {
  light: Lightbulb,
  climate: Thermometer,
  lock: Lock,
  media_player: Speaker,
  camera: Camera,
  switch: Power,
  automation: Play,
  sensor: Activity,
  binary_sensor: Activity,
  sun: Sun,
  weather: CloudRain,
  fan: Wind,
};

const DOMAIN_LABELS: Record<string, string> = {
  light: "Lampor",
  climate: "Klimat",
  lock: "Lås",
  media_player: "Media",
  camera: "Kameror",
  switch: "Strömbrytare",
  automation: "Automationer",
  sensor: "Sensorer",
  binary_sensor: "Binära sensorer",
  sun: "Sol",
  weather: "Väder",
  fan: "Fläktar",
  cover: "Persienner",
  input_boolean: "Variabler",
  scene: "Scener",
  script: "Skript",
  person: "Personer",
  zone: "Zoner",
};

const VOICE_EXAMPLES = [
  "Tänd lamporna i vardagsrummet",
  "Vad är temperaturen inne?",
  "Lås ytterdörren",
  "Spela musik i köket",
  "Stäng av alla lampor",
  "Vad är statusen på hemmet?",
];

export default function HomeAssistantView() {
  const [status, setStatus] = useState<HAStatus | null>(null);
  const [devices, setDevices] = useState<Record<string, Device[]>>({});
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<"overview" | "devices" | "voice" | "setup">("overview");
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceResponse, setVoiceResponse] = useState("");
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [serviceBusy, setServiceBusy] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statusRes, devicesRes, autoRes] = await Promise.all([
          fetch(`${BRIDGE_URL}/api/homeassistant/status`).catch(() => null),
          fetch(`${BRIDGE_URL}/api/homeassistant/devices`).catch(() => null),
          fetch(`${BRIDGE_URL}/api/homeassistant/automations`).catch(() => null),
        ]);
        if (statusRes?.ok) setStatus(await statusRes.json());
        if (devicesRes?.ok) {
          const data = await devicesRes.json();
          setDevices(data.devices || {});
        }
        if (autoRes?.ok) {
          const data = await autoRes.json();
          setAutomations(data.automations || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [statusRes, devicesRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/homeassistant/status`),
        fetch(`${BRIDGE_URL}/api/homeassistant/devices`),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.devices || {});
      }
    } catch { /* ignore */ }
  }, []);

  const callService = useCallback(async (domain: string, service: string, entityId: string) => {
    setServiceBusy(entityId);
    try {
      await fetch(`${BRIDGE_URL}/api/homeassistant/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, service, entity_id: entityId }),
      });
      setTimeout(refresh, 1000);
    } catch { /* ignore */ }
    setServiceBusy(null);
  }, [refresh]);

  const sendVoice = useCallback(async (text?: string) => {
    const msg = text || voiceInput.trim();
    if (!msg || voiceBusy) return;
    setVoiceInput("");
    setVoiceBusy(true);
    setVoiceResponse("");
    try {
      const res = await fetch(`${BRIDGE_URL}/api/homeassistant/voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg, language: "sv" }),
      });
      const data = await res.json();
      if (res.ok) {
        const speech = data?.response?.speech?.plain?.speech || data?.response?.speech || "Kommando utfört";
        setVoiceResponse(typeof speech === "string" ? speech : JSON.stringify(speech));
      } else {
        setVoiceResponse(`❌ ${data.error || "Kunde inte nå Home Assistant"}`);
      }
    } catch {
      setVoiceResponse("❌ Anslutningsfel");
    }
    setVoiceBusy(false);
  }, [voiceInput, voiceBusy]);

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain); else next.add(domain);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-950 to-slate-900">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Ansluter till Home Assistant...</p>
      </div>
    );
  }

  const isOnline = status?.online;
  const isConfigured = status?.configured;
  const totalDevices = Object.values(devices).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-cyan-900/30 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="text-2xl">🏠</span>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                isOnline ? "bg-emerald-400" : isConfigured ? "bg-amber-400" : "bg-slate-500"
              }`} />
            </div>
            <div>
              <h2 className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Home Assistant
              </h2>
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <Wifi className="w-2.5 h-2.5" /> Online {status?.version && `(${status.version})`}
                  </span>
                ) : isConfigured ? (
                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> Konfigurerad — startar...
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <WifiOff className="w-2.5 h-2.5" /> Ej konfigurerad
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={refresh} className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors" title="Uppdatera">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            {["overview", "devices", "voice", "setup"].map(p => (
              <button
                key={p}
                onClick={() => setActivePanel(p as typeof activePanel)}
                className={`p-1.5 rounded-lg transition-colors text-[10px] ${
                  activePanel === p ? "bg-cyan-600/20 text-cyan-300" : "text-slate-500 hover:text-cyan-400"
                }`}
                title={p === "overview" ? "Översikt" : p === "devices" ? "Enheter" : p === "voice" ? "Röst" : "Setup"}
              >
                {p === "overview" && <Home className="w-3.5 h-3.5" />}
                {p === "devices" && <Lightbulb className="w-3.5 h-3.5" />}
                {p === "voice" && <Mic className="w-3.5 h-3.5" />}
                {p === "setup" && <Settings className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="shrink-0 px-3 py-1.5 border-b border-slate-800/40 bg-slate-900/40 flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <Home className="w-3 h-3 text-slate-600" />
          <span className={isOnline ? "text-emerald-400" : "text-slate-600"}>
            HA: {isOnline ? "Online" : "Ej ansluten"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-slate-600" />
          <span className="text-slate-500">{totalDevices} enheter</span>
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-slate-600" />
          <span className="text-purple-400">Frankenstein</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-slate-600" />
          <span className="text-orange-400">OpenClaw</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Speaker className="w-3 h-3 text-slate-600" />
          <span className="text-cyan-400">Google Nest</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {/* Overview */}
        {activePanel === "overview" && (
          <>
            {/* Architecture diagram */}
            <div className="p-4 bg-gradient-to-br from-slate-800/40 to-cyan-950/20 border border-cyan-700/20 rounded-xl">
              <h3 className="text-[12px] font-bold text-cyan-300 mb-3">Arkitektur</h3>
              <div className="flex items-center justify-center gap-2 text-[10px] flex-wrap">
                <div className="px-3 py-2 bg-slate-700/40 rounded-lg border border-slate-600/30 text-center">
                  <Speaker className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <span className="text-slate-300">Google Nest</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="px-3 py-2 bg-cyan-900/30 rounded-lg border border-cyan-700/30 text-center">
                  <Home className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                  <span className="text-cyan-300">Home Assistant</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="px-3 py-2 bg-orange-900/30 rounded-lg border border-orange-700/30 text-center">
                  <span className="text-base block mb-0.5">🦞</span>
                  <span className="text-orange-300">OpenClaw</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="px-3 py-2 bg-purple-900/30 rounded-lg border border-purple-700/30 text-center">
                  <Brain className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span className="text-purple-300">Frankenstein</span>
                </div>
                <span className="text-slate-600">→</span>
                <div className="px-3 py-2 bg-amber-900/30 rounded-lg border border-amber-700/30 text-center">
                  <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <span className="text-amber-300">Gemini</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 text-center mt-2">
                Google Nest → Home Assistant → OpenClaw/Frankenstein (Gemini) → Svar via TTS
              </p>
            </div>

            {/* Status cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Home className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-[10px] text-slate-400">Home Assistant</span>
                </div>
                <span className={`text-[12px] font-bold ${isOnline ? "text-emerald-400" : isConfigured ? "text-amber-400" : "text-slate-500"}`}>
                  {isOnline ? `v${status?.version}` : isConfigured ? "Startar..." : "Ej konfigurerad"}
                </span>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-[10px] text-slate-400">Enheter</span>
                </div>
                <span className="text-[12px] font-bold text-white">{totalDevices}</span>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Play className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-[10px] text-slate-400">Automationer</span>
                </div>
                <span className="text-[12px] font-bold text-white">{automations.length}</span>
              </div>
              <div className="p-3 bg-slate-800/40 border border-slate-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Mic className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-[10px] text-slate-400">Röstassistent</span>
                </div>
                <span className="text-[12px] font-bold text-orange-400">OpenClaw + Frankenstein</span>
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-300 mb-2">Snabbkommandon</h4>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { icon: "💡", label: "Alla lampor av", domain: "light", service: "turn_off", entity: "all" },
                  { icon: "🔒", label: "Lås alla dörrar", domain: "lock", service: "lock", entity: "all" },
                  { icon: "🌙", label: "Nattläge", domain: "scene", service: "turn_on", entity: "scene.night" },
                  { icon: "☀️", label: "Morgonrutin", domain: "scene", service: "turn_on", entity: "scene.morning" },
                  { icon: "🏠", label: "Hemma-läge", domain: "scene", service: "turn_on", entity: "scene.home" },
                  { icon: "👋", label: "Hejdå-läge", domain: "scene", service: "turn_on", entity: "scene.away" },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => callService(action.domain, action.service, action.entity)}
                    disabled={!isOnline}
                    title={action.label}
                    className="flex flex-col items-center gap-1 p-2.5 bg-slate-800/40 hover:bg-cyan-900/20 border border-slate-700/20 hover:border-cyan-700/30 rounded-xl transition-all disabled:opacity-30"
                  >
                    <span className="text-lg">{action.icon}</span>
                    <span className="text-[9px] text-slate-400">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Automations */}
            {automations.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-300 mb-2">Automationer</h4>
                <div className="space-y-1">
                  {automations.slice(0, 8).map(a => (
                    <div key={a.entity_id} className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Play className={`w-3 h-3 ${a.state === "on" ? "text-emerald-400" : "text-slate-600"}`} />
                        <span className="text-[10px] text-slate-300">{a.name}</span>
                      </div>
                      <button
                        onClick={() => callService("automation", a.state === "on" ? "turn_off" : "turn_on", a.entity_id)}
                        disabled={!isOnline}
                        title={a.state === "on" ? "Stäng av" : "Slå på"}
                        className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                      >
                        {a.state === "on" ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Devices */}
        {activePanel === "devices" && (
          <>
            <h3 className="text-[12px] font-bold text-cyan-300">Enheter ({totalDevices})</h3>
            {Object.entries(devices)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([domain, devs]) => {
                const Icon = DOMAIN_ICONS[domain] || Activity;
                const label = DOMAIN_LABELS[domain] || domain;
                const isExpanded = expandedDomains.has(domain);
                return (
                  <div key={domain} className="bg-slate-800/30 border border-slate-700/20 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleDomain(domain)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-slate-700/20 transition-colors"
                      title={`${label} (${devs.length})`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[11px] font-medium text-white">{label}</span>
                        <span className="text-[9px] text-slate-500">({devs.length})</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-700/20 divide-y divide-slate-700/10">
                        {devs.map(d => (
                          <div key={d.entity_id} className="flex items-center justify-between px-3 py-1.5">
                            <div>
                              <span className="text-[10px] text-slate-300">{d.name}</span>
                              <span className="text-[9px] text-slate-600 ml-2">{d.entity_id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                d.state === "on" || d.state === "home" ? "bg-emerald-900/40 text-emerald-300" :
                                d.state === "off" || d.state === "not_home" ? "bg-slate-700/40 text-slate-400" :
                                "bg-cyan-900/30 text-cyan-300"
                              }`}>
                                {d.state}
                              </span>
                              {(domain === "light" || domain === "switch" || domain === "fan") && (
                                <button
                                  onClick={() => callService(domain, d.state === "on" ? "turn_off" : "turn_on", d.entity_id)}
                                  disabled={serviceBusy === d.entity_id || !isOnline}
                                  title={d.state === "on" ? "Stäng av" : "Slå på"}
                                  className="p-0.5 text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-30"
                                >
                                  <Power className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            {totalDevices === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-8">
                {isOnline ? "Inga enheter hittades" : "Anslut Home Assistant för att se enheter"}
              </p>
            )}
          </>
        )}

        {/* Voice */}
        {activePanel === "voice" && (
          <>
            <div className="p-4 bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-700/20 rounded-xl text-center">
              <Mic className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
              <h3 className="text-[14px] font-bold text-cyan-300 mb-1">Röstkommando</h3>
              <p className="text-[10px] text-slate-500">
                Skicka röstkommandon till Home Assistant via OpenClaw/Frankenstein
              </p>
            </div>

            {/* Voice input */}
            <div className="flex gap-2">
              <input
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendVoice(); }}
                placeholder="Skriv ett kommando..."
                disabled={voiceBusy}
                className="flex-1 bg-slate-800/60 border border-cyan-900/20 rounded-xl px-3 py-2.5 text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
              />
              <button
                onClick={() => sendVoice()}
                disabled={!voiceInput.trim() || voiceBusy}
                title="Skicka kommando"
                className="px-3 py-2.5 bg-gradient-to-r from-cyan-600/40 to-blue-600/40 hover:from-cyan-600/60 hover:to-blue-600/60 text-cyan-200 rounded-xl disabled:opacity-30 transition-all"
              >
                {voiceBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Response */}
            {voiceResponse && (
              <div className="p-3 bg-slate-800/40 border border-cyan-700/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-medium">Svar</span>
                </div>
                <p className="text-[11px] text-slate-200">{voiceResponse}</p>
              </div>
            )}

            {/* Examples */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-300 mb-2">Exempel</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {VOICE_EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => sendVoice(ex)}
                    disabled={voiceBusy || !isOnline}
                    title={ex}
                    className="flex items-center gap-2 p-2.5 bg-slate-800/40 hover:bg-cyan-900/20 border border-slate-700/20 hover:border-cyan-700/30 rounded-xl transition-all text-left disabled:opacity-30"
                  >
                    <Mic className="w-3 h-3 text-cyan-500 shrink-0" />
                    <span className="text-[10px] text-slate-300 line-clamp-1">{ex}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Integration info */}
            <div className="p-3 bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🧟</span>
                <span className="text-[11px] font-bold text-purple-300">Frankenstein som röstassistent</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                När du pratar med din Google Nest skickas kommandot via Home Assistant till
                OpenClaw/Frankenstein som använder Gemini för att förstå och svara. Svaret
                skickas tillbaka som tal via Google Nest-högtalaren.
              </p>
            </div>
          </>
        )}

        {/* Setup */}
        {activePanel === "setup" && (
          <>
            <h3 className="text-[12px] font-bold text-cyan-300 mb-2">Setup-guide</h3>

            {/* Step 1 */}
            <div className="p-3 bg-slate-800/30 border border-slate-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-white bg-cyan-600/30 px-2 py-0.5 rounded">1</span>
                <span className="text-[11px] font-bold text-white">Home Assistant startar automatiskt</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isOnline ? "bg-emerald-900/40 text-emerald-300" : "bg-amber-900/40 text-amber-300"}`}>
                  {isOnline ? "✓ Klar" : "Väntar..."}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Home Assistant körs som Docker-container i Gracestack-stacken. Den startar automatiskt vid deploy.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-slate-800/30 border border-slate-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-white bg-cyan-600/30 px-2 py-0.5 rounded">2</span>
                <span className="text-[11px] font-bold text-white">Skapa HA Long-Lived Access Token</span>
              </div>
              <div className="space-y-1 text-[10px] text-slate-400 font-mono mt-1">
                <p className="text-slate-500"># Gå till HA UI:</p>
                <p className="text-cyan-300">http://app.gracestack.se:8123</p>
                <p className="text-slate-500"># Profil → Long-Lived Access Tokens → Skapa</p>
                <p className="text-slate-500"># Lägg till i bridge/.env:</p>
                <p className="text-cyan-300">HOME_ASSISTANT_TOKEN=eyJ0eXAi...</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-slate-800/30 border border-slate-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-white bg-cyan-600/30 px-2 py-0.5 rounded">3</span>
                <span className="text-[11px] font-bold text-white">Koppla Google Nest via Google Home</span>
              </div>
              <div className="space-y-1 text-[10px] text-slate-400 mt-1">
                <p>1. I HA: Inställningar → Integrationer → Lägg till → <strong className="text-white">Google Assistant</strong></p>
                <p>2. Följ instruktionerna för att koppla ditt Google-konto</p>
                <p>3. Dina Nest-enheter dyker upp som enheter i HA</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-slate-800/30 border border-slate-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-white bg-cyan-600/30 px-2 py-0.5 rounded">4</span>
                <span className="text-[11px] font-bold text-white">Sätt OpenClaw/Frankenstein som conversation agent</span>
              </div>
              <div className="space-y-1 text-[10px] text-slate-400 mt-1">
                <p>1. Installera <strong className="text-white">OpenClaw Conversation</strong> via HACS</p>
                <p>2. Konfigurera med din Gracestack Bridge URL</p>
                <p>3. Inställningar → Röstassistenter → Välj OpenClaw som agent</p>
                <p>4. Nu svarar Frankenstein/Gemini istället för Google Assistant!</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-3 bg-gradient-to-r from-cyan-950/30 to-slate-900 border border-cyan-700/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-white bg-emerald-600/30 px-2 py-0.5 rounded">✓</span>
                <span className="text-[11px] font-bold text-emerald-300">Resultat</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                "Hey Google, fråga Frankenstein vad temperaturen är" → Google Nest → Home Assistant →
                OpenClaw/Frankenstein (Gemini) → Svar via TTS på din Nest-högtalare.
                Du kan också skapa automationer som triggar Frankenstein vid events (t.ex. dörr öppnas, temperatur ändras).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
