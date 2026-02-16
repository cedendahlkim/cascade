/**
 * File Converter Plugin — Base64, hex dump, encoding-konvertering
 */
import type { PluginManifest } from "../src/plugin-loader.js";
import { readFileSync, existsSync } from "fs";

const plugin: PluginManifest = {
  name: "File Converter",
  version: "1.0.0",
  description: "Filverktyg: base64 encode/decode filer, hex dump, encoding-konvertering, filstorlek",
  author: "Gracestack",
  tools: [
    {
      name: "file_to_base64",
      description: "Read a file and return its contents as a base64 string. Useful for embedding files in JSON or sending binary data.",
      parameters: {
        path: { type: "string", description: "Absolute path to the file" },
      },
      handler: (input) => {
        const path = (input.path as string) || "";
        if (!path) return "Error: path is required";
        if (!existsSync(path)) return `Error: File not found: ${path}`;
        try {
          const buf = readFileSync(path);
          if (buf.length > 1024 * 1024) return "Error: File too large (max 1MB for base64 conversion)";
          const b64 = buf.toString("base64");
          return JSON.stringify({
            path,
            sizeBytes: buf.length,
            base64Length: b64.length,
            base64: b64.length > 10000 ? b64.slice(0, 10000) + "... [truncated]" : b64,
          }, null, 2);
        } catch (err) {
          return "Error reading file: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
    {
      name: "hex_dump",
      description: "Show a hex dump of a file or text. Displays bytes in hex and ASCII side by side, like xxd.",
      parameters: {
        text: { type: "string", description: "Text to hex dump (use this OR path)" },
        path: { type: "string", description: "File path to hex dump (use this OR text)" },
        offset: { type: "number", description: "Start offset in bytes (default: 0)" },
        length: { type: "number", description: "Number of bytes to show (default: 256, max: 1024)" },
      },
      handler: (input) => {
        let buf: Buffer;
        if (input.path) {
          const p = input.path as string;
          if (!existsSync(p)) return `Error: File not found: ${p}`;
          try { buf = readFileSync(p); } catch (err) {
            return "Error: " + (err instanceof Error ? err.message : String(err));
          }
        } else {
          buf = Buffer.from((input.text as string) || "", "utf-8");
        }

        const offset = (input.offset as number) || 0;
        const length = Math.min((input.length as number) || 256, 1024);
        const slice = buf.slice(offset, offset + length);

        const lines: string[] = [];
        for (let i = 0; i < slice.length; i += 16) {
          const addr = (offset + i).toString(16).padStart(8, "0");
          const hexParts: string[] = [];
          const asciiParts: string[] = [];
          for (let j = 0; j < 16; j++) {
            if (i + j < slice.length) {
              const byte = slice[i + j];
              hexParts.push(byte.toString(16).padStart(2, "0"));
              asciiParts.push(byte >= 32 && byte < 127 ? String.fromCharCode(byte) : ".");
            } else {
              hexParts.push("  ");
              asciiParts.push(" ");
            }
          }
          lines.push(`${addr}  ${hexParts.slice(0, 8).join(" ")}  ${hexParts.slice(8).join(" ")}  |${asciiParts.join("")}|`);
        }

        return `Hex dump (offset ${offset}, ${slice.length} bytes):\n\n${lines.join("\n")}`;
      },
    },
    {
      name: "text_encoding",
      description: "Convert text between encodings: UTF-8, ASCII, Latin-1, hex, URL-encoded",
      parameters: {
        text: { type: "string", description: "Text to convert" },
        from: { type: "string", description: "Source encoding: utf8, hex, url (default: utf8)" },
        to: { type: "string", description: "Target encoding: utf8, hex, base64, url (default: hex)" },
      },
      handler: (input) => {
        const text = (input.text as string) || "";
        const from = (input.from as string) || "utf8";
        const to = (input.to as string) || "hex";

        let buf: Buffer;
        try {
          switch (from) {
            case "hex": buf = Buffer.from(text.replace(/\s/g, ""), "hex"); break;
            case "base64": buf = Buffer.from(text, "base64"); break;
            case "url": buf = Buffer.from(decodeURIComponent(text), "utf-8"); break;
            default: buf = Buffer.from(text, "utf-8");
          }
        } catch (err) {
          return "Error decoding input: " + (err instanceof Error ? err.message : String(err));
        }

        switch (to) {
          case "hex": return buf.toString("hex").match(/.{1,2}/g)?.join(" ") || "";
          case "base64": return buf.toString("base64");
          case "url": return encodeURIComponent(buf.toString("utf-8"));
          case "utf8": return buf.toString("utf-8");
          default: return buf.toString(to as BufferEncoding);
        }
      },
    },
  ],
};

export default plugin;
