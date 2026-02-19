import { Router } from "express";
import {
  getAnalyticsOverview,
  getModelAnalytics,
  getActivityHeatmap,
  getCostForecast,
  getSessionStats,
  getDailyCosts,
  getHourlyTrend,
  exportAnalyticsCsv,
} from "../conversation-analytics.js";

const router = Router();

router.get("/overview", (req, res) => {
  const days = parseInt(String(req.query.days) || "30", 10);
  res.json(getAnalyticsOverview(days));
});

router.get("/models", (req, res) => {
  const days = parseInt(String(req.query.days) || "30", 10);
  res.json(getModelAnalytics(days));
});

router.get("/heatmap", (req, res) => {
  const days = parseInt(String(req.query.days) || "30", 10);
  res.json(getActivityHeatmap(days));
});

router.get("/forecast", (_req, res) => {
  res.json(getCostForecast());
});

router.get("/sessions", (_req, res) => {
  res.json(getSessionStats());
});

router.get("/costs", (req, res) => {
  const days = parseInt(String(req.query.days) || "30", 10);
  res.json(getDailyCosts(days));
});

router.get("/hourly", (req, res) => {
  const hours = parseInt(String(req.query.hours) || "48", 10);
  res.json(getHourlyTrend(hours));
});

router.get("/export/csv", (_req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=analytics.csv");
  res.send(exportAnalyticsCsv());
});

export default router;
