import { Router } from "express";
import {
  createSnapshot,
  listSnapshots,
  getSnapshot,
  deleteSnapshot,
  restoreSnapshot,
  diffSnapshots,
  getSnapshotStats,
  pruneSnapshots,
} from "../snapshots.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(listSnapshots());
});

router.get("/stats", (_req, res) => {
  res.json(getSnapshotStats());
});

router.get("/:id", (req, res) => {
  const snap = getSnapshot(req.params.id);
  if (!snap) return res.status(404).json({ error: "Not found" });
  res.json(snap);
});

router.post("/", (req, res) => {
  try {
    const { name, description, tags } = req.body;
    const snap = createSnapshot(name || `Snapshot ${new Date().toISOString()}`, description, false, tags);
    res.json(snap);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed" });
  }
});

router.post("/:id/restore", (req, res) => {
  try {
    const result = restoreSnapshot(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed" });
  }
});

router.post("/diff", (req, res) => {
  try {
    const { idA, idB } = req.body;
    res.json(diffSnapshots(idA, idB));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed" });
  }
});

router.delete("/:id", (req, res) => {
  const ok = deleteSnapshot(req.params.id);
  res.json({ ok });
});

router.post("/prune", (req, res) => {
  const keep = parseInt(String(req.body.keep) || "20", 10);
  const removed = pruneSnapshots(keep);
  res.json({ removed });
});

export default router;
