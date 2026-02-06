/**
 * Web & Internet tools for the AI agent.
 * 
 * - web_search: Search the internet via DuckDuckGo (no API key needed)
 * - fetch_url: Fetch and extract text from any URL
 * - download_file: Download a file to disk
 * - run_javascript: Execute JavaScript code and return result
 * - http_request: Make arbitrary HTTP requests (GET/POST/PUT/DELETE)
 */
import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

export const WEB_TOOLS: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the internet. Returns top results with titles, URLs, and snippets. Use this when you need current information, facts, documentation, or anything not in your training data.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        max_results: { type: "number", description: "Max results to return (default: 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_url",
    description:
      "Fetch a URL and extract its text content. Works with web pages, APIs, JSON endpoints, etc. Returns the text content of the page.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "URL to fetch" },
        max_length: { type: "number", description: "Max characters to return (default: 8000)" },
      },
      required: ["url"],
    },
  },
  {
    name: "http_request",
    description:
      "Make an HTTP request. Supports GET, POST, PUT, DELETE with custom headers and body. Use for APIs.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "Request URL" },
        method: { type: "string", enum: ["GET", "POST", "PUT", "DELETE", "PATCH"], description: "HTTP method" },
        headers: { type: "object", description: "Request headers as key-value pairs" },
        body: { type: "string", description: "Request body (for POST/PUT/PATCH)" },
      },
      required: ["url"],
    },
  },
  {
    name: "run_javascript",
    description:
      "Execute JavaScript/Node.js code and return the result. Has access to the full Node.js runtime. Use for calculations, data processing, or quick scripts.",
    input_schema: {
      type: "object" as const,
      properties: {
        code: { type: "string", description: "JavaScript code to execute. Use console.log() for output." },
      },
      required: ["code"],
    },
  },
  {
    name: "download_file",
    description:
      "Download a file from a URL and save it to disk.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: { type: "string", description: "URL to download from" },
        save_path: { type: "string", description: "Local file path to save to" },
      },
      required: ["url", "save_path"],
    },
  },
];

// --- DuckDuckGo search (no API key needed) ---
async function webSearch(query: string, maxResults: number = 5): Promise<string> {
  try {
    // Use DuckDuckGo HTML search
    const encoded = encodeURIComponent(query);
    const resp = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await resp.text();

    // Parse results from HTML
    const results: { title: string; url: string; snippet: string }[] = [];
    const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
      const url = decodeURIComponent(match[1].replace(/.*uddg=/, "").replace(/&.*/, ""));
      const title = match[2].replace(/<[^>]+>/g, "").trim();
      const snippet = match[3].replace(/<[^>]+>/g, "").trim();
      if (title && url) {
        results.push({ title, url, snippet });
      }
    }

    // Fallback: try simpler parsing
    if (results.length === 0) {
      const linkRegex = /<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/gi;
      const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/gi;
      const links: string[] = [];
      const snippets: string[] = [];
      while ((match = linkRegex.exec(html)) !== null) links.push(match[1].replace(/<[^>]+>/g, "").trim());
      while ((match = snippetRegex.exec(html)) !== null) snippets.push(match[1].replace(/<[^>]+>/g, "").trim());
      for (let i = 0; i < Math.min(links.length, maxResults); i++) {
        results.push({ title: links[i], url: "", snippet: snippets[i] || "" });
      }
    }

    if (results.length === 0) {
      return `No results found for: "${query}"`;
    }

    return results
      .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
      .join("\n\n");
  } catch (err) {
    return `Search failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// --- Fetch URL and extract text ---
async function fetchUrl(url: string, maxLength: number = 8000): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    const contentType = resp.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await resp.json();
      const text = JSON.stringify(json, null, 2);
      return text.slice(0, maxLength);
    }

    const html = await resp.text();

    // Strip HTML tags, scripts, styles
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length > maxLength) {
      text = text.slice(0, maxLength) + "\n...[truncated]";
    }

    return `[${resp.status}] ${url}\n\n${text}`;
  } catch (err) {
    return `Fetch failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// --- HTTP Request ---
async function httpRequest(
  url: string,
  method: string = "GET",
  headers?: Record<string, string>,
  body?: string
): Promise<string> {
  try {
    const opts: RequestInit = {
      method: method || "GET",
      headers: headers || {},
      signal: AbortSignal.timeout(15000),
    };
    if (body && ["POST", "PUT", "PATCH"].includes(method)) {
      opts.body = body;
    }

    const resp = await fetch(url, opts);
    const text = await resp.text();
    const truncated = text.length > 8000 ? text.slice(0, 8000) + "\n...[truncated]" : text;
    return `[${resp.status} ${resp.statusText}]\n${truncated}`;
  } catch (err) {
    return `Request failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// --- Run JavaScript ---
function runJavaScript(code: string): string {
  try {
    const wrapped = `try { ${code} } catch(e) { console.error(e.message); }`;
    const output = execSync(`node -e "${wrapped.replace(/"/g, '\\"')}"`, {
      encoding: "utf-8",
      timeout: 15000,
      cwd: process.cwd(),
    }).trim();
    return output || "(no output)";
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return (e.stdout || e.stderr || "Execution failed").trim();
  }
}

// --- Download File ---
async function downloadFile(url: string, savePath: string): Promise<string> {
  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) return `Download failed: ${resp.status} ${resp.statusText}`;

    const buffer = Buffer.from(await resp.arrayBuffer());
    mkdirSync(dirname(savePath), { recursive: true });
    writeFileSync(savePath, buffer);

    return `Downloaded ${buffer.length} bytes to ${savePath}`;
  } catch (err) {
    return `Download failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// --- Handler ---
export async function handleWebTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "web_search":
      return webSearch(input.query as string, (input.max_results as number) || 5);
    case "fetch_url":
      return fetchUrl(input.url as string, (input.max_length as number) || 8000);
    case "http_request":
      return httpRequest(
        input.url as string,
        (input.method as string) || "GET",
        input.headers as Record<string, string> | undefined,
        input.body as string | undefined
      );
    case "run_javascript":
      return runJavaScript(input.code as string);
    case "download_file":
      return downloadFile(input.url as string, input.save_path as string);
    default:
      return `Unknown web tool: ${name}`;
  }
}
