/**
 * String Utils Plugin — Textmanipulering, slug, case-konvertering
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "String Utils",
  version: "1.0.0",
  description: "Strängverktyg: case-konvertering, slug, reverse, truncate, pad, repeat, escape/unescape",
  author: "Gracestack",
  tools: [
    {
      name: "string_transform",
      description: "Transform text: uppercase, lowercase, capitalize, title case, camelCase, snake_case, kebab-case, slug, reverse, trim",
      parameters: {
        text: { type: "string", description: "Text to transform" },
        transform: { type: "string", description: "Transform: upper, lower, capitalize, title, camel, snake, kebab, slug, reverse, trim" },
      },
      handler: (input) => {
        const text = (input.text as string) || "";
        const t = ((input.transform as string) || "upper").toLowerCase();

        switch (t) {
          case "upper": return text.toUpperCase();
          case "lower": return text.toLowerCase();
          case "capitalize": return text.charAt(0).toUpperCase() + text.slice(1);
          case "title": return text.replace(/\b\w/g, c => c.toUpperCase());
          case "camel": {
            const words = text.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
            return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
          }
          case "snake": return text.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/(^_|_$)/g, "").toLowerCase();
          case "kebab": return text.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
          case "slug": return text.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
          case "reverse": return text.split("").reverse().join("");
          case "trim": return text.trim();
          default: return `Unknown transform: ${t}. Use: upper, lower, capitalize, title, camel, snake, kebab, slug, reverse, trim`;
        }
      },
    },
    {
      name: "string_info",
      description: "Get detailed information about a string: length, word count, char frequency, unique chars, encoding info",
      parameters: {
        text: { type: "string", description: "Text to analyze" },
      },
      handler: (input) => {
        const text = (input.text as string) || "";
        const words = text.split(/\s+/).filter(Boolean);
        const lines = text.split("\n");
        const chars = text.length;

        const freq: Record<string, number> = {};
        for (const c of text) {
          freq[c] = (freq[c] || 0) + 1;
        }
        const topChars = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([char, count]) => ({ char: char === " " ? "SPACE" : char === "\n" ? "NEWLINE" : char, count }));

        const hasUnicode = /[^\x00-\x7F]/.test(text);
        const hasEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u.test(text);
        const digits = (text.match(/\d/g) || []).length;
        const letters = (text.match(/[a-zA-Z]/g) || []).length;
        const spaces = (text.match(/\s/g) || []).length;
        const special = chars - digits - letters - spaces;

        return JSON.stringify({
          length: chars,
          words: words.length,
          lines: lines.length,
          bytes: Buffer.byteLength(text, "utf-8"),
          composition: { letters, digits, spaces, special },
          hasUnicode,
          hasEmoji,
          topCharacters: topChars,
        }, null, 2);
      },
    },
    {
      name: "string_generate",
      description: "Generate strings: lorem ipsum, random words, repeated patterns, numbered lists",
      parameters: {
        type: { type: "string", description: "Type: lorem, random, repeat, numbered" },
        count: { type: "number", description: "Count: words for lorem, chars for random, times for repeat, items for numbered (default: 50)" },
        pattern: { type: "string", description: "Pattern for repeat mode, or prefix for numbered mode" },
      },
      handler: (input) => {
        const type = ((input.type as string) || "lorem").toLowerCase();
        const count = Math.min((input.count as number) || 50, 1000);

        switch (type) {
          case "lorem": {
            const words = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");
            const result: string[] = [];
            for (let i = 0; i < count; i++) result.push(words[i % words.length]);
            return result.join(" ");
          }
          case "random": {
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let result = "";
            for (let i = 0; i < count; i++) result += charset[Math.floor(Math.random() * charset.length)];
            return result;
          }
          case "repeat": {
            const pattern = (input.pattern as string) || "=";
            return pattern.repeat(Math.min(count, 1000));
          }
          case "numbered": {
            const prefix = (input.pattern as string) || "Item";
            return Array.from({ length: count }, (_, i) => `${i + 1}. ${prefix} ${i + 1}`).join("\n");
          }
          default:
            return `Unknown type: ${type}. Use: lorem, random, repeat, numbered`;
        }
      },
    },
  ],
};

export default plugin;
