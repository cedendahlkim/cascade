/**
 * Hash & Crypto Plugin — SHA256, UUID, base64, lösenordsgenerering
 */
import type { PluginManifest } from "../src/plugin-loader.js";
import { createHash, randomBytes, randomUUID } from "crypto";

const plugin: PluginManifest = {
  name: "Hash & Crypto",
  version: "1.1.0",
  description: "Kryptografiska verktyg: hash, UUID, base64, lösenordsgenerering",
  author: "Gracestack",
  tools: [
    {
      name: "hash_text",
      description: "Hash text with MD5, SHA256, or SHA512. Returns the hex digest.",
      parameters: {
        text: { type: "string", description: "Text to hash" },
        algorithm: { type: "string", description: "Algorithm: md5, sha256, sha512 (default: sha256)" },
      },
      handler: (input) => {
        const algo = (input.algorithm as string) || "sha256";
        const text = (input.text as string) || "";
        try {
          const hash = createHash(algo).update(text).digest("hex");
          return `${algo.toUpperCase()}: ${hash}`;
        } catch {
          return `Unsupported algorithm: ${algo}. Use md5, sha256, or sha512.`;
        }
      },
    },
    {
      name: "generate_uuid",
      description: "Generate one or more random UUID v4 strings",
      parameters: {
        count: { type: "number", description: "Number of UUIDs to generate (default: 1, max: 10)" },
      },
      handler: (input) => {
        const count = Math.min(Math.max((input.count as number) || 1, 1), 10);
        const uuids = Array.from({ length: count }, () => randomUUID());
        return uuids.join("\n");
      },
    },
    {
      name: "base64",
      description: "Encode text to base64 or decode base64 to text",
      parameters: {
        text: { type: "string", description: "Text to encode, or base64 string to decode" },
        decode: { type: "boolean", description: "If true, decode from base64 (default: false = encode)" },
      },
      handler: (input) => {
        const text = (input.text as string) || "";
        if (input.decode) {
          try {
            return Buffer.from(text, "base64").toString("utf-8");
          } catch {
            return "Invalid base64 input";
          }
        }
        return Buffer.from(text).toString("base64");
      },
    },
    {
      name: "generate_password",
      description: "Generate a secure random password with configurable length and character sets",
      parameters: {
        length: { type: "number", description: "Password length (default: 20, min: 8, max: 128)" },
        uppercase: { type: "boolean", description: "Include uppercase letters (default: true)" },
        numbers: { type: "boolean", description: "Include numbers (default: true)" },
        symbols: { type: "boolean", description: "Include symbols (default: true)" },
      },
      handler: (input) => {
        const len = Math.min(Math.max((input.length as number) || 20, 8), 128);
        let chars = "abcdefghijklmnopqrstuvwxyz";
        if (input.uppercase !== false) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (input.numbers !== false) chars += "0123456789";
        if (input.symbols !== false) chars += "!@#$%^&*()-_=+[]{}|;:,.<>?";
        const bytes = randomBytes(len);
        const password = Array.from(bytes).map((b: number) => chars[b % chars.length]).join("");
        return `Password (${len} chars): ${password}`;
      },
    },
  ],
};

export default plugin;
