/**
 * Log Analyzer Plugin — Parsning, filtrering, statistik av loggfiler
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Log Analyzer",
  version: "1.0.0",
  description: "Logganalys: parsa loggrader, filtrera på nivå/mönster, statistik, tidslinjeanalys",
  author: "Gracestack",
  tools: [
    {
      name: "parse_logs",
      description: "Parse and analyze log text. Detects log levels (ERROR, WARN, INFO, DEBUG), timestamps, and patterns. Returns statistics and filtered entries.",
      parameters: {
        logs: { type: "string", description: "Log text to analyze (multi-line)" },
        level: { type: "string", description: "Filter by level: error, warn, info, debug, all (default: all)" },
        pattern: { type: "string", description: "Optional regex pattern to filter log lines" },
        limit: { type: "number", description: "Max lines to return (default: 50)" },
      },
      handler: (input) => {
        const logs = (input.logs as string) || "";
        const level = ((input.level as string) || "all").toLowerCase();
        const pattern = input.pattern ? new RegExp(input.pattern as string, "i") : null;
        const limit = (input.limit as number) || 50;

        const lines = logs.split("\n").filter(l => l.trim());

        const levelPattern = /\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL|CRITICAL)\b/i;
        const timestampPattern = /(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/;

        const parsed = lines.map((line, i) => {
          const levelMatch = line.match(levelPattern);
          const tsMatch = line.match(timestampPattern);
          return {
            line: i + 1,
            level: levelMatch ? levelMatch[1].toUpperCase().replace("WARNING", "WARN") : "UNKNOWN",
            timestamp: tsMatch ? tsMatch[1] : null,
            text: line.trim(),
          };
        });

        const stats = {
          total: parsed.length,
          error: parsed.filter(p => p.level === "ERROR" || p.level === "FATAL" || p.level === "CRITICAL").length,
          warn: parsed.filter(p => p.level === "WARN").length,
          info: parsed.filter(p => p.level === "INFO").length,
          debug: parsed.filter(p => p.level === "DEBUG" || p.level === "TRACE").length,
          unknown: parsed.filter(p => p.level === "UNKNOWN").length,
        };

        let filtered = parsed;
        if (level !== "all") {
          const levelMap: Record<string, string[]> = {
            error: ["ERROR", "FATAL", "CRITICAL"],
            warn: ["WARN"],
            info: ["INFO"],
            debug: ["DEBUG", "TRACE"],
          };
          const allowed = levelMap[level] || [level.toUpperCase()];
          filtered = filtered.filter(p => allowed.includes(p.level));
        }
        if (pattern) {
          filtered = filtered.filter(p => pattern.test(p.text));
        }

        return JSON.stringify({
          stats,
          errorRate: stats.total > 0 ? (stats.error / stats.total * 100).toFixed(1) + "%" : "0%",
          filtered: filtered.length,
          entries: filtered.slice(0, limit),
        }, null, 2);
      },
    },
    {
      name: "log_timeline",
      description: "Create a timeline from log entries showing event frequency over time. Useful for finding spikes and patterns.",
      parameters: {
        logs: { type: "string", description: "Log text with timestamps" },
        bucketSize: { type: "string", description: "Time bucket: minute, hour, day (default: hour)" },
      },
      handler: (input) => {
        const logs = (input.logs as string) || "";
        const bucketSize = ((input.bucketSize as string) || "hour").toLowerCase();
        const lines = logs.split("\n").filter(l => l.trim());

        const tsPattern = /(\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2})/;
        const levelPattern = /\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|FATAL|CRITICAL)\b/i;

        const buckets: Record<string, { total: number; errors: number; warns: number }> = {};

        for (const line of lines) {
          const tsMatch = line.match(tsPattern);
          if (!tsMatch) continue;

          const ts = new Date(tsMatch[1].replace(/\//g, "-"));
          if (isNaN(ts.getTime())) continue;

          let key: string;
          if (bucketSize === "minute") {
            key = `${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())} ${pad(ts.getHours())}:${pad(ts.getMinutes())}`;
          } else if (bucketSize === "day") {
            key = `${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())}`;
          } else {
            key = `${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())} ${pad(ts.getHours())}:00`;
          }

          if (!buckets[key]) buckets[key] = { total: 0, errors: 0, warns: 0 };
          buckets[key].total++;

          const levelMatch = line.match(levelPattern);
          if (levelMatch) {
            const lvl = levelMatch[1].toUpperCase();
            if (lvl === "ERROR" || lvl === "FATAL" || lvl === "CRITICAL") buckets[key].errors++;
            if (lvl === "WARN" || lvl === "WARNING") buckets[key].warns++;
          }
        }

        const timeline = Object.entries(buckets)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, data]) => ({
            time,
            total: data.total,
            errors: data.errors,
            warns: data.warns,
            bar: "█".repeat(Math.min(data.total, 50)) + (data.errors > 0 ? ` ⚠${data.errors}` : ""),
          }));

        return JSON.stringify({
          bucketSize,
          buckets: timeline.length,
          timeline,
        }, null, 2);
      },
    },
  ],
};

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

export default plugin;
