/**
 * Cron Parser Plugin — Tolka, validera och förklara cron-uttryck
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Cron Parser",
  version: "1.0.0",
  description: "Cron-verktyg: tolka cron-uttryck till svenska, beräkna nästa körningar, validera syntax",
  author: "Gracestack",
  tools: [
    {
      name: "cron_explain",
      description: "Explain a cron expression in human-readable format. Supports standard 5-field cron (minute hour day month weekday).",
      parameters: {
        expression: { type: "string", description: "Cron expression, e.g. '0 9 * * 1-5' or '*/15 * * * *'" },
      },
      handler: (input) => {
        const expr = ((input.expression as string) || "").trim();
        const parts = expr.split(/\s+/);
        if (parts.length < 5 || parts.length > 6) {
          return "Error: Invalid cron expression. Expected 5 fields: minute hour day month weekday";
        }

        const [minute, hour, day, month, weekday] = parts;
        const weekdays = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
        const months = ["", "januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

        const descParts: string[] = [];

        // Minute
        if (minute === "*") descParts.push("Varje minut");
        else if (minute.startsWith("*/")) descParts.push(`Var ${minute.slice(2)}:e minut`);
        else descParts.push(`Minut ${minute}`);

        // Hour
        if (hour === "*") descParts.push("varje timme");
        else if (hour.startsWith("*/")) descParts.push(`var ${hour.slice(2)}:e timme`);
        else descParts.push(`klockan ${hour.padStart(2, "0")}:${minute === "*" ? "XX" : minute.padStart(2, "0")}`);

        // Day
        if (day !== "*") {
          if (day.startsWith("*/")) descParts.push(`var ${day.slice(2)}:e dag`);
          else descParts.push(`dag ${day} i månaden`);
        }

        // Month
        if (month !== "*") {
          const monthNames = month.split(",").map(m => {
            const n = parseInt(m);
            return n >= 1 && n <= 12 ? months[n] : m;
          });
          descParts.push(`i ${monthNames.join(", ")}`);
        }

        // Weekday
        if (weekday !== "*") {
          if (weekday.includes("-")) {
            const [from, to] = weekday.split("-").map(Number);
            descParts.push(`${weekdays[from] || from} till ${weekdays[to] || to}`);
          } else {
            const dayNames = weekday.split(",").map(d => weekdays[parseInt(d)] || d);
            descParts.push(`på ${dayNames.join(", ")}`);
          }
        }

        // Common presets
        const presets: Record<string, string> = {
          "* * * * *": "Varje minut",
          "0 * * * *": "Varje hel timme",
          "0 0 * * *": "Varje dag vid midnatt",
          "0 0 * * 0": "Varje söndag vid midnatt",
          "0 0 1 * *": "Första dagen varje månad vid midnatt",
          "0 0 1 1 *": "Varje nyårsdag vid midnatt",
          "0 9 * * 1-5": "Vardagar kl 09:00",
          "0 0 * * 1-5": "Vardagar vid midnatt",
          "*/5 * * * *": "Var 5:e minut",
          "*/15 * * * *": "Var 15:e minut",
          "*/30 * * * *": "Var 30:e minut",
          "0 */2 * * *": "Varannan timme",
          "0 */6 * * *": "Var 6:e timme",
          "0 8-17 * * 1-5": "Varje timme under arbetstid (08-17, mån-fre)",
        };

        const preset = presets[expr];

        return JSON.stringify({
          expression: expr,
          fields: { minute, hour, day, month, weekday },
          description: preset || descParts.join(", "),
          preset: preset ? true : false,
        }, null, 2);
      },
    },
    {
      name: "cron_next",
      description: "Calculate the next N run times for a cron expression. Returns ISO timestamps.",
      parameters: {
        expression: { type: "string", description: "Cron expression (5 fields)" },
        count: { type: "number", description: "Number of next runs to calculate (default: 5, max: 20)" },
      },
      handler: (input) => {
        const expr = ((input.expression as string) || "").trim();
        const parts = expr.split(/\s+/);
        if (parts.length < 5) return "Error: Invalid cron expression";

        const count = Math.min((input.count as number) || 5, 20);
        const [minSpec, hourSpec, daySpec, monthSpec, wdaySpec] = parts;

        const matchField = (spec: string, value: number, max: number): boolean => {
          if (spec === "*") return true;
          for (const part of spec.split(",")) {
            if (part.startsWith("*/")) {
              const step = parseInt(part.slice(2));
              if (value % step === 0) return true;
            } else if (part.includes("-")) {
              const [from, to] = part.split("-").map(Number);
              if (value >= from && value <= to) return true;
            } else {
              if (parseInt(part) === value) return true;
            }
          }
          return false;
        };

        const runs: string[] = [];
        const now = new Date();
        const check = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);

        const maxIterations = 525600; // 1 year of minutes
        for (let i = 0; i < maxIterations && runs.length < count; i++) {
          const m = check.getMinutes();
          const h = check.getHours();
          const d = check.getDate();
          const mo = check.getMonth() + 1;
          const wd = check.getDay();

          if (matchField(minSpec, m, 59) && matchField(hourSpec, h, 23) &&
              matchField(daySpec, d, 31) && matchField(monthSpec, mo, 12) &&
              matchField(wdaySpec, wd, 6)) {
            runs.push(check.toISOString());
          }

          check.setMinutes(check.getMinutes() + 1);
        }

        return JSON.stringify({
          expression: expr,
          nextRuns: runs,
          count: runs.length,
        }, null, 2);
      },
    },
  ],
};

export default plugin;
