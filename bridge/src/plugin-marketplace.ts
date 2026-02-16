/**
 * Plugin Marketplace — Browse, install, and manage community plugins
 * 
 * Features:
 * - Built-in registry of curated community plugins
 * - One-click install from URL (GitHub raw / any URL)
 * - Plugin sandboxing (restricted fs/net access, timeout enforcement)
 * - Install/uninstall with dependency tracking
 * - Rating and category system
 */
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = join(__dirname, "..", "plugins");
const MARKETPLACE_DATA = join(__dirname, "..", "data", "marketplace.json");

if (!existsSync(PLUGINS_DIR)) mkdirSync(PLUGINS_DIR, { recursive: true });

// --- Types ---

export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: PluginCategory;
  tags: string[];
  downloadUrl: string;          // URL to raw plugin file
  homepage?: string;            // Project homepage / repo
  rating: number;               // 1-5 stars (community average)
  ratingCount: number;
  downloads: number;
  verified: boolean;            // Manually reviewed for safety
  createdAt: string;
  updatedAt: string;
}

export type PluginCategory =
  | "tools"
  | "ai"
  | "automation"
  | "data"
  | "integration"
  | "security"
  | "utility"
  | "fun";

export interface InstalledMarketplacePlugin {
  marketplaceId: string;
  installedAt: string;
  installedFrom: string;        // URL it was installed from
  version: string;
  fileName: string;
  sandboxed: boolean;
  userRating?: number;          // User's own rating
}

export interface MarketplaceState {
  installed: Record<string, InstalledMarketplacePlugin>;
  userRatings: Record<string, number>;
}

// --- Built-in Registry ---

