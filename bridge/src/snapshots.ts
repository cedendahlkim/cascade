/**
 * Snapshot & Rollback — Version control for AI state
 *
 * Features:
 * - Create named snapshots of current AI state (memories, conversations, settings)
 * - Restore to any previous snapshot
 * - Auto-snapshot before destructive operations
 * - Diff between snapshots
 * - Prune old snapshots (keep last N)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, rmSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const SNAPSHOTS_DIR = join(DATA_DIR, "snapshots");
const SNAPSHOT_INDEX = join(SNAPSHOTS_DIR, "index.json");

// Files to include in snapshots
const SNAPSHOT_FILES = [
  "memories.json",
  "dashboard-trends.json",
  "dashboard-budget.json",
  "conversation-analytics.json",
  "prompt-lab.json",
  "frank-learnings.json",
  "rag-index.json",
  "projects.json",
  "workflows.json",
  "schedules.json",
  "self-improve.json",
  "plugins.json",
  "security-audit.json",
];

try {
  if (!existsSync(SNAPSHOTS_DIR)) mkdirSync(SNAPSHOTS_DIR, { recursive: true });
} catch { /* ok */ }

// ─── Types ───────────────────────────────────────────────────

export interface Snapshot {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  fileCount: number;
  totalSizeBytes: number;
  auto: boolean;          // true if auto-created
  tags: string[];
}

export interface SnapshotDiff {
  file: string;
  status: "added" | "removed" | "modified" | "unchanged";
  sizeA?: number;
  sizeB?: number;
}

// ─── State ───────────────────────────────────────────────────

let snapshots: Snapshot[] = [];

function loadIndex(): void {
  try {
    if (existsSync(SNAPSHOT_INDEX)) {
      snapshots = JSON.parse(readFileSync(SNAPSHOT_INDEX, "utf-8"));
    }
  } catch { snapshots = []; }
}

function saveIndex(): void {
  try {
    writeFileSync(SNAPSHOT_INDEX, JSON.stringify(snapshots, null, 2), "utf-8");
  } catch { /* ignore */ }
}

loadIndex();

// ─── Core Operations ────────────────────────────────────────

function generateId(): string {
  return `snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createSnapshot(
  name: string,
  description: string = "",
  auto: boolean = false,
  tags: string[] = []
): Snapshot {
  const id = generateId();
  const snapDir = join(SNAPSHOTS_DIR, id);
  mkdirSync(snapDir, { recursive: true });

  let fileCount = 0;
  let totalSizeBytes = 0;

  for (const file of SNAPSHOT_FILES) {
    const src = join(DATA_DIR, file);
    if (existsSync(src)) {
      const dest = join(snapDir, file);
      copyFileSync(src, dest);
      const stat = readFileSync(src);
      totalSizeBytes += stat.length;
      fileCount++;
    }
  }

  const snapshot: Snapshot = {
    id,
    name,
    description,
    createdAt: new Date().toISOString(),
    fileCount,
    totalSizeBytes,
    auto,
    tags,
  };

  snapshots.push(snapshot);
  saveIndex();

  // Auto-prune: keep max 50 snapshots
  pruneSnapshots(50);

  return snapshot;
}

export function listSnapshots(): Snapshot[] {
  return [...snapshots].reverse();
}

export function getSnapshot(id: string): Snapshot | undefined {
  return snapshots.find(s => s.id === id);
}

export function deleteSnapshot(id: string): boolean {
  const idx = snapshots.findIndex(s => s.id === id);
  if (idx === -1) return false;

  const snapDir = join(SNAPSHOTS_DIR, id);
  try {
    if (existsSync(snapDir)) rmSync(snapDir, { recursive: true });
  } catch { /* ignore */ }

  snapshots.splice(idx, 1);
  saveIndex();
  return true;
}

export function restoreSnapshot(id: string): { restored: string[]; skipped: string[] } {
  const snapshot = snapshots.find(s => s.id === id);
  if (!snapshot) throw new Error(`Snapshot ${id} not found`);

  const snapDir = join(SNAPSHOTS_DIR, id);
  if (!existsSync(snapDir)) throw new Error(`Snapshot directory missing: ${id}`);

  // Auto-snapshot current state before restore
  createSnapshot(`Pre-restore (${snapshot.name})`, `Auto-snapshot before restoring: ${id}`, true, ["pre-restore"]);

  const restored: string[] = [];
  const skipped: string[] = [];

  for (const file of SNAPSHOT_FILES) {
    const src = join(snapDir, file);
    const dest = join(DATA_DIR, file);

    if (existsSync(src)) {
      copyFileSync(src, dest);
      restored.push(file);
    } else {
      skipped.push(file);
    }
  }

  return { restored, skipped };
}

export function diffSnapshots(idA: string, idB: string): SnapshotDiff[] {
  const dirA = join(SNAPSHOTS_DIR, idA);
  const dirB = join(SNAPSHOTS_DIR, idB);

  if (!existsSync(dirA)) throw new Error(`Snapshot ${idA} not found`);
  if (!existsSync(dirB)) throw new Error(`Snapshot ${idB} not found`);

  const diffs: SnapshotDiff[] = [];
  const allFiles = new Set([...SNAPSHOT_FILES]);

  for (const file of allFiles) {
    const pathA = join(dirA, file);
    const pathB = join(dirB, file);
    const existsA = existsSync(pathA);
    const existsB = existsSync(pathB);

    if (existsA && existsB) {
      const contentA = readFileSync(pathA, "utf-8");
      const contentB = readFileSync(pathB, "utf-8");
      diffs.push({
        file,
        status: contentA === contentB ? "unchanged" : "modified",
        sizeA: contentA.length,
        sizeB: contentB.length,
      });
    } else if (existsA && !existsB) {
      diffs.push({ file, status: "removed", sizeA: readFileSync(pathA).length });
    } else if (!existsA && existsB) {
      diffs.push({ file, status: "added", sizeB: readFileSync(pathB).length });
    }
  }

  return diffs;
}

export function pruneSnapshots(keep: number = 20): number {
  if (snapshots.length <= keep) return 0;

  // Sort by date, keep newest
  const sorted = [...snapshots].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const toRemove = sorted.slice(keep);

  for (const snap of toRemove) {
    const snapDir = join(SNAPSHOTS_DIR, snap.id);
    try {
      if (existsSync(snapDir)) rmSync(snapDir, { recursive: true });
    } catch { /* ignore */ }
  }

  const removeIds = new Set(toRemove.map(s => s.id));
  snapshots = snapshots.filter(s => !removeIds.has(s.id));
  saveIndex();

  return toRemove.length;
}

export function getSnapshotStats(): {
  total: number;
  totalSizeBytes: number;
  oldestDate: string;
  newestDate: string;
  autoCount: number;
} {
  if (snapshots.length === 0) {
    return { total: 0, totalSizeBytes: 0, oldestDate: "", newestDate: "", autoCount: 0 };
  }

  const sorted = [...snapshots].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    total: snapshots.length,
    totalSizeBytes: snapshots.reduce((s, snap) => s + snap.totalSizeBytes, 0),
    oldestDate: sorted[0].createdAt,
    newestDate: sorted[sorted.length - 1].createdAt,
    autoCount: snapshots.filter(s => s.auto).length,
  };
}
