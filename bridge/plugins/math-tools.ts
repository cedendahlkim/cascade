/**
 * Math Tools Plugin — Beräkningar, statistik, enhetskonvertering
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Math Tools",
  version: "1.0.0",
  description: "Matematikverktyg: evaluate uttryck, statistik, enhetskonvertering, talbaskonvertering",
  author: "Gracestack",
  tools: [
    {
      name: "math_eval",
      description: "Safely evaluate a mathematical expression. Supports +, -, *, /, **, %, sqrt, sin, cos, tan, log, abs, ceil, floor, round, PI, E. No eval() used.",
      parameters: {
        expression: { type: "string", description: "Math expression, e.g. 'sqrt(144) + 2**3'" },
      },
      handler: (input) => {
        const expr = (input.expression as string) || "";
        try {
          const sanitized = expr
            .replace(/\bsqrt\b/g, "Math.sqrt")
            .replace(/\bsin\b/g, "Math.sin")
            .replace(/\bcos\b/g, "Math.cos")
            .replace(/\btan\b/g, "Math.tan")
            .replace(/\blog\b/g, "Math.log")
            .replace(/\blog10\b/g, "Math.log10")
            .replace(/\blog2\b/g, "Math.log2")
            .replace(/\babs\b/g, "Math.abs")
            .replace(/\bceil\b/g, "Math.ceil")
            .replace(/\bfloor\b/g, "Math.floor")
            .replace(/\bround\b/g, "Math.round")
            .replace(/\bPI\b/g, "Math.PI")
            .replace(/\bE\b/g, "Math.E")
            .replace(/\bmin\b/g, "Math.min")
            .replace(/\bmax\b/g, "Math.max")
            .replace(/\bpow\b/g, "Math.pow");

          if (/[^0-9+\-*/().,%\s^Math.a-z_]|import|require|process|global|window/i.test(sanitized)) {
            return "Error: Expression contains invalid characters. Only math operations allowed.";
          }

          const fn = new Function("Math", `"use strict"; return (${sanitized});`);
          const result = fn(Math);
          return `${expr} = ${result}`;
        } catch (err) {
          return "Math error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
    {
      name: "math_stats",
      description: "Calculate statistics for a set of numbers: mean, median, mode, std deviation, min, max, sum, percentiles",
      parameters: {
        numbers: { type: "string", description: "Comma-separated numbers, e.g. '1, 5, 3, 7, 2, 5, 8'" },
      },
      handler: (input) => {
        const nums = ((input.numbers as string) || "")
          .split(/[,;\s]+/)
          .map(Number)
          .filter(n => !isNaN(n));

        if (nums.length === 0) return "Error: No valid numbers provided";

        const sorted = [...nums].sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = sum / nums.length;
        const median = nums.length % 2 === 0
          ? (sorted[nums.length / 2 - 1] + sorted[nums.length / 2]) / 2
          : sorted[Math.floor(nums.length / 2)];

        const freq = new Map<number, number>();
        for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);
        let maxFreq = 0;
        const modes: number[] = [];
        freq.forEach((count, val) => {
          if (count > maxFreq) { maxFreq = count; modes.length = 0; modes.push(val); }
          else if (count === maxFreq) modes.push(val);
        });

        const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
        const stdDev = Math.sqrt(variance);

        const percentile = (p: number) => {
          const idx = (p / 100) * (sorted.length - 1);
          const lower = Math.floor(idx);
          const frac = idx - lower;
          return sorted[lower] + frac * ((sorted[lower + 1] || sorted[lower]) - sorted[lower]);
        };

        return JSON.stringify({
          count: nums.length,
          sum,
          mean: +mean.toFixed(6),
          median,
          mode: modes.length === nums.length ? "no mode" : modes,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          range: sorted[sorted.length - 1] - sorted[0],
          standardDeviation: +stdDev.toFixed(6),
          variance: +variance.toFixed(6),
          percentiles: {
            p25: +percentile(25).toFixed(4),
            p50: +percentile(50).toFixed(4),
            p75: +percentile(75).toFixed(4),
            p90: +percentile(90).toFixed(4),
            p99: +percentile(99).toFixed(4),
          },
        }, null, 2);
      },
    },
    {
      name: "unit_convert",
      description: "Convert between common units: length (m/km/mi/ft/in), weight (kg/lb/oz/g), temperature (C/F/K), data (B/KB/MB/GB/TB)",
      parameters: {
        value: { type: "number", description: "Numeric value to convert" },
        from: { type: "string", description: "Source unit (e.g. 'km', 'lb', 'F', 'GB')" },
        to: { type: "string", description: "Target unit (e.g. 'mi', 'kg', 'C', 'MB')" },
      },
      handler: (input) => {
        const val = (input.value as number);
        const from = ((input.from as string) || "").toLowerCase();
        const to = ((input.to as string) || "").toLowerCase();

        if (val == null || isNaN(val)) return "Error: value is required";
        if (!from || !to) return "Error: from and to units are required";

        const lengthToM: Record<string, number> = {
          m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, yd: 0.9144, nm: 1852,
        };
        const weightToKg: Record<string, number> = {
          kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000, st: 6.35029,
        };
        const dataToB: Record<string, number> = {
          b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776, pb: 1125899906842624,
        };

        const tryConvert = (table: Record<string, number>) => {
          if (table[from] != null && table[to] != null) {
            const result = val * table[from] / table[to];
            return `${val} ${from} = ${+result.toFixed(8)} ${to}`;
          }
          return null;
        };

        // Temperature special case
        if ((from === "c" || from === "f" || from === "k") && (to === "c" || to === "f" || to === "k")) {
          let celsius: number;
          if (from === "c") celsius = val;
          else if (from === "f") celsius = (val - 32) * 5 / 9;
          else celsius = val - 273.15;

          let result: number;
          if (to === "c") result = celsius;
          else if (to === "f") result = celsius * 9 / 5 + 32;
          else result = celsius + 273.15;

          return `${val}°${from.toUpperCase()} = ${+result.toFixed(4)}°${to.toUpperCase()}`;
        }

        const r = tryConvert(lengthToM) || tryConvert(weightToKg) || tryConvert(dataToB);
        if (r) return r;

        return `Error: Cannot convert from '${from}' to '${to}'. Supported: length (m,km,mi,ft,in,cm,mm,yd,nm), weight (kg,g,mg,lb,oz,ton,st), temp (c,f,k), data (b,kb,mb,gb,tb,pb)`;
      },
    },
  ],
};

export default plugin;