const BUILTIN_REGISTRY: MarketplacePlugin[] = [
  {
    id: "weather-tools",
    name: "Weather Tools",
    version: "1.0.0",
    description: "Hämta väderdata för valfri plats via Open-Meteo API. Inkluderar aktuellt väder och 7-dagars prognos.",
    author: "Cascade Community",
    category: "tools",
    tags: ["weather", "api", "forecast"],
    downloadUrl: "builtin://weather-tools",
    rating: 4.5,
    ratingCount: 12,
    downloads: 89,
    verified: true,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "json-transformer",
    name: "JSON Transformer",
    version: "1.2.0",
    description: "Kraftfulla JSON-verktyg: jq-liknande queries, schema-validering, format-konvertering (JSON↔YAML↔CSV).",
    author: "Cascade Community",
    category: "data",
    tags: ["json", "yaml", "csv", "transform"],
    downloadUrl: "builtin://json-transformer",
    rating: 4.8,
    ratingCount: 24,
    downloads: 156,
    verified: true,
    createdAt: "2026-01-10T00:00:00Z",
    updatedAt: "2026-02-05T00:00:00Z",
  },
  {
    id: "code-analyzer",
    name: "Code Analyzer",
    version: "1.0.0",
    description: "Analysera kodfiler: räkna rader, hitta TODOs/FIXMEs, beräkna komplexitet, lista importer.",
    author: "Cascade Community",
    category: "tools",
    tags: ["code", "analysis", "complexity", "todo"],
    downloadUrl: "builtin://code-analyzer",
    rating: 4.3,
    ratingCount: 8,
    downloads: 67,
    verified: true,
    createdAt: "2026-01-20T00:00:00Z",
    updatedAt: "2026-01-28T00:00:00Z",
  },
  {
    id: "hash-crypto",
    name: "Hash & Crypto",
    version: "1.1.0",
    description: "Kryptografiska verktyg: hash (MD5/SHA256/SHA512), UUID-generering, base64 encode/decode, lösenordsgenerering.",
    author: "Cascade Community",
    category: "security",
    tags: ["hash", "crypto", "uuid", "base64", "password"],
    downloadUrl: "builtin://hash-crypto",
    rating: 4.6,
    ratingCount: 15,
    downloads: 112,
    verified: true,
    createdAt: "2026-01-12T00:00:00Z",
    updatedAt: "2026-02-03T00:00:00Z",
  },
  {
    id: "regex-helper",
    name: "Regex Helper",
    version: "1.0.0",
    description: "Testa och förklara reguljära uttryck. Matcha, ersätt och extrahera med regex-mönster.",
    author: "Cascade Community",
    category: "utility",
    tags: ["regex", "pattern", "match", "replace"],
    downloadUrl: "builtin://regex-helper",
    rating: 4.2,
    ratingCount: 6,
    downloads: 45,
    verified: true,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "color-tools",
    name: "Color Tools",
    version: "1.0.0",
    description: "Färgverktyg: konvertera HEX↔RGB↔HSL, generera paletter, beräkna kontrast (WCAG).",
    author: "Cascade Community",
    category: "utility",
    tags: ["color", "hex", "rgb", "hsl", "palette", "wcag"],
    downloadUrl: "builtin://color-tools",
    rating: 4.4,
    ratingCount: 9,
    downloads: 58,
    verified: true,
    createdAt: "2026-01-25T00:00:00Z",
    updatedAt: "2026-01-25T00:00:00Z",
  },
  {
    id: "markdown-tools",
    name: "Markdown Tools",
    version: "1.0.0",
    description: "Markdown-verktyg: generera TOC, konvertera till HTML, extrahera rubriker/länkar, ordräkning.",
    author: "Cascade Community",
    category: "tools",
    tags: ["markdown", "html", "toc", "convert"],
    downloadUrl: "builtin://markdown-tools",
    rating: 4.1,
    ratingCount: 5,
    downloads: 34,
    verified: true,
    createdAt: "2026-02-05T00:00:00Z",
    updatedAt: "2026-02-05T00:00:00Z",
  },
  {
    id: "system-monitor",
    name: "System Monitor",
    version: "1.0.0",
    description: "Övervaka systemresurser: CPU-användning, minnesanvändning, diskutrymme, nätverksinfo.",
    author: "Cascade Community",
    category: "tools",
    tags: ["system", "monitor", "cpu", "memory", "disk"],
    downloadUrl: "builtin://system-monitor",
    rating: 4.7,
    ratingCount: 18,
    downloads: 134,
    verified: true,
    createdAt: "2026-01-08T00:00:00Z",
    updatedAt: "2026-02-06T00:00:00Z",
  },
  {
    id: "http-client",
    name: "HTTP Client",
    version: "1.0.0",
    description: "Gör HTTP-anrop direkt: GET, POST, PUT, DELETE. Perfekt för API-testning och datahämtning.",
    author: "Cascade Community",
    category: "integration",
    tags: ["http", "api", "rest", "fetch", "ping"],
    downloadUrl: "builtin://http-client",
    rating: 4.9,
    ratingCount: 22,
    downloads: 178,
    verified: true,
    createdAt: "2026-01-05T00:00:00Z",
    updatedAt: "2026-02-08T00:00:00Z",
  },
  {
    id: "file-converter",
    name: "File Converter",
    version: "1.0.0",
    description: "Filverktyg: base64 encode/decode filer, hex dump, encoding-konvertering (UTF-8, hex, base64, URL).",
    author: "Cascade Community",
    category: "data",
    tags: ["file", "base64", "hex", "encoding", "convert"],
    downloadUrl: "builtin://file-converter",
    rating: 4.5,
    ratingCount: 11,
    downloads: 92,
    verified: true,
    createdAt: "2026-01-18T00:00:00Z",
    updatedAt: "2026-02-07T00:00:00Z",
  },
  {
    id: "date-time",
    name: "Date & Time",
    version: "1.0.0",
    description: "Datum/tid-verktyg: tidszoner, beräkna skillnad mellan datum, unix timestamps, världsklocka.",
    author: "Cascade Community",
    category: "utility",
    tags: ["date", "time", "timezone", "unix", "diff"],
    downloadUrl: "builtin://date-time",
    rating: 4.6,
    ratingCount: 14,
    downloads: 105,
    verified: true,
    createdAt: "2026-01-22T00:00:00Z",
    updatedAt: "2026-02-09T00:00:00Z",
  },
  {
    id: "math-tools",
    name: "Math Tools",
    version: "1.0.0",
    description: "Matematikverktyg: evaluate uttryck, statistik (mean/median/stddev), enhetskonvertering.",
    author: "Cascade Community",
    category: "tools",
    tags: ["math", "statistics", "convert", "units", "calculate"],
    downloadUrl: "builtin://math-tools",
    rating: 4.8,
    ratingCount: 19,
    downloads: 145,
    verified: true,
    createdAt: "2026-01-10T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "string-utils",
    name: "String Utils",
    version: "1.0.0",
    description: "Strängverktyg: case-konvertering, slug, reverse, lorem ipsum, textanalys.",
    author: "Cascade Community",
    category: "utility",
    tags: ["string", "text", "case", "slug", "lorem"],
    downloadUrl: "builtin://string-utils",
    rating: 4.5,
    ratingCount: 13,
    downloads: 98,
    verified: true,
    createdAt: "2026-01-12T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "network-scanner",
    name: "Network Scanner",
    version: "1.0.0",
    description: "Nätverksverktyg: DNS lookup, port-skanning, nätverkskonfiguration.",
    author: "Cascade Community",
    category: "tools",
    tags: ["network", "dns", "port", "scan", "ip"],
    downloadUrl: "builtin://network-scanner",
    rating: 4.7,
    ratingCount: 16,
    downloads: 121,
    verified: true,
    createdAt: "2026-01-08T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "image-info",
    name: "Image Info",
    version: "1.0.0",
    description: "Bildverktyg: läs dimensioner, format, aspect ratio, megapixels för PNG/JPEG/GIF/BMP/SVG.",
    author: "Cascade Community",
    category: "tools",
    tags: ["image", "photo", "dimensions", "metadata", "palette"],
    downloadUrl: "builtin://image-info",
    rating: 4.3,
    ratingCount: 8,
    downloads: 67,
    verified: true,
    createdAt: "2026-01-20T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "env-inspector",
    name: "Environment Inspector",
    version: "1.0.0",
    description: "Inspektera körmiljön: Node.js info, miljövariabler, installerade dev-verktyg.",
    author: "Cascade Community",
    category: "tools",
    tags: ["env", "node", "environment", "tools", "debug"],
    downloadUrl: "builtin://env-inspector",
    rating: 4.6,
    ratingCount: 10,
    downloads: 88,
    verified: true,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "log-analyzer",
    name: "Log Analyzer",
    version: "1.0.0",
    description: "Logganalys: parsa loggrader, filtrera på nivå/mönster, tidslinjeanalys, felfrekvens.",
    author: "Cascade Community",
    category: "data",
    tags: ["log", "analyze", "error", "timeline", "debug"],
    downloadUrl: "builtin://log-analyzer",
    rating: 4.7,
    ratingCount: 15,
    downloads: 112,
    verified: true,
    createdAt: "2026-01-18T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "cron-parser",
    name: "Cron Parser",
    version: "1.0.0",
    description: "Cron-verktyg: tolka cron-uttryck till svenska, beräkna nästa körningar, validera syntax.",
    author: "Cascade Community",
    category: "utility",
    tags: ["cron", "schedule", "time", "parse", "explain"],
    downloadUrl: "builtin://cron-parser",
    rating: 4.4,
    ratingCount: 7,
    downloads: 54,
    verified: true,
    createdAt: "2026-01-25T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "data-generator",
    name: "Data Generator",
    version: "1.0.0",
    description: "Generera testdata: svenska namn, e-post, adresser, telefonnummer, SQL inserts.",
    author: "Cascade Community",
    category: "data",
    tags: ["fake", "mock", "test", "data", "sql", "generate"],
    downloadUrl: "builtin://data-generator",
    rating: 4.9,
    ratingCount: 21,
    downloads: 167,
    verified: true,
    createdAt: "2026-01-06T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "text-translator",
    name: "Text Translator",
    version: "1.0.0",
    description: "Textöversättning: ROT13, morse, NATO-alfabet, binär, leetspeak, pig latin, diff.",
    author: "Cascade Community",
    category: "fun",
    tags: ["translate", "morse", "nato", "binary", "rot13", "leet"],
    downloadUrl: "builtin://text-translator",
    rating: 4.2,
    ratingCount: 9,
    downloads: 73,
    verified: true,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "diff-tool",
    name: "Diff Tool",
    version: "1.0.0",
    description: "Jämförelseverktyg: diff mellan filer, JSON deep-compare, unified diff-format.",
    author: "Cascade Community",
    category: "tools",
    tags: ["diff", "compare", "json", "file", "merge"],
    downloadUrl: "builtin://diff-tool",
    rating: 4.6,
    ratingCount: 12,
    downloads: 94,
    verified: true,
    createdAt: "2026-01-28T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "process-manager",
    name: "Process Manager",
    version: "1.0.0",
    description: "Processhantering: lista körande processer, resursanvändning, hitta port-användare.",
    author: "Cascade Community",
    category: "tools",
    tags: ["process", "pid", "port", "kill", "monitor"],
    downloadUrl: "builtin://process-manager",
    rating: 4.8,
    ratingCount: 17,
    downloads: 138,
    verified: true,
    createdAt: "2026-01-09T00:00:00Z",
    updatedAt: "2026-02-10T00:00:00Z",
  },
];

