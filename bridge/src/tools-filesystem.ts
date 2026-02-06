/**
 * Filesystem tools for the AI agent.
 * 
 * Provides read, write, list, search, and file info capabilities
 * with security checks on every operation.
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from "fs";
import { join, relative, extname } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { checkPathPermission, auditLog } from "./security.js";

function audit(tool: string, input: string, allowed: boolean, reason?: string) {
  auditLog({ timestamp: new Date().toISOString(), tool, input, allowed, reason });
}

export const FILESYSTEM_TOOLS: Anthropic.Tool[] = [
  {
    name: "read_file",
    description: "Read the contents of a file on the computer. Use this to inspect code, configs, logs, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Absolute file path to read" },
        max_lines: { type: "number", description: "Max lines to return (default: 200)" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write or overwrite a file on the computer. Creates parent directories if needed.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Absolute file path to write" },
        content: { type: "string", description: "File content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_directory",
    description: "List files and directories at a given path. Shows name, type, and size.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Absolute directory path" },
        recursive: { type: "boolean", description: "List recursively (default: false, max depth 3)" },
      },
      required: ["path"],
    },
  },
  {
    name: "search_files",
    description: "Search for files by name pattern or search file contents with a text query.",
    input_schema: {
      type: "object" as const,
      properties: {
        directory: { type: "string", description: "Directory to search in" },
        pattern: { type: "string", description: "Filename pattern (e.g. '*.ts', 'README*')" },
        content_query: { type: "string", description: "Search inside files for this text" },
        max_results: { type: "number", description: "Max results (default: 20)" },
      },
      required: ["directory"],
    },
  },
  {
    name: "file_info",
    description: "Get detailed info about a file (size, modified date, type).",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Absolute file path" },
      },
      required: ["path"],
    },
  },
];

function listDir(dirPath: string, recursive: boolean, depth: number = 0, maxDepth: number = 3): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const fullPath = join(dirPath, entry.name);
      const type = entry.isDirectory() ? "DIR" : "FILE";
      let size = "";
      if (entry.isFile()) {
        try { size = ` (${statSync(fullPath).size} bytes)`; } catch { /* skip */ }
      }
      results.push(`${"  ".repeat(depth)}[${type}] ${entry.name}${size}`);
      if (recursive && entry.isDirectory() && depth < maxDepth) {
        results.push(...listDir(fullPath, true, depth + 1, maxDepth));
      }
    }
  } catch (err) {
    results.push(`Error reading directory: ${err}`);
  }
  return results;
}

function searchByPattern(dir: string, pattern: string, maxResults: number): string[] {
  const results: string[] = [];
  const regex = new RegExp(
    "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
    "i"
  );

  function walk(d: string, depth: number) {
    if (depth > 5 || results.length >= maxResults) return;
    try {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxResults) return;
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        const full = join(d, entry.name);
        if (entry.isFile() && regex.test(entry.name)) {
          results.push(full);
        }
        if (entry.isDirectory()) {
          walk(full, depth + 1);
        }
      }
    } catch { /* skip */ }
  }

  walk(dir, 0);
  return results;
}

function searchByContent(dir: string, query: string, maxResults: number): string[] {
  const results: string[] = [];
  const q = query.toLowerCase();
  const textExts = [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".txt", ".css", ".html", ".yaml", ".yml", ".toml", ".cfg", ".ini", ".env.example"];

  function walk(d: string, depth: number) {
    if (depth > 4 || results.length >= maxResults) return;
    try {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxResults) return;
        if (entry.name === "node_modules" || entry.name.startsWith(".git")) continue;
        const full = join(d, entry.name);
        if (entry.isFile() && textExts.includes(extname(entry.name).toLowerCase())) {
          try {
            const content = readFileSync(full, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(q)) {
                results.push(`${full}:${i + 1}: ${lines[i].trim().slice(0, 120)}`);
                if (results.length >= maxResults) return;
              }
            }
          } catch { /* skip binary/unreadable */ }
        }
        if (entry.isDirectory()) {
          walk(full, depth + 1);
        }
      }
    } catch { /* skip */ }
  }

  walk(dir, 0);
  return results;
}

export function handleFilesystemTool(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "read_file": {
      const path = input.path as string;
      const check = checkPathPermission(path, "read");
      audit("read_file", path, check.allowed, check.reason);
      if (!check.allowed) return `🚫 Access denied: ${check.reason}`;
      if (!existsSync(path)) return `File not found: ${path}`;
      try {
        const content = readFileSync(path, "utf-8");
        const maxLines = (input.max_lines as number) || 200;
        const lines = content.split("\n");
        const truncated = lines.length > maxLines;
        const output = lines.slice(0, maxLines).join("\n");
        return truncated
          ? `${output}\n\n... (${lines.length - maxLines} more lines truncated)`
          : output;
      } catch (err) {
        return `Error reading file: ${err}`;
      }
    }

    case "write_file": {
      const path = input.path as string;
      const content = input.content as string;
      const check = checkPathPermission(path, "write");
      audit("write_file", path, check.allowed, check.reason);
      if (!check.allowed) return `🚫 Access denied: ${check.reason}`;
      try {
        const dir = path.replace(/[/\\][^/\\]+$/, "");
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(path, content, "utf-8");
        return `File written: ${path} (${content.length} chars)`;
      } catch (err) {
        return `Error writing file: ${err}`;
      }
    }

    case "list_directory": {
      const path = input.path as string;
      const recursive = (input.recursive as boolean) || false;
      const check = checkPathPermission(path, "read");
      audit("list_directory", path, check.allowed, check.reason);
      if (!check.allowed) return `🚫 Access denied: ${check.reason}`;
      if (!existsSync(path)) return `Directory not found: ${path}`;
      const items = listDir(path, recursive);
      return items.length > 0 ? items.join("\n") : "Empty directory.";
    }

    case "search_files": {
      const dir = input.directory as string;
      const check = checkPathPermission(dir, "read");
      audit("search_files", `${dir} pattern=${input.pattern || ""} query=${input.content_query || ""}`, check.allowed, check.reason);
      if (!check.allowed) return `🚫 Access denied: ${check.reason}`;
      const maxResults = (input.max_results as number) || 20;

      const results: string[] = [];
      if (input.pattern) {
        results.push(...searchByPattern(dir, input.pattern as string, maxResults));
      }
      if (input.content_query) {
        results.push(...searchByContent(dir, input.content_query as string, maxResults));
      }
      if (results.length === 0 && !input.pattern && !input.content_query) {
        return "Provide either 'pattern' or 'content_query' to search.";
      }
      return results.length > 0 ? results.join("\n") : "No results found.";
    }

    case "file_info": {
      const path = input.path as string;
      const check = checkPathPermission(path, "read");
      audit("file_info", path, check.allowed, check.reason);
      if (!check.allowed) return `🚫 Access denied: ${check.reason}`;
      if (!existsSync(path)) return `Not found: ${path}`;
      try {
        const stat = statSync(path);
        return [
          `Path: ${path}`,
          `Type: ${stat.isDirectory() ? "directory" : "file"}`,
          `Size: ${stat.size} bytes`,
          `Modified: ${stat.mtime.toISOString()}`,
          `Created: ${stat.birthtime.toISOString()}`,
        ].join("\n");
      } catch (err) {
        return `Error: ${err}`;
      }
    }

    default:
      return `Unknown filesystem tool: ${name}`;
  }
}
