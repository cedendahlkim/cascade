/**
 * Example Plugin for Gracestack AI Lab
 * 
 * Demonstrates the plugin interface. Copy this as a template for new plugins.
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Example Plugin",
  version: "1.0.0",
  description: "Demonstrates the plugin system with simple utility tools",
  author: "Gracestack",
  tools: [
    {
      name: "random_number",
      description: "Generate a random number between min and max",
      parameters: {
        min: { type: "number", description: "Minimum value (default: 1)" },
        max: { type: "number", description: "Maximum value (default: 100)" },
      },
      handler: (input) => {
        const min = (input.min as number) || 1;
        const max = (input.max as number) || 100;
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        return `Random number: ${num}`;
      },
    },
    {
      name: "timestamp",
      description: "Get the current timestamp in various formats",
      parameters: {
        format: { type: "string", description: "Format: iso, unix, human (default: iso)" },
      },
      handler: (input) => {
        const now = new Date();
        const format = (input.format as string) || "iso";
        switch (format) {
          case "unix": return `${Math.floor(now.getTime() / 1000)}`;
          case "human": return now.toLocaleString("sv-SE");
          default: return now.toISOString();
        }
      },
    },
    {
      name: "text_stats",
      description: "Get statistics about a text (word count, char count, etc.)",
      parameters: {
        text: { type: "string", description: "Text to analyze" },
      },
      handler: (input) => {
        const text = (input.text as string) || "";
        const words = text.split(/\s+/).filter(Boolean);
        const chars = text.length;
        const lines = text.split("\n").length;
        const sentences = text.split(/[.!?]+/).filter(Boolean).length;
        return JSON.stringify({ words: words.length, chars, lines, sentences }, null, 2);
      },
    },
  ],
};

export default plugin;