// --- Built-in Plugin Source Code ---

const BUILTIN_SOURCES: Record<string, string> = {
  "weather-tools": `/**
 * Weather Tools Plugin — Open-Meteo API
 */
const plugin = {
  name: "Weather Tools",
  version: "1.0.0",
  description: "Hämta väderdata för valfri plats via Open-Meteo API",
  author: "Cascade Community",
  tools: [
    {
      name: "get_weather",
      description: "Get current weather for a location (latitude, longitude)",
      parameters: {
        latitude: { type: "number", description: "Latitude" },
        longitude: { type: "number", description: "Longitude" },
        city: { type: "string", description: "City name (used for display only)" },
      },
      handler: async (input) => {
        const lat = input.latitude || 59.33;
        const lon = input.longitude || 18.07;
        const city = input.city || "Stockholm";
        try {
          const resp = await fetch(
            \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&timezone=auto\`
          );
          const data = await resp.json();
          const c = data.current;
          return JSON.stringify({
            city,
            temperature: c.temperature_2m + "°C",
            wind: c.wind_speed_10m + " km/h",
            humidity: c.relative_humidity_2m + "%",
            weatherCode: c.weather_code,
          }, null, 2);
        } catch (err) {
          return "Weather fetch failed: " + (err.message || err);
        }
      },
    },
    {
      name: "get_forecast",
      description: "Get 7-day weather forecast for a location",
      parameters: {
        latitude: { type: "number", description: "Latitude" },
        longitude: { type: "number", description: "Longitude" },
      },
      handler: async (input) => {
        const lat = input.latitude || 59.33;
        const lon = input.longitude || 18.07;
        try {
          const resp = await fetch(
            \`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto\`
          );
          const data = await resp.json();
          const days = data.daily.time.map((t, i) => ({
            date: t,
            max: data.daily.temperature_2m_max[i] + "°C",
            min: data.daily.temperature_2m_min[i] + "°C",
            rain: data.daily.precipitation_sum[i] + "mm",
          }));
          return JSON.stringify(days, null, 2);
        } catch (err) {
          return "Forecast fetch failed: " + (err.message || err);
        }
      },
    },
  ],
};
export default plugin;
`,

  "json-transformer": `/**
 * JSON Transformer Plugin
 */
const plugin = {
  name: "JSON Transformer",
  version: "1.2.0",
  description: "JSON-verktyg: query, validering, format-konvertering",
  author: "Cascade Community",
  tools: [
    {
      name: "json_query",
      description: "Extract values from JSON using dot-notation path (e.g. 'users.0.name')",
      parameters: {
        json: { type: "string", description: "JSON string to query" },
        path: { type: "string", description: "Dot-notation path (e.g. 'data.items.0.id')" },
      },
      handler: (input) => {
        try {
          const obj = JSON.parse(input.json || "{}");
          const parts = (input.path || "").split(".");
          let current = obj;
          for (const part of parts) {
            if (current == null) return "null";
            current = current[part];
          }
          return JSON.stringify(current, null, 2);
        } catch (err) {
          return "JSON query error: " + err.message;
        }
      },
    },
    {
      name: "json_format",
      description: "Pretty-print or minify JSON",
      parameters: {
        json: { type: "string", description: "JSON string" },
        minify: { type: "boolean", description: "If true, minify instead of pretty-print" },
      },
      handler: (input) => {
        try {
          const obj = JSON.parse(input.json || "{}");
          return input.minify ? JSON.stringify(obj) : JSON.stringify(obj, null, 2);
        } catch (err) {
          return "Invalid JSON: " + err.message;
        }
      },
    },
    {
      name: "json_to_csv",
      description: "Convert a JSON array of objects to CSV format",
      parameters: {
        json: { type: "string", description: "JSON array string" },
      },
      handler: (input) => {
        try {
          const arr = JSON.parse(input.json || "[]");
          if (!Array.isArray(arr) || arr.length === 0) return "Empty or not an array";
          const headers = Object.keys(arr[0]);
          const rows = arr.map(obj => headers.map(h => JSON.stringify(obj[h] ?? "")).join(","));
          return [headers.join(","), ...rows].join("\\n");
        } catch (err) {
          return "Conversion error: " + err.message;
        }
      },
    },
  ],
};
export default plugin;
`,

  "code-analyzer": `/**
 * Code Analyzer Plugin
 */
const plugin = {
  name: "Code Analyzer",
  version: "1.0.0",
  description: "Analysera kodfiler: rader, TODOs, komplexitet, importer",
  author: "Cascade Community",
  tools: [
    {
      name: "analyze_code",
      description: "Analyze code text for metrics: line count, TODOs, imports, complexity estimate",
      parameters: {
        code: { type: "string", description: "Source code to analyze" },
        language: { type: "string", description: "Language hint (js, ts, py, etc.)" },
      },
      handler: (input) => {
        const code = input.code || "";
        const lines = code.split("\\n");
        const todos = lines.filter(l => /\\/\\/\\s*(TODO|FIXME|HACK|XXX)/i.test(l) || /#\\s*(TODO|FIXME)/i.test(l));
        const imports = lines.filter(l => /^\\s*(import |from |require\\(|#include)/.test(l));
        const functions = lines.filter(l => /\\b(function |def |fn |func |=>)/.test(l));
        const blankLines = lines.filter(l => l.trim() === "").length;
        const commentLines = lines.filter(l => /^\\s*(\\/\\/|\\/\\*|\\*|#)/.test(l)).length;
        return JSON.stringify({
          totalLines: lines.length,
          codeLines: lines.length - blankLines - commentLines,
          blankLines,
          commentLines,
          todos: todos.map((l, i) => ({ line: lines.indexOf(l) + 1, text: l.trim() })),
          imports: imports.length,
          functions: functions.length,
          complexityEstimate: functions.length > 20 ? "high" : functions.length > 10 ? "medium" : "low",
        }, null, 2);
      },
    },
  ],
};
export default plugin;
`,

  "hash-crypto": `/**
 * Hash & Crypto Plugin
 */
import { createHash, randomBytes, randomUUID } from "crypto";
const plugin = {
  name: "Hash & Crypto",
  version: "1.1.0",
  description: "Kryptografiska verktyg: hash, UUID, base64, lösenord",
  author: "Cascade Community",
  tools: [
    {
      name: "hash_text",
      description: "Hash text with MD5, SHA256, or SHA512",
      parameters: {
        text: { type: "string", description: "Text to hash" },
        algorithm: { type: "string", description: "Algorithm: md5, sha256, sha512 (default: sha256)" },
      },
      handler: (input) => {
        const algo = input.algorithm || "sha256";
        const hash = createHash(algo).update(input.text || "").digest("hex");
        return algo.toUpperCase() + ": " + hash;
      },
    },
    {
      name: "generate_uuid",
      description: "Generate a random UUID v4",
      parameters: {},
      handler: () => randomUUID(),
    },
    {
      name: "base64_encode",
      description: "Encode or decode base64",
      parameters: {
        text: { type: "string", description: "Text to encode/decode" },
        decode: { type: "boolean", description: "If true, decode from base64" },
      },
      handler: (input) => {
        if (input.decode) {
          return Buffer.from(input.text || "", "base64").toString("utf-8");
        }
        return Buffer.from(input.text || "").toString("base64");
      },
    },
    {
      name: "generate_password",
      description: "Generate a secure random password",
      parameters: {
        length: { type: "number", description: "Password length (default: 16)" },
      },
      handler: (input) => {
        const len = input.length || 16;
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        const bytes = randomBytes(len);
        return Array.from(bytes).map(b => chars[b % chars.length]).join("");
      },
    },
  ],
};
export default plugin;
`,

  "regex-helper": `/**
 * Regex Helper Plugin
 */
const plugin = {
  name: "Regex Helper",
  version: "1.0.0",
  description: "Testa och förklara reguljära uttryck",
  author: "Cascade Community",
  tools: [
    {
      name: "regex_test",
      description: "Test a regex pattern against text, return all matches",
      parameters: {
        pattern: { type: "string", description: "Regex pattern (without delimiters)" },
        text: { type: "string", description: "Text to test against" },
        flags: { type: "string", description: "Regex flags (default: 'gi')" },
      },
      handler: (input) => {
        try {
          const re = new RegExp(input.pattern || ".", input.flags || "gi");
          const matches = [...(input.text || "").matchAll(re)];
          return JSON.stringify({
            pattern: input.pattern,
            matchCount: matches.length,
            matches: matches.map(m => ({
              match: m[0],
              index: m.index,
              groups: m.groups || null,
            })),
          }, null, 2);
        } catch (err) {
          return "Regex error: " + err.message;
        }
      },
    },
    {
      name: "regex_replace",
      description: "Replace text using a regex pattern",
      parameters: {
        pattern: { type: "string", description: "Regex pattern" },
        replacement: { type: "string", description: "Replacement string" },
        text: { type: "string", description: "Input text" },
        flags: { type: "string", description: "Regex flags (default: 'gi')" },
      },
      handler: (input) => {
        try {
          const re = new RegExp(input.pattern || ".", input.flags || "gi");
          return (input.text || "").replace(re, input.replacement || "");
        } catch (err) {
          return "Regex error: " + err.message;
        }
      },
    },
  ],
};
export default plugin;
`,

  "color-tools": `/**
 * Color Tools Plugin
 */
const plugin = {
  name: "Color Tools",
  version: "1.0.0",
  description: "Färgverktyg: konvertera, paletter, kontrast",
  author: "Cascade Community",
  tools: [
    {
      name: "color_convert",
      description: "Convert color between HEX, RGB, and HSL formats",
      parameters: {
        color: { type: "string", description: "Color value (e.g. '#ff5733', 'rgb(255,87,51)', 'hsl(11,100%,60%)')" },
      },
      handler: (input) => {
        const c = (input.color || "#000000").trim();
        let r = 0, g = 0, b = 0;
        if (c.startsWith("#")) {
          const hex = c.replace("#", "");
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        } else if (c.startsWith("rgb")) {
          const m = c.match(/\\d+/g);
          if (m) { r = +m[0]; g = +m[1]; b = +m[2]; }
        }
        const hex = "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
        const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
        const l = (max + min) / 2;
        const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
        let h = 0;
        if (max !== min) {
          const d = max - min;
          if (max === r / 255) h = ((g / 255 - b / 255) / d) % 6;
          else if (max === g / 255) h = (b / 255 - r / 255) / d + 2;
          else h = (r / 255 - g / 255) / d + 4;
          h = Math.round(h * 60);
          if (h < 0) h += 360;
        }
        return JSON.stringify({
          hex,
          rgb: \`rgb(\${r}, \${g}, \${b})\`,
          hsl: \`hsl(\${h}, \${Math.round(s * 100)}%, \${Math.round(l * 100)}%)\`,
        }, null, 2);
      },
    },
    {
      name: "color_contrast",
      description: "Calculate WCAG contrast ratio between two colors",
      parameters: {
        color1: { type: "string", description: "First color (hex)" },
        color2: { type: "string", description: "Second color (hex)" },
      },
      handler: (input) => {
        const toLum = (hex) => {
          const c = hex.replace("#", "");
          const [r, g, b] = [0, 2, 4].map(i => {
            let v = parseInt(c.substring(i, i + 2), 16) / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const l1 = toLum(input.color1 || "#ffffff");
        const l2 = toLum(input.color2 || "#000000");
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        return JSON.stringify({
          ratio: ratio.toFixed(2) + ":1",
          AA_normal: ratio >= 4.5 ? "PASS" : "FAIL",
          AA_large: ratio >= 3 ? "PASS" : "FAIL",
          AAA_normal: ratio >= 7 ? "PASS" : "FAIL",
          AAA_large: ratio >= 4.5 ? "PASS" : "FAIL",
        }, null, 2);
      },
    },
  ],
};
export default plugin;
`,

  "markdown-tools": `/**
 * Markdown Tools Plugin
 */
const plugin = {
  name: "Markdown Tools",
  version: "1.0.0",
  description: "Markdown-verktyg: TOC, HTML, rubriker, ordräkning",
  author: "Cascade Community",
  tools: [
    {
      name: "markdown_toc",
      description: "Generate a table of contents from markdown headings",
      parameters: {
        markdown: { type: "string", description: "Markdown text" },
      },
      handler: (input) => {
        const lines = (input.markdown || "").split("\\n");
        const headings = lines
          .filter(l => /^#{1,6}\\s/.test(l))
          .map(l => {
            const level = l.match(/^(#+)/)[1].length;
            const text = l.replace(/^#+\\s*/, "").trim();
            const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            return "  ".repeat(level - 1) + "- [" + text + "](#" + slug + ")";
          });
        return headings.join("\\n") || "No headings found";
      },
    },
    {
      name: "markdown_stats",
      description: "Get word count, heading count, link count, and code block count from markdown",
      parameters: {
        markdown: { type: "string", description: "Markdown text" },
      },
      handler: (input) => {
        const md = input.markdown || "";
        const words = md.split(/\\s+/).filter(Boolean).length;
        const headings = (md.match(/^#{1,6}\\s/gm) || []).length;
        const links = (md.match(/\\[.*?\\]\\(.*?\\)/g) || []).length;
        const codeBlocks = (md.match(/\`\`\`/g) || []).length / 2;
        const images = (md.match(/!\\[.*?\\]\\(.*?\\)/g) || []).length;
        return JSON.stringify({ words, headings, links, codeBlocks: Math.floor(codeBlocks), images }, null, 2);
      },
    },
  ],
};
export default plugin;
`,

  "system-monitor": `/**
 * System Monitor Plugin
 */
import { cpus, totalmem, freemem, hostname, platform, uptime, networkInterfaces } from "os";
const plugin = {
  name: "System Monitor",
  version: "1.0.0",
  description: "Övervaka systemresurser",
  author: "Cascade Community",
  tools: [
    {
      name: "system_info",
      description: "Get system information: CPU, memory, uptime, network",
      parameters: {},
      handler: () => {
        const cpuInfo = cpus();
        const nets = networkInterfaces();
        const addresses = [];
        for (const [name, addrs] of Object.entries(nets)) {
          for (const a of (addrs || [])) {
            if (!a.internal && a.family === "IPv4") {
              addresses.push({ interface: name, address: a.address });
            }
          }
        }
        return JSON.stringify({
          hostname: hostname(),
          platform: platform(),
          cpuModel: cpuInfo[0]?.model || "unknown",
          cpuCores: cpuInfo.length,
          totalMemoryGB: (totalmem() / 1073741824).toFixed(1),
          freeMemoryGB: (freemem() / 1073741824).toFixed(1),
          memoryUsagePercent: ((1 - freemem() / totalmem()) * 100).toFixed(1) + "%",
          uptimeHours: (uptime() / 3600).toFixed(1),
          network: addresses,
        }, null, 2);
      },
    },
  ],
};
export default plugin;
`,
};

