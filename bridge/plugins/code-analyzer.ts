/**
 * Code Analyzer Plugin — LOC, TODOs, komplexitet, importer
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Code Analyzer",
  version: "1.0.0",
  description: "Analysera kod: räkna rader, hitta TODOs/FIXMEs, beräkna komplexitet, lista importer",
  author: "Gracestack",
  tools: [
    {
      name: "analyze_code",
      description: "Analyze source code for metrics: line count, TODOs/FIXMEs, imports, function count, complexity estimate, comment ratio",
      parameters: {
        code: { type: "string", description: "Source code to analyze" },
        language: { type: "string", description: "Language hint: js, ts, py, java, c, go, rust (optional, auto-detected)" },
      },
      handler: (input) => {
        const code = (input.code as string) || "";
        const lines = code.split("\n");
        const lang = (input.language as string) || detectLanguage(code);

        const todoPattern = /\/\/\s*(TODO|FIXME|HACK|XXX|BUG|WARN)/i;
        const pyTodoPattern = /#\s*(TODO|FIXME|HACK|XXX|BUG)/i;
        const todos = lines
          .map((l, i) => ({ line: i + 1, text: l.trim(), match: todoPattern.test(l) || pyTodoPattern.test(l) }))
          .filter(t => t.match)
          .map(t => ({ line: t.line, text: t.text }));

        const importLines = lines.filter(l =>
          /^\s*(import |from |require\(|#include|using |use )/.test(l)
        );

        const functionPatterns = [
          /\bfunction\s+\w+/,
          /\b(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/,
          /\bdef\s+\w+/,
          /\bfn\s+\w+/,
          /\bfunc\s+\w+/,
          /\b(public|private|protected|static)\s+\w+\s*\(/,
          /=>\s*{/,
        ];
        const functionLines = lines.filter(l => functionPatterns.some(p => p.test(l)));

        const blankLines = lines.filter(l => l.trim() === "").length;
        const commentLines = lines.filter(l =>
          /^\s*(\/\/|\/\*|\*|#(?!include)|"""|'''|<!--)/.test(l)
        ).length;
        const codeLines = lines.length - blankLines - commentLines;

        const ifCount = (code.match(/\b(if|else if|elif|switch|case|catch)\b/g) || []).length;
        const loopCount = (code.match(/\b(for|while|do|foreach|\.map\(|\.forEach\(|\.reduce\()\b/g) || []).length;
        const nestingDepth = Math.max(...lines.map(l => {
          const indent = l.match(/^(\s*)/)?.[1].length || 0;
          return Math.floor(indent / 2);
        }));

        const complexityScore = ifCount + loopCount + functionLines.length;
        const complexity = complexityScore > 30 ? "high" : complexityScore > 15 ? "medium" : "low";

        return JSON.stringify({
          language: lang,
          lines: {
            total: lines.length,
            code: codeLines,
            blank: blankLines,
            comment: commentLines,
            commentRatio: lines.length > 0 ? (commentLines / lines.length * 100).toFixed(1) + "%" : "0%",
          },
          functions: functionLines.length,
          imports: importLines.length,
          complexity: {
            level: complexity,
            score: complexityScore,
            branches: ifCount,
            loops: loopCount,
            maxNesting: nestingDepth,
          },
          todos: {
            count: todos.length,
            items: todos.slice(0, 20),
          },
        }, null, 2);
      },
    },
    {
      name: "find_duplicates",
      description: "Find duplicate or near-duplicate lines in code (potential copy-paste issues)",
      parameters: {
        code: { type: "string", description: "Source code to check" },
        minLength: { type: "number", description: "Minimum line length to consider (default: 20)" },
      },
      handler: (input) => {
        const code = (input.code as string) || "";
        const minLen = (input.minLength as number) || 20;
        const lines = code.split("\n");
        const seen = new Map<string, number[]>();

        lines.forEach((line, i) => {
          const trimmed = line.trim();
          if (trimmed.length >= minLen && !trimmed.startsWith("//") && !trimmed.startsWith("*") && !trimmed.startsWith("#")) {
            const existing = seen.get(trimmed) || [];
            existing.push(i + 1);
            seen.set(trimmed, existing);
          }
        });

        const duplicates = Array.from(seen.entries())
          .filter(([, lns]) => lns.length > 1)
          .map(([text, lns]) => ({ text: text.slice(0, 100), lines: lns, count: lns.length }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15);

        return JSON.stringify({
          duplicateGroups: duplicates.length,
          totalDuplicateLines: duplicates.reduce((s, d) => s + d.count - 1, 0),
          duplicates,
        }, null, 2);
      },
    },
  ],
};

function detectLanguage(code: string): string {
  if (/\bimport\s+.*\s+from\s+['"]/.test(code) || /:\s*(string|number|boolean)\b/.test(code)) return "typescript";
  if (/\bconst\s+\w+\s*=\s*require\(/.test(code)) return "javascript";
  if (/\bdef\s+\w+.*:/.test(code) || /\bimport\s+\w+/.test(code)) return "python";
  if (/\bfunc\s+\w+/.test(code) && /\bpackage\s+/.test(code)) return "go";
  if (/\bfn\s+\w+/.test(code) && /\blet\s+mut\b/.test(code)) return "rust";
  if (/\bpublic\s+class\b/.test(code)) return "java";
  if (/\b#include\b/.test(code)) return "c/c++";
  return "unknown";
}

export default plugin;
