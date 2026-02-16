/**
 * JSON Transformer Plugin — Query, format, konvertering
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "JSON Transformer",
  version: "1.2.0",
  description: "JSON-verktyg: dot-notation query, pretty-print/minify, JSON→CSV konvertering",
  author: "Gracestack",
  tools: [
    {
      name: "json_query",
      description: "Extract values from JSON using dot-notation path (e.g. 'users.0.name', 'data.items'). Supports array indexing.",
      parameters: {
        json: { type: "string", description: "JSON string to query" },
        path: { type: "string", description: "Dot-notation path (e.g. 'data.items.0.id')" },
      },
      handler: (input) => {
        try {
          const obj = JSON.parse((input.json as string) || "{}");
          const parts = ((input.path as string) || "").split(".");
          let current: unknown = obj;
          for (const part of parts) {
            if (current == null) return "null (path not found)";
            current = (current as Record<string, unknown>)[part];
          }
          return typeof current === "string" ? current : JSON.stringify(current, null, 2);
        } catch (err) {
          return "JSON query error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
    {
      name: "json_format",
      description: "Pretty-print or minify JSON. Also validates JSON syntax.",
      parameters: {
        json: { type: "string", description: "JSON string to format" },
        minify: { type: "boolean", description: "If true, minify. If false/omitted, pretty-print with 2-space indent." },
      },
      handler: (input) => {
        try {
          const obj = JSON.parse((input.json as string) || "{}");
          if (input.minify) {
            return JSON.stringify(obj);
          }
          return JSON.stringify(obj, null, 2);
        } catch (err) {
          return "Invalid JSON: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
    {
      name: "json_to_csv",
      description: "Convert a JSON array of objects to CSV format. Headers are auto-detected from the first object's keys.",
      parameters: {
        json: { type: "string", description: "JSON array string, e.g. '[{\"name\":\"A\",\"age\":1}]'" },
        delimiter: { type: "string", description: "Column delimiter (default: ','). Use ';' for Swedish Excel." },
      },
      handler: (input) => {
        try {
          const arr = JSON.parse((input.json as string) || "[]");
          if (!Array.isArray(arr) || arr.length === 0) return "Empty or not an array";
          const delim = (input.delimiter as string) || ",";
          const headers = Object.keys(arr[0]);
          const escape = (v: unknown) => {
            const s = v == null ? "" : String(v);
            return s.includes(delim) || s.includes('"') || s.includes("\n")
              ? '"' + s.replace(/"/g, '""') + '"'
              : s;
          };
          const rows = arr.map((obj: Record<string, unknown>) =>
            headers.map(h => escape(obj[h])).join(delim)
          );
          return [headers.join(delim), ...rows].join("\n");
        } catch (err) {
          return "Conversion error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
  ],
};

export default plugin;