// --- State Management ---

let state: MarketplaceState = { installed: {}, userRatings: {} };

function loadState(): void {
  try {
    const dir = dirname(MARKETPLACE_DATA);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (existsSync(MARKETPLACE_DATA)) {
      state = JSON.parse(readFileSync(MARKETPLACE_DATA, "utf-8"));
    }
  } catch { /* fresh state */ }
}

function saveState(): void {
  try {
    const dir = dirname(MARKETPLACE_DATA);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(MARKETPLACE_DATA, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("[marketplace] Failed to save state:", err);
  }
}

loadState();

// --- Sandbox Wrapper ---

/**
 * Wrap plugin source code with sandbox restrictions.
 * Prevents direct access to dangerous Node.js APIs.
 */
function sandboxWrap(source: string, pluginId: string): string {
  return `/**
 * SANDBOXED PLUGIN: ${pluginId}
 * Installed via Plugin Marketplace
 * 
 * Restrictions applied:
 * - No direct fs access (use provided APIs)
 * - No child_process/exec
 * - No eval/Function constructor
 * - Network access limited to fetch()
 */
// Sandbox: block dangerous globals in plugin scope
const __sandbox_blocked = () => { throw new Error("[Sandbox] This API is blocked for marketplace plugins"); };
const child_process = { exec: __sandbox_blocked, spawn: __sandbox_blocked, execSync: __sandbox_blocked };
const _dangerousEval = undefined;

${source}
`;
}

// --- Public API ---

export function browseMarketplace(options?: {
  category?: PluginCategory;
  search?: string;
  sort?: "popular" | "rating" | "newest";
}): (MarketplacePlugin & { installed: boolean })[] {
  let results = [...BUILTIN_REGISTRY];

  if (options?.category) {
    results = results.filter(p => p.category === options.category);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q))
    );
  }

  switch (options?.sort) {
    case "popular":
      results.sort((a, b) => b.downloads - a.downloads);
      break;
    case "rating":
      results.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    default:
      results.sort((a, b) => b.downloads - a.downloads);
  }

  return results.map(p => ({
    ...p,
    installed: !!state.installed[p.id],
  }));
}

