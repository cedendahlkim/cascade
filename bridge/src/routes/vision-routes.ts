import { Router } from "express";
import { analyzeImage, getAvailableVisionModels, type VisionRequest } from "../vision.js";

const router = Router();

router.get("/models", (_req, res) => {
  res.json(getAvailableVisionModels());
});

router.post("/analyze", async (req, res) => {
  try {
    const request: VisionRequest = req.body;
    const result = await analyzeImage(request);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Vision analysis failed" });
  }
});

export default router;
