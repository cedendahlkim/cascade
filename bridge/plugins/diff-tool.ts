/**
 * Diff Tool Plugin — Jämför filer, texter, JSON-objekt
 */
import type { PluginManifest } from "../src/plugin-loader.js";
import { readFileSync, existsSync } from "fs";

const plugin: PluginManifest = {
  name: "Diff Tool",
  version: "1.0.0",
  description: "Jämförelseverktyg: diff mellan filer, JSON-objekt, och texter med detaljerad rapport",
  author: "Gracestack",
  tools: [
    {
      name: "diff_files",
      description: "Compare two files and show a unified diff. Supports text files of any type.",
      parameters: {
        file1: { type: "string", description: "Path to first file" },
        file2: { type: "string", description: "Path to second file" },
        context: { type: "number", description: "Number of context lines around changes (default: 3)" },
      },
      handler: (input) => {
        const f1 = (input.file1 as string) || "";
        const f2 = (input.file2 as string) || "";
        if (!f1 || !f2) return "Error: Both file1 and file2 are required";
        if (!existsSync(f1)) return `Error: File not found: ${f1}`;
        if (!existsSync(f2)) return `Error: File not found: ${f2}`;

        try {
          const lines1 = readFileSync(f1, "utf-8").split("\n");
          const lines2 = readFileSync(f2, "utf-8").split("\n");
          const ctx = (input.context as number) || 3;

          return unifiedDiff(f1, f2, lines1, lines2, ctx);
        } catch (err) {
          return "Error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
    {
      name: "diff_json",
      description: "Deep compare two JSON objects and show all differences: added, removed, changed keys with paths.",
      parameters: {
        json1: { type: "string", description: "First JSON string" },
        json2: { type: "string", description: "Second JSON string" },
      },
      handler: (input) => {
        try {
          const obj1 = JSON.parse((input.json1 as string) || "{}");
          const obj2 = JSON.parse((input.json2 as string) || "{}");

          const diffs: { path: string; type: string; oldValue?: unknown; newValue?: unknown }[] = [];

          function compare(a: unknown, b: unknown, path: string) {
            if (a === b) return;
            if (a === null || b === null || typeof a !== typeof b) {
              diffs.push({ path, type: "changed", oldValue: a, newValue: b });
              return;
            }
            if (typeof a !== "object") {
              diffs.push({ path, type: "changed", oldValue: a, newValue: b });
              return;
            }
            if (Array.isArray(a) && Array.isArray(b)) {
              const maxLen = Math.max(a.length, b.length);
              for (let i = 0; i < maxLen; i++) {
                if (i >= a.length) diffs.push({ path: `${path}[${i}]`, type: "added", newValue: b[i] });
                else if (i >= b.length) diffs.push({ path: `${path}[${i}]`, type: "removed", oldValue: a[i] });
                else compare(a[i], b[i], `${path}[${i}]`);
              }
              return;
            }
            const aObj = a as Record<string, unknown>;
            const bObj = b as Record<string, unknown>;
            const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
            for (const key of allKeys) {
              const p = path ? `${path}.${key}` : key;
              if (!(key in aObj)) diffs.push({ path: p, type: "added", newValue: bObj[key] });
              else if (!(key in bObj)) diffs.push({ path: p, type: "removed", oldValue: aObj[key] });
              else compare(aObj[key], bObj[key], p);
            }
          }

          compare(obj1, obj2, "");

          return JSON.stringify({
            totalDifferences: diffs.length,
            added: diffs.filter(d => d.type === "added").length,
            removed: diffs.filter(d => d.type === "removed").length,
            changed: diffs.filter(d => d.type === "changed").length,
            differences: diffs.slice(0, 50),
          }, null, 2);
        } catch (err) {
          return "Error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
  ],
};

function unifiedDiff(name1: string, name2: string, lines1: string[], lines2: string[], ctx: number): string {
  const changes: { type: string; line1: number; line2: number; text: string }[] = [];
  const maxLen = Math.max(lines1.length, lines2.length);
  let added = 0, removed = 0, unchanged = 0;

  for (let i = 0; i < maxLen; i++) {
    if (i >= lines1.length) {
      changes.push({ type: "+", line1: -1, line2: i, text: lines2[i] });
      added++;
    } else if (i >= lines2.length) {
      changes.push({ type: "-", line1: i, line2: -1, text: lines1[i] });
      removed++;
    } else if (lines1[i] !== lines2[i]) {
      changes.push({ type: "-", line1: i, line2: -1, text: lines1[i] });
      changes.push({ type: "+", line1: -1, line2: i, text: lines2[i] });
      added++;
      removed++;
    } else {
      changes.push({ type: " ", line1: i, line2: i, text: lines1[i] });
      unchanged++;
    }
  }

  // Filter to show only context around changes
  const isChange = changes.map(c => c.type !== " ");
  const visible = new Set<number>();
  for (let i = 0; i < changes.length; i++) {
    if (isChange[i]) {
      for (let j = Math.max(0, i - ctx); j <= Math.min(changes.length - 1, i + ctx); j++) {
        visible.add(j);
      }
    }
  }

  const output = [`--- ${name1}`, `+++ ${name2}`, ""];
  for (let i = 0; i < changes.length; i++) {
    if (!visible.has(i)) continue;
    if (i > 0 && !visible.has(i - 1)) output.push("...");
    output.push(`${changes[i].type} ${changes[i].text}`);
  }

  output.push("", `Summary: +${added} -${removed} ~${unchanged} unchanged`);
  return output.join("\n");
}

export default plugin;
