/**
 * Regex Helper Plugin — Testa, matcha och ersätt med regex
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Regex Helper",
  version: "1.0.0",
  description: "Testa och använd reguljära uttryck: matcha, ersätt, extrahera grupper",
  author: "Gracestack",
  tools: [
    {
      name: "regex_test",
      description: "Test a regex pattern against text. Returns all matches with positions and capture groups.",
      parameters: {
        pattern: { type: "string", description: "Regex pattern (without delimiters)" },
        text: { type: "string", description: "Text to test against" },
        flags: { type: "string", description: "Regex flags (default: 'gi')" },
      },
      handler: (input) => {
        try {
          const re = new RegExp((input.pattern as string) || ".", (input.flags as string) || "gi");
          const text = (input.text as string) || "";
          const matches: { match: string; index: number; groups: Record<string, string> | null }[] = [];
          let m: RegExpExecArray | null;
          while ((m = re.exec(text)) !== null) {
            matches.push({
              match: m[0],
              index: m.index,
              groups: m.groups || null,
            });
            if (!re.global) break;
          }
          return JSON.stringify({
            pattern: input.pattern,
            flags: (input.flags as string) || "gi",
            matchCount: matches.length,
            matches: matches.slice(0, 50),
          }, null, 2);
        } catch (err) {
          return "Regex error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
    {
      name: "regex_replace",
      description: "Replace text using a regex pattern. Supports capture group references ($1, $2, etc.)",
      parameters: {
        pattern: { type: "string", description: "Regex pattern" },
        replacement: { type: "string", description: "Replacement string (supports $1, $2 for groups)" },
        text: { type: "string", description: "Input text" },
        flags: { type: "string", description: "Regex flags (default: 'gi')" },
      },
      handler: (input) => {
        try {
          const re = new RegExp((input.pattern as string) || ".", (input.flags as string) || "gi");
          const result = ((input.text as string) || "").replace(re, (input.replacement as string) || "");
          return result;
        } catch (err) {
          return "Regex error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
  ],
};

export default plugin;
