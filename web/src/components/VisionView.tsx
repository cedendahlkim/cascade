import { useState, useEffect, useCallback, useRef } from "react";
import { BRIDGE_URL } from "../config";
import {
  Eye, Upload, Camera, Image, FileText, Trash2, RefreshCw,
  Sparkles, Clock, Zap, Copy, Check,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface VisionImage {
  data: string;
  mimeType: string;
  name?: string;
  preview?: string;
}

interface VisionResult {
  model: string;
  description: string;
  extractedText?: string;
  tags: string[];
  confidence: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

type VisionMode = "describe" | "ocr" | "analyze" | "compare" | "custom";

const MODE_LABELS: Record<VisionMode, { label: string; desc: string }> = {
  describe: { label: "Beskriv", desc: "Detaljerad beskrivning av bilden" },
  ocr: { label: "OCR", desc: "Extrahera text från bilden" },
  analyze: { label: "Analysera", desc: "Djup analys med taggar och kontext" },
  compare: { label: "Jämför", desc: "Jämför flera bilder" },
  custom: { label: "Fråga", desc: "Ställ en egen fråga om bilden" },
};

// ─── Component ───────────────────────────────────────────────

export default function VisionView() {
  const [images, setImages] = useState<VisionImage[]>([]);
  const [mode, setMode] = useState<VisionMode>("analyze");
  const [model, setModel] = useState<"gemini" | "claude">("gemini");
  const [customPrompt, setCustomPrompt] = useState("");
  const [result, setResult] = useState<VisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ model: string; enabled: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${BRIDGE_URL}/api/vision/models`)
      .then(r => r.json())
      .then(setAvailableModels)
      .catch(() => {});
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        setImages(prev => [...prev, {
          data: base64,
          mimeType: file.type,
          name: file.name,
          preview: dataUrl,
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFiles(new DataTransfer().files); // trigger via file
        const reader = new FileReader();
        const blob = item.getAsFile();
        if (!blob) continue;
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          setImages(prev => [...prev, {
            data: base64,
            mimeType: item.type,
            name: `clipboard-${Date.now()}.png`,
            preview: dataUrl,
          }]);
        };
        reader.readAsDataURL(blob);
      }
    }
  }, [handleFiles]);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const analyze = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${BRIDGE_URL}/api/vision/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map(img => ({
            data: img.data,
            mimeType: img.mimeType,
            name: img.name,
          })),
          model,
          mode,
          prompt: mode === "custom" ? customPrompt : undefined,
        }),
      });

      if (res.ok) {
        setResult(await res.json());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold">Vision & Multimodal</h2>
          <span className="text-xs text-slate-500">Analysera bilder med AI</span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-600 hover:border-cyan-500/50 rounded-lg p-8 text-center cursor-pointer transition-colors"
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-slate-500" />
        <p className="text-sm text-slate-400">
          Dra & släpp bilder, klicka för att välja, eller <strong>klistra in (Ctrl+V)</strong>
        </p>
        <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP, GIF — max 20MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img.preview}
                alt={img.name || `Bild ${i + 1}`}
                className="w-24 h-24 object-cover rounded-lg border border-slate-700"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Ta bort"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-center py-0.5 rounded-b-lg truncate px-1">
                {img.name || `Bild ${i + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {images.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
          {/* Mode selector */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Analysläge</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(MODE_LABELS) as [VisionMode, { label: string; desc: string }][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                    mode === key
                      ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                      : "border-slate-600 bg-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                  title={val.desc}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          {mode === "custom" && (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Din fråga</label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Vad vill du veta om bilden?"
                rows={2}
                className="w-full bg-slate-700 rounded px-3 py-2 text-sm border border-slate-600 resize-none"
              />
            </div>
          )}

          {/* Model selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Modell:</label>
              <div className="flex gap-1.5">
                {availableModels.map(m => (
                  <button
                    key={m.model}
                    onClick={() => setModel(m.model as "gemini" | "claude")}
                    disabled={!m.enabled}
                    className={`px-2.5 py-1 rounded text-xs capitalize border ${
                      model === m.model
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                        : m.enabled
                          ? "border-slate-600 bg-slate-700 text-slate-400"
                          : "border-slate-700 bg-slate-800 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    {m.model}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={loading || images.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm disabled:opacity-40"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Analysera
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Resultat
              <span className="text-xs text-slate-500 capitalize">({result.model})</span>
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {result.latencyMs}ms
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> {result.inputTokens + result.outputTokens} tok
              </span>
              <button
                onClick={copyResult}
                className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                title="Kopiera"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {result.description}
          </div>

          {/* Extracted text */}
          {result.extractedText && (
            <div>
              <h4 className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Extraherad text
              </h4>
              <div className="bg-slate-900/50 rounded p-2.5 text-xs font-mono text-slate-300 whitespace-pre-wrap">
                {result.extractedText}
              </div>
            </div>
          )}

          {/* Tags */}
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[10px] text-cyan-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
