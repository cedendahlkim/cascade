/**
 * Markdown Tools Plugin — TOC, statistik, HTML-konvertering
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Markdown Tools",
  version: "1.0.0",
  description: "Markdown-verktyg: generera TOC, extrahera rubriker/länkar, ordräkning och statistik",
  author: "Gracestack",
  tools: [
    {
      name: "markdown_toc",
      description: "Generate a table of contents from markdown headings. Returns a clickable markdown TOC.",
      parameters: {
        markdown: { type: "string", description: "Markdown text to generate TOC from" },
        maxDepth: { type: "number", description: "Maximum heading depth to include (default: 3, i.e. h1-h3)" },
      },
      handler: (input) => {
        const md = (input.markdown as string) || "";
        const maxDepth = (input.maxDepth as number) || 3;
        const lines = md.split("\n");
        const headings = lines
          .filter(l => /^#{1,6}\s/.test(l))
          .map(l => {
            const match = l.match(/^(#+)\s+(.*)/);
            if (!match) return null;
            const level = match[1].length;
            const text = match[2].trim();
            if (level > maxDepth) return null;
            const slug = text.toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/\s+/g, "-")
              .replace(/(^-|-$)/g, "");
            return { level, text, slug };
          })
          .filter(Boolean) as { level: number; text: string; slug: string }[];

        if (headings.length === 0) return "No headings found in the markdown text.";

        const toc = headings.map(h =>
          "  ".repeat(h.level - 1) + `- [${h.text}](#${h.slug})`
        ).join("\n");

        return `## Table of Contents\n\n${toc}`;
      },
    },
    {
      name: "markdown_stats",
      description: "Get comprehensive statistics from markdown: word count, headings, links, code blocks, images, reading time",
      parameters: {
        markdown: { type: "string", description: "Markdown text to analyze" },
      },
      handler: (input) => {
        const md = (input.markdown as string) || "";
        const words = md.split(/\s+/).filter(Boolean).length;
        const chars = md.length;
        const lines = md.split("\n").length;
        const headings = (md.match(/^#{1,6}\s/gm) || []).length;
        const links = (md.match(/\[.*?\]\(.*?\)/g) || []).length;
        const images = (md.match(/!\[.*?\]\(.*?\)/g) || []).length;
        const codeBlocks = (md.match(/```/g) || []).length / 2;
        const inlineCode = (md.match(/`[^`]+`/g) || []).length;
        const bold = (md.match(/\*\*[^*]+\*\*/g) || []).length;
        const italic = (md.match(/(?<!\*)\*(?!\*)[^*]+\*(?!\*)/g) || []).length;
        const lists = (md.match(/^[\s]*[-*+]\s/gm) || []).length;
        const orderedLists = (md.match(/^[\s]*\d+\.\s/gm) || []).length;
        const blockquotes = (md.match(/^>\s/gm) || []).length;
        const readingTimeMin = Math.max(1, Math.ceil(words / 200));

        return JSON.stringify({
          words,
          characters: chars,
          lines,
          readingTime: `~${readingTimeMin} min`,
          structure: {
            headings,
            links,
            images,
            codeBlocks: Math.floor(codeBlocks),
            inlineCode,
            bold,
            italic,
            bulletLists: lists,
            orderedLists,
            blockquotes,
          },
        }, null, 2);
      },
    },
  ],
};

export default plugin;
