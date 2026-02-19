import { useState, useEffect, useCallback } from "react";
import { BRIDGE_URL } from "../config";
import {
  Webhook, Plus, Trash2, RefreshCw, Copy, Check, Eye, EyeOff,
  Play, Pause, Clock, Zap, Key, ChevronDown, ChevronRight, X,
  ExternalLink, Shield,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface WebhookItem {
  id: string;
  name: string;
  description: string;
  path: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  enabled: boolean;
  createdAt: string;
  lastCalledAt?: string;
  callCount: number;
  maxCallsPerMinute: number;
  responseFormat: string;
  template?: string;
}

interface WebhookLog {
  webhookId: string;
  timestamp: string;
  method: string;
  body: unknown;
  response: string;
  latencyMs: number;
  status: number;
  ip: string;
}

const MODELS = ["gemini", "claude", "deepseek", "grok", "ollama"];
const TEMPLATES = [
  { value: "custom", label: "Custom" },
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "github", label: "GitHub" },
];

// ─── Component ───────────────────────────────────────────────

export default function WebhooksView() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [fullKey, setFullKey] = useState<string | null>(null);

  // Create form
  const [formName, setFormName] = useState("");
  const [formPath, setFormPath] = useState("");
  const [formModel, setFormModel] = useState("gemini");
  const [formPrompt, setFormPrompt] = useState("Du är en hjälpsam AI-assistent. Svara koncist.");
  const [formRate, setFormRate] = useState(10);
  const [formFormat, setFormFormat] = useState("json");
  const [formTemplate, setFormTemplate] = useState("custom");

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BRIDGE_URL}/api/webhooks`);
      if (res.ok) setWebhooks(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchLogs = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${BRIDGE_URL}/api/webhooks/${id}/logs`);
      if (res.ok) setLogs(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);
  useEffect(() => { if (selectedId) fetchLogs(selectedId); }, [selectedId, fetchLogs]);

  const handleCreate = async () => {
    if (!formName || !formPath) return;
    try {
      const res = await fetch(`${BRIDGE_URL}/api/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          path: formPath,
          model: formModel,
          systemPrompt: formPrompt,
          maxCallsPerMinute: formRate,
          responseFormat: formFormat,
          template: formTemplate,
        }),
      });
      if (res.ok) {
        const wh = await res.json();
        setFullKey(wh.apiKey);
        setShowCreate(false);
        setFormName("");
        setFormPath("");
        await fetchWebhooks();
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ta bort webhook?")) return;
    await fetch(`${BRIDGE_URL}/api/webhooks/${id}`, { method: "DELETE" });
    if (selectedId === id) setSelectedId(null);
    await fetchWebhooks();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await fetch(`${BRIDGE_URL}/api/webhooks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    await fetchWebhooks();
  };

  const handleRegenKey = async (id: string) => {
    if (!confirm("Generera ny API-nyckel? Den gamla slutar fungera.")) return;
    const res = await fetch(`${BRIDGE_URL}/api/webhooks/${id}/regenerate-key`, { method: "POST" });
    if (res.ok) {
      const { apiKey } = await res.json();
      setFullKey(apiKey);
      await fetchWebhooks();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Webhook className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold">Webhooks & API Gateway</h2>
          <span className="text-xs text-slate-500">Exponera AI som API-endpoints</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Ny webhook
        </button>
      </div>

      {/* Full API key display (shown after create/regen) */}
      {fullKey && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300 font-medium">Ny API-nyckel (kopiera nu, visas bara en gång!)</span>
            </div>
            <button onClick={() => setFullKey(null)} className="text-slate-400 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs bg-slate-900 rounded px-3 py-1.5 font-mono text-green-300 flex-1 select-all">{fullKey}</code>
            <button
              onClick={() => copyToClipboard(fullKey, "new-key")}
              className="p-1.5 bg-green-600 hover:bg-green-500 rounded"
              title="Kopiera"
            >
              {copiedKey === "new-key" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-slate-800/50 border border-indigo-500/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Skapa webhook</h3>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Namn</label>
              <input value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="t.ex. Slack Bot" className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Sökväg (URL-slug)</label>
              <div className="flex items-center">
                <span className="text-xs text-slate-500 mr-1">/api/webhooks/hook/</span>
                <input value={formPath} onChange={e => setFormPath(e.target.value)}
                  placeholder="my-bot" className="flex-1 bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Modell</label>
              <select value={formModel} onChange={e => setFormModel(e.target.value)}
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600" title="AI-modell">
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Mall</label>
              <select value={formTemplate} onChange={e => setFormTemplate(e.target.value)}
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600" title="Webhook-mall">
                {TEMPLATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max anrop/min</label>
              <input type="number" min={1} max={100} value={formRate} onChange={e => setFormRate(parseInt(e.target.value) || 10)}
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">System prompt</label>
            <textarea value={formPrompt} onChange={e => setFormPrompt(e.target.value)} rows={2}
              className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600 resize-none"
              placeholder="Instruktioner till AI:n..." />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded">Avbryt</button>
            <button onClick={handleCreate} disabled={!formName || !formPath}
              className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 rounded disabled:opacity-40">
              Skapa
            </button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          <Webhook className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Inga webhooks ännu. Skapa en för att exponera AI som API.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <div key={wh.id} className={`bg-slate-800/50 border rounded-lg ${wh.enabled ? "border-slate-700" : "border-slate-700/50 opacity-60"}`}>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${wh.enabled ? "bg-green-400" : "bg-slate-500"}`} />
                    <span className="font-medium text-sm">{wh.name}</span>
                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 capitalize">{wh.model}</span>
                    {wh.template && wh.template !== "custom" && (
                      <span className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 capitalize">{wh.template}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleToggle(wh.id, wh.enabled)}
                      className="p-1 hover:text-yellow-400 text-slate-500" title={wh.enabled ? "Inaktivera" : "Aktivera"}>
                      {wh.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleRegenKey(wh.id)}
                      className="p-1 hover:text-blue-400 text-slate-500" title="Ny API-nyckel">
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setSelectedId(selectedId === wh.id ? null : wh.id)}
                      className="p-1 hover:text-slate-300 text-slate-500" title="Loggar">
                      {selectedId === wh.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(wh.id)}
                      className="p-1 hover:text-red-400 text-slate-500" title="Ta bort">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                  <span className="font-mono flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    /api/webhooks/hook/{wh.path}
                  </span>
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {wh.callCount} anrop</span>
                  {wh.lastCalledAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Senast: {new Date(wh.lastCalledAt).toLocaleString("sv-SE")}</span>}
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {wh.maxCallsPerMinute}/min</span>
                </div>

                {/* Curl example */}
                <div className="mt-2 bg-slate-900/50 rounded p-2 text-[10px] font-mono text-slate-400">
                  curl -X POST {window.location.origin}/api/webhooks/hook/{wh.path} \<br />
                  &nbsp;&nbsp;-H "x-api-key: {wh.apiKey}" \<br />
                  &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                  &nbsp;&nbsp;-d '{`{"message": "Hej!"}`}'
                </div>
              </div>

              {/* Logs */}
              {selectedId === wh.id && logs.length > 0 && (
                <div className="border-t border-slate-700/50 p-3">
                  <h4 className="text-xs text-slate-400 mb-2">Senaste anrop ({logs.length})</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {logs.slice(0, 20).map((log, i) => (
                      <div key={i} className={`text-[10px] p-1.5 rounded ${log.status === 200 ? "bg-slate-700/30" : "bg-red-900/20"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">{new Date(log.timestamp).toLocaleString("sv-SE")}</span>
                          <div className="flex items-center gap-2">
                            <span className={log.status === 200 ? "text-green-400" : "text-red-400"}>{log.status}</span>
                            <span className="text-slate-500">{log.latencyMs}ms</span>
                          </div>
                        </div>
                        <div className="text-slate-400 truncate mt-0.5">{log.response.slice(0, 100)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
