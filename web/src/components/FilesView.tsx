import { useState, useEffect, useRef, DragEvent } from "react";
import { File, Upload, Download, Trash2, Image, FileText, Archive, RefreshCw, HardDrive, Filter, X, Eye } from "lucide-react";
import { BRIDGE_URL } from "../config";

interface SharedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  tags: string[];
}

interface StorageStats {
  fileCount: number;
  totalSize: number;
  totalSizeFormatted: string;
  byType: Record<string, number>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return <Image className="w-4 h-4 text-pink-400" />;
  if (mime.startsWith("text/") || mime.includes("json") || mime.includes("javascript")) return <FileText className="w-4 h-4 text-blue-400" />;
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("gzip")) return <Archive className="w-4 h-4 text-amber-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

function getFileCategory(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("text/") || mime.includes("json") || mime.includes("javascript") || mime.includes("typescript")) return "code";
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("gzip")) return "archive";
  return "other";
}

export default function FilesView() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<{ file: SharedFile; data: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState<"all" | "image" | "code" | "archive" | "other">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = () => {
    fetch(`${BRIDGE_URL}/api/files?limit=50`).then(r => r.json()).then(setFiles).catch(() => {});
    fetch(`${BRIDGE_URL}/api/files/stats`).then(r => r.json()).then(setStats).catch(() => {});
  };

  useEffect(() => { fetchFiles(); }, []);

  const uploadFile = async (file: globalThis.File) => {
    setUploading(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 50));
    };
    reader.onload = async () => {
      setUploadProgress(60);
      const base64 = (reader.result as string).split(",")[1];
      try {
        await fetch(`${BRIDGE_URL}/api/files/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: base64, filename: file.name, uploadedBy: "mobile" }),
        });
        setUploadProgress(100);
        fetchFiles();
      } catch { /* ignore */ }
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    for (let i = 0; i < fileList.length; i++) {
      await uploadFile(fileList[i]);
    }
    e.target.value = "";
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const items = e.dataTransfer.files;
    for (let i = 0; i < items.length; i++) {
      await uploadFile(items[i]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const downloadFile = (f: SharedFile) => {
    window.open(`${BRIDGE_URL}/api/files/${f.id}/download`, "_blank");
  };

  const deleteFile = async (id: string) => {
    await fetch(`${BRIDGE_URL}/api/files/${id}`, { method: "DELETE" });
    fetchFiles();
    if (preview?.file.id === id) setPreview(null);
  };

  const previewFile = async (f: SharedFile) => {
    if (f.mimeType.startsWith("image/") || f.mimeType.startsWith("text/")) {
      try {
        const res = await fetch(`${BRIDGE_URL}/api/files/${f.id}/base64`);
        const data = await res.json();
        setPreview({ file: f, data: data.data });
      } catch { /* ignore */ }
    }
  };

  const filteredFiles = filter === "all" ? files : files.filter(f => getFileCategory(f.mimeType) === filter);
  const filterCounts = {
    all: files.length,
    image: files.filter(f => getFileCategory(f.mimeType) === "image").length,
    code: files.filter(f => getFileCategory(f.mimeType) === "code").length,
    archive: files.filter(f => getFileCategory(f.mimeType) === "archive").length,
    other: files.filter(f => getFileCategory(f.mimeType) === "other").length,
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
      onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Filer</h2>
          {stats && (
            <p className="text-[10px] text-slate-500">{stats.fileCount} filer · {stats.totalSizeFormatted}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={fetchFiles} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="Uppdatera">
            <RefreshCw className="w-4 h-4" />
          </button>
          <label className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer" title="Ladda upp">
            <Upload className="w-4 h-4" />
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} title="Välj filer att ladda upp" />
          </label>
        </div>
      </div>

      {/* Drag-and-drop zone */}
      {(dragOver || files.length === 0) && (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            dragOver
              ? "border-blue-500 bg-blue-950/30 scale-[1.02]"
              : "border-slate-700 bg-slate-800/30"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? "text-blue-400 animate-bounce" : "text-slate-500"}`} />
          <p className={`text-sm font-medium ${dragOver ? "text-blue-300" : "text-slate-400"}`}>
            {dragOver ? "Släpp för att ladda upp" : "Dra filer hit eller klicka"}
          </p>
          <p className="text-[10px] text-slate-600 mt-1">Bilder, kod, arkiv — alla filtyper stöds</p>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-blue-300 font-medium">Laddar upp...</span>
            <span className="text-[10px] text-blue-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {files.length > 0 && (
        <div className="flex gap-1 bg-slate-800/40 rounded-lg p-0.5">
          {([
            { id: "all" as const, label: "Alla" },
            { id: "image" as const, label: "Bilder" },
            { id: "code" as const, label: "Kod" },
            { id: "archive" as const, label: "Arkiv" },
            { id: "other" as const, label: "Övrigt" },
          ]).filter(f => filterCounts[f.id] > 0 || f.id === "all").map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors ${filter === f.id ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}>
              {f.label} {filterCounts[f.id] > 0 && f.id !== "all" ? `(${filterCounts[f.id]})` : ""}
            </button>
          ))}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white truncate flex-1">{preview.file.originalName}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => downloadFile(preview.file)} className="p-1 rounded text-slate-500 hover:text-blue-400" title="Ladda ner">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setPreview(null)} className="p-1 rounded text-slate-500 hover:text-white" title="Stäng">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {preview.file.mimeType.startsWith("image/") ? (
            <img
              src={`data:${preview.file.mimeType};base64,${preview.data}`}
              alt={preview.file.originalName}
              className="max-w-full max-h-60 rounded-lg mx-auto"
            />
          ) : (
            <pre className="text-xs text-slate-300 font-mono bg-slate-900 rounded-lg p-2 max-h-60 overflow-auto whitespace-pre-wrap">
              {atob(preview.data)}
            </pre>
          )}
        </div>
      )}

      {/* File List */}
      {filteredFiles.length === 0 && files.length > 0 && (
        <div className="text-center py-6">
          <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Inga filer i denna kategori</p>
        </div>
      )}

      {filteredFiles.length > 0 && (
        <div className="space-y-1.5">
          {filteredFiles.map(f => (
            <div key={f.id} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 hover:border-slate-600/50 transition-colors group">
              <button onClick={() => previewFile(f)} className="shrink-0 relative" title="Förhandsgranska">
                {getFileIcon(f.mimeType)}
                {(f.mimeType.startsWith("image/") || f.mimeType.startsWith("text/")) && (
                  <Eye className="w-2.5 h-2.5 text-slate-500 absolute -bottom-0.5 -right-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => previewFile(f)}>
                <div className="text-sm text-white truncate">{f.originalName}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="font-medium">{formatSize(f.size)}</span>
                  <span>{f.uploadedBy}</span>
                  <span>{formatTime(f.uploadedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                <button onClick={() => downloadFile(f)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 transition-colors" title="Ladda ner">
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteFile(f.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors" title="Ta bort">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storage Stats */}
      {stats && stats.fileCount > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lagring</h3>
            <span className="text-[10px] text-slate-500 ml-auto">{stats.totalSizeFormatted}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="text-[10px] px-2 py-1 rounded-lg bg-slate-700/40 text-slate-400">
                <span className="text-slate-300 font-medium">{count}</span> {type}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
