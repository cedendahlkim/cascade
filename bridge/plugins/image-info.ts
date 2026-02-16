/**
 * Image Info Plugin — Bildmetadata, dimensioner, filformat
 */
import type { PluginManifest } from "../src/plugin-loader.js";
import { readFileSync, existsSync, statSync } from "fs";
import { extname, basename } from "path";

const plugin: PluginManifest = {
  name: "Image Info",
  version: "1.0.0",
  description: "Bildverktyg: läs dimensioner, filformat, EXIF-grunddata, filstorlek för bilder",
  author: "Gracestack",
  tools: [
    {
      name: "image_info",
      description: "Get image file information: dimensions (for PNG/JPEG/GIF/BMP), file size, format, aspect ratio. Reads binary headers.",
      parameters: {
        path: { type: "string", description: "Absolute path to image file" },
      },
      handler: (input) => {
        const path = (input.path as string) || "";
        if (!path) return "Error: path is required";
        if (!existsSync(path)) return `Error: File not found: ${path}`;

        try {
          const stat = statSync(path);
          const ext = extname(path).toLowerCase();
          const buf = readFileSync(path);
          let width = 0, height = 0, format = "unknown";

          if (ext === ".png" && buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
            format = "PNG";
            width = buf.readUInt32BE(16);
            height = buf.readUInt32BE(20);
          } else if ((ext === ".jpg" || ext === ".jpeg") && buf[0] === 0xFF && buf[1] === 0xD8) {
            format = "JPEG";
            let offset = 2;
            while (offset < buf.length - 1) {
              if (buf[offset] !== 0xFF) break;
              const marker = buf[offset + 1];
              if (marker === 0xC0 || marker === 0xC2) {
                height = buf.readUInt16BE(offset + 5);
                width = buf.readUInt16BE(offset + 7);
                break;
              }
              const segLen = buf.readUInt16BE(offset + 2);
              offset += 2 + segLen;
            }
          } else if (ext === ".gif" && buf.length > 10 && buf[0] === 0x47) {
            format = "GIF";
            width = buf.readUInt16LE(6);
            height = buf.readUInt16LE(8);
          } else if (ext === ".bmp" && buf.length > 26 && buf[0] === 0x42) {
            format = "BMP";
            width = buf.readInt32LE(18);
            height = Math.abs(buf.readInt32LE(22));
          } else if (ext === ".webp" && buf.length > 30) {
            format = "WebP";
          } else if (ext === ".svg") {
            format = "SVG";
            const svgText = buf.toString("utf-8").slice(0, 2000);
            const wm = svgText.match(/width="(\d+)/);
            const hm = svgText.match(/height="(\d+)/);
            if (wm) width = parseInt(wm[1]);
            if (hm) height = parseInt(hm[1]);
          }

          const sizeKB = (stat.size / 1024).toFixed(1);
          const sizeMB = (stat.size / 1048576).toFixed(2);
          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
          let aspect = "unknown";
          if (width > 0 && height > 0) {
            const g = gcd(width, height);
            aspect = `${width / g}:${height / g}`;
          }

          return JSON.stringify({
            file: basename(path),
            format,
            dimensions: width > 0 ? `${width}x${height}` : "unknown",
            width,
            height,
            aspectRatio: aspect,
            fileSize: stat.size > 1048576 ? sizeMB + " MB" : sizeKB + " KB",
            fileSizeBytes: stat.size,
            megapixels: width > 0 ? +((width * height) / 1000000).toFixed(2) : 0,
          }, null, 2);
        } catch (err) {
          return "Error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
    {
      name: "image_palette",
      description: "Extract dominant colors from an image by sampling pixels. Returns approximate color palette as hex values.",
      parameters: {
        path: { type: "string", description: "Absolute path to a BMP or raw image file" },
        samples: { type: "number", description: "Number of color samples (default: 8)" },
      },
      handler: (input) => {
        const path = (input.path as string) || "";
        if (!path) return "Error: path is required";
        if (!existsSync(path)) return `Error: File not found: ${path}`;

        try {
          const buf = readFileSync(path);
          const ext = extname(path).toLowerCase();

          if (ext === ".bmp" && buf[0] === 0x42 && buf[1] === 0x4D) {
            const dataOffset = buf.readUInt32LE(10);
            const width = buf.readInt32LE(18);
            const height = Math.abs(buf.readInt32LE(22));
            const bpp = buf.readUInt16LE(28);

            if (bpp !== 24 && bpp !== 32) return "Only 24-bit and 32-bit BMP supported for palette extraction";

            const samples = Math.min((input.samples as number) || 8, 20);
            const step = Math.max(1, Math.floor((width * height) / (samples * 50)));
            const colors: Record<string, number> = {};
            const bytesPerPixel = bpp / 8;
            const rowSize = Math.ceil((width * bytesPerPixel) / 4) * 4;

            for (let y = 0; y < height; y += step) {
              for (let x = 0; x < width; x += step) {
                const offset = dataOffset + y * rowSize + x * bytesPerPixel;
                if (offset + 2 < buf.length) {
                  const b = buf[offset] & 0xF0;
                  const g = buf[offset + 1] & 0xF0;
                  const r = buf[offset + 2] & 0xF0;
                  const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
                  colors[hex] = (colors[hex] || 0) + 1;
                }
              }
            }

            const sorted = Object.entries(colors)
              .sort((a, b) => b[1] - a[1])
              .slice(0, samples)
              .map(([color, count]) => ({ color, frequency: count }));

            return JSON.stringify({ format: "BMP", dimensions: `${width}x${height}`, palette: sorted }, null, 2);
          }

          return "Palette extraction currently supports BMP format. For other formats, use external tools.";
        } catch (err) {
          return "Error: " + (err instanceof Error ? err.message : String(err));
        }
      },
    },
  ],
};

export default plugin;
