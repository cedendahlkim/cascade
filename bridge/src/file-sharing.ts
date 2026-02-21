/**
 * File Sharing — Upload/download files between mobile and desktop
 * 
 * Supports image, document, and code file sharing via the bridge server.
 * Files are stored in bridge/data/shared-files/ with metadata.
 */
import { v4 as uuidv4 } from "uuid";
import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync, statSync, readdirSync } from "fs";
import { join, dirname, extname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Persist under the workspace root so uploads survive container recreation.
// Server docker-compose sets CASCADE_REMOTE_WORKSPACE=/workspace and mounts bridge-data at /workspace/bridge/data.
const WORKSPACE_ROOT = process.env.CASCADE_REMOTE_WORKSPACE || join(__dirname, "..", "..");
const DATA_DIR = join(WORKSPACE_ROOT, "bridge", "data");
const FILES_DIR = join(DATA_DIR, "shared-files");
const META_FILE = join(DATA_DIR, "shared-files-meta.json");

// Legacy (pre-workspace volume): stored next to the bridge package (/app/bridge/data).
const LEGACY_DATA_DIR = join(__dirname, "..", "data");
const LEGACY_FILES_DIR = join(LEGACY_DATA_DIR, "shared-files");
const LEGACY_META_FILE = join(LEGACY_DATA_DIR, "shared-files-meta.json");

function migrateLegacyStorageIfNeeded(): void {
  try {
    if (existsSync(META_FILE) || !existsSync(LEGACY_META_FILE)) return;
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (!existsSync(FILES_DIR)) mkdirSync(FILES_DIR, { recursive: true });

    // Copy metadata first.
    writeFileSync(META_FILE, readFileSync(LEGACY_META_FILE));

    // Copy files.
    if (existsSync(LEGACY_FILES_DIR)) {
      for (const name of readdirSync(LEGACY_FILES_DIR)) {
        const from = join(LEGACY_FILES_DIR, name);
        const to = join(FILES_DIR, name);
        if (existsSync(to)) continue;
        writeFileSync(to, readFileSync(from));
      }
    }

    console.log(`[files] Migrated legacy shared-files from ${LEGACY_DATA_DIR} → ${DATA_DIR}`);
  } catch (err) {
    console.warn("[files] Legacy migration failed (continuing):", err);
  }
}

// Ensure directory exists
if (!existsSync(FILES_DIR)) {
  mkdirSync(FILES_DIR, { recursive: true });
}

migrateLegacyStorageIfNeeded();

export interface SharedFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploadedBy: "mobile" | "desktop" | "ai";
  uploadedAt: string;
  description?: string;
  tags: string[];
}

const files: Map<string, SharedFile> = new Map();

function loadMeta(): void {
  try {
    if (existsSync(META_FILE)) {
      const data = JSON.parse(readFileSync(META_FILE, "utf-8"));
      for (const f of data.files || []) {
        files.set(f.id, f);
      }
    }
  } catch { /* fresh start */ }
}

function saveMeta(): void {
  try {
    const dir = dirname(META_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(META_FILE, JSON.stringify({
      files: Array.from(files.values()),
    }, null, 2), "utf-8");
  } catch (err) {
    console.error("[files] Failed to save metadata:", err);
  }
}

loadMeta();

const MIME_TYPES: Record<string, string> = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".ts": "application/typescript",
  ".json": "application/json",
  ".xml": "application/xml",
  ".csv": "text/csv",
  ".py": "text/x-python",
  ".sh": "text/x-shellscript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function guessMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// --- Public API ---

export function saveFile(
  buffer: Buffer,
  originalName: string,
  uploadedBy: SharedFile["uploadedBy"],
  description?: string,
  tags: string[] = [],
): SharedFile {
  const id = uuidv4();
  const ext = extname(originalName);
  const storedName = `${id}${ext}`;
  const filePath = join(FILES_DIR, storedName);

  writeFileSync(filePath, buffer);

  const file: SharedFile = {
    id,
    originalName,
    storedName,
    mimeType: guessMimeType(originalName),
    size: buffer.length,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    description,
    tags,
  };

  files.set(id, file);
  saveMeta();
  console.log(`[files] Saved: ${originalName} (${formatSize(buffer.length)}) [${id}]`);
  return file;
}

export function saveFileFromBase64(
  base64Data: string,
  originalName: string,
  uploadedBy: SharedFile["uploadedBy"],
  description?: string,
  tags: string[] = [],
): SharedFile {
  const buffer = Buffer.from(base64Data, "base64");
  return saveFile(buffer, originalName, uploadedBy, description, tags);
}

export function getFileBuffer(id: string): Buffer | null {
  const file = files.get(id);
  if (!file) return null;
  const filePath = join(FILES_DIR, file.storedName);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath);
}

export function getFileBase64(id: string): string | null {
  const buffer = getFileBuffer(id);
  if (!buffer) return null;
  return buffer.toString("base64");
}

export function getFileMeta(id: string): SharedFile | undefined {
  return files.get(id);
}

export function getFilePath(id: string): string | null {
  const file = files.get(id);
  if (!file) return null;
  const filePath = join(FILES_DIR, file.storedName);
  if (!existsSync(filePath)) return null;
  return filePath;
}

export function listFiles(options?: {
  uploadedBy?: SharedFile["uploadedBy"];
  mimeType?: string;
  limit?: number;
}): SharedFile[] {
  let result = Array.from(files.values());

  if (options?.uploadedBy) {
    result = result.filter(f => f.uploadedBy === options.uploadedBy);
  }
  if (options?.mimeType) {
    result = result.filter(f => f.mimeType.startsWith(options.mimeType!));
  }

  result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export function deleteFile(id: string): boolean {
  const file = files.get(id);
  if (!file) return false;

  const filePath = join(FILES_DIR, file.storedName);
  try {
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch { /* ignore */ }

  files.delete(id);
  saveMeta();
  return true;
}

export function getStorageStats(): {
  fileCount: number;
  totalSize: number;
  totalSizeFormatted: string;
  byType: Record<string, number>;
} {
  let totalSize = 0;
  const byType: Record<string, number> = {};

  for (const file of files.values()) {
    totalSize += file.size;
    const type = file.mimeType.split("/")[0];
    byType[type] = (byType[type] || 0) + 1;
  }

  return {
    fileCount: files.size,
    totalSize,
    totalSizeFormatted: formatSize(totalSize),
    byType,
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function cleanupOldFiles(maxAgeDays = 30): number {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const file of files.values()) {
    if (new Date(file.uploadedAt).getTime() < cutoff) {
      deleteFile(file.id);
      deleted++;
    }
  }

  return deleted;
}