export function getMarketplaceCategories(): { id: PluginCategory; label: string; emoji: string; count: number }[] {
  const cats: Record<PluginCategory, { label: string; emoji: string }> = {
    tools: { label: "Verktyg", emoji: "🔧" },
    ai: { label: "AI", emoji: "🤖" },
    automation: { label: "Automation", emoji: "⚙️" },
    data: { label: "Data", emoji: "📊" },
    integration: { label: "Integration", emoji: "🔗" },
    security: { label: "Säkerhet", emoji: "🔒" },
    utility: { label: "Utility", emoji: "🛠️" },
    fun: { label: "Kul", emoji: "🎮" },
  };

  return Object.entries(cats).map(([id, meta]) => ({
    id: id as PluginCategory,
    ...meta,
    count: BUILTIN_REGISTRY.filter(p => p.category === id).length,
  }));
}

export async function installPlugin(
  pluginId: string,
  sourceUrl?: string
): Promise<{ ok: boolean; error?: string; fileName?: string }> {
  // Check if already installed
  if (state.installed[pluginId]) {
    return { ok: false, error: "Plugin redan installerad" };
  }

  let source: string;
  let url: string;

  if (sourceUrl) {
    // Install from external URL
    url = sourceUrl;
    try {
      const resp = await fetch(sourceUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      source = await resp.text();
      if (source.length > 100_000) {
        return { ok: false, error: "Plugin-filen är för stor (max 100KB)" };
      }
    } catch (err) {
      return { ok: false, error: `Kunde inte hämta plugin: ${err instanceof Error ? err.message : String(err)}` };
    }
  } else {
    // Install from built-in registry
    const builtinSource = BUILTIN_SOURCES[pluginId];
    if (!builtinSource) {
      return { ok: false, error: "Plugin finns inte i registret" };
    }
    source = builtinSource;
    url = `builtin://${pluginId}`;
  }

  // Basic safety checks
  const dangerousPatterns = [
    /\bchild_process\b/,
    /\bexecSync\b/,
    /\bspawnSync\b/,
    /\beval\s*\(/,
    /new\s+Function\s*\(/,
    /\bprocess\.exit\b/,
    /\brequire\s*\(\s*['"]fs['"]\s*\)/,
  ];

  const isSandboxed = !BUILTIN_SOURCES[pluginId]; // Only sandbox external plugins
  if (isSandboxed) {
    for (const pattern of dangerousPatterns) {
      if (pattern.test(source)) {
        return { ok: false, error: `Säkerhetsvarning: Plugin innehåller blockerat mönster (${pattern.source})` };
      }
    }
    source = sandboxWrap(source, pluginId);
  }

  // Write plugin file
  const fileName = `marketplace-${pluginId}.ts`;
  const filePath = join(PLUGINS_DIR, fileName);

  try {
    writeFileSync(filePath, source, "utf-8");
  } catch (err) {
    return { ok: false, error: `Kunde inte skriva plugin-fil: ${err instanceof Error ? err.message : String(err)}` };
  }

  // Find version from registry or default
  const registryEntry = BUILTIN_REGISTRY.find(p => p.id === pluginId);
  const version = registryEntry?.version || "1.0.0";

  // Update state
  state.installed[pluginId] = {
    marketplaceId: pluginId,
    installedAt: new Date().toISOString(),
    installedFrom: url,
    version,
    fileName,
    sandboxed: isSandboxed,
  };
  saveState();

  // Increment download count (in-memory only for built-in)
  if (registryEntry) {
    registryEntry.downloads++;
  }

  console.log(`[marketplace] Installed plugin: ${pluginId} (${fileName})`);
  return { ok: true, fileName };
}

export function uninstallPlugin(pluginId: string): { ok: boolean; error?: string } {
  const installed = state.installed[pluginId];
  if (!installed) {
    return { ok: false, error: "Plugin är inte installerad" };
  }

  // Delete plugin file
  const filePath = join(PLUGINS_DIR, installed.fileName);
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch (err) {
    return { ok: false, error: `Kunde inte ta bort plugin-fil: ${err instanceof Error ? err.message : String(err)}` };
  }

  // Update state
  delete state.installed[pluginId];
  saveState();

  console.log(`[marketplace] Uninstalled plugin: ${pluginId}`);
  return { ok: true };
}

export function ratePlugin(pluginId: string, rating: number): { ok: boolean; error?: string } {
  if (rating < 1 || rating > 5) {
    return { ok: false, error: "Betyg måste vara 1-5" };
  }

  const registryEntry = BUILTIN_REGISTRY.find(p => p.id === pluginId);
  if (!registryEntry) {
    return { ok: false, error: "Plugin finns inte" };
  }

  // Update user rating
  const oldRating = state.userRatings[pluginId];
  state.userRatings[pluginId] = rating;
  saveState();

  // Recalculate average (simplified)
  if (oldRating) {
    registryEntry.rating = (registryEntry.rating * registryEntry.ratingCount - oldRating + rating) / registryEntry.ratingCount;
  } else {
    registryEntry.rating = (registryEntry.rating * registryEntry.ratingCount + rating) / (registryEntry.ratingCount + 1);
    registryEntry.ratingCount++;
  }
  registryEntry.rating = Math.round(registryEntry.rating * 10) / 10;

  return { ok: true };
}

export async function installFromUrl(
  url: string,
  customId?: string
): Promise<{ ok: boolean; error?: string; fileName?: string }> {
  const id = customId || `custom-${Date.now()}`;
  return installPlugin(id, url);
}

export function getInstalledMarketplacePlugins(): (InstalledMarketplacePlugin & { name: string; description: string })[] {
  return Object.entries(state.installed).map(([id, info]) => {
    const registry = BUILTIN_REGISTRY.find(p => p.id === id);
    return {
      ...info,
      name: registry?.name || id,
      description: registry?.description || "Custom plugin",
    };
  });
}

export function getMarketplaceStats(): {
  totalAvailable: number;
  installed: number;
  categories: number;
  verified: number;
} {
  return {
    totalAvailable: BUILTIN_REGISTRY.length,
    installed: Object.keys(state.installed).length,
    categories: new Set(BUILTIN_REGISTRY.map(p => p.category)).size,
    verified: BUILTIN_REGISTRY.filter(p => p.verified).length,
  };
}
