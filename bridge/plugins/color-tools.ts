/**
 * Color Tools Plugin — HEX↔RGB↔HSL, paletter, WCAG kontrast
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Color Tools",
  version: "1.0.0",
  description: "Färgverktyg: konvertera HEX↔RGB↔HSL, generera paletter, beräkna WCAG-kontrast",
  author: "Gracestack",
  tools: [
    {
      name: "color_convert",
      description: "Convert a color between HEX, RGB, and HSL formats. Input any format and get all three.",
      parameters: {
        color: { type: "string", description: "Color value: '#ff5733', 'rgb(255,87,51)', or 'hsl(11,100%,60%)'" },
      },
      handler: (input) => {
        const c = ((input.color as string) || "#000000").trim();
        let r = 0, g = 0, b = 0;

        if (c.startsWith("#")) {
          const hex = c.replace("#", "");
          r = parseInt(hex.substring(0, 2), 16) || 0;
          g = parseInt(hex.substring(2, 4), 16) || 0;
          b = parseInt(hex.substring(4, 6), 16) || 0;
        } else if (c.startsWith("rgb")) {
          const m = c.match(/\d+/g);
          if (m) { r = +m[0]; g = +m[1]; b = +m[2]; }
        } else if (c.startsWith("hsl")) {
          const m = c.match(/[\d.]+/g);
          if (m) {
            const [h, s, l] = [+m[0], +m[1] / 100, +m[2] / 100];
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1; if (t > 1) t -= 1;
              if (t < 1/6) return p + (q - p) * 6 * t;
              if (t < 1/2) return q;
              if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
            };
            if (s === 0) { r = g = b = Math.round(l * 255); }
            else {
              const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
              const p = 2 * l - q;
              r = Math.round(hue2rgb(p, q, h/360 + 1/3) * 255);
              g = Math.round(hue2rgb(p, q, h/360) * 255);
              b = Math.round(hue2rgb(p, q, h/360 - 1/3) * 255);
            }
          }
        }

        const hex = "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
        const rn = r/255, gn = g/255, bn = b/255;
        const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
        const l = (max + min) / 2;
        let s = 0, h = 0;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
          else if (max === gn) h = ((bn - rn) / d + 2) * 60;
          else h = ((rn - gn) / d + 4) * 60;
        }

        return JSON.stringify({
          hex,
          rgb: `rgb(${r}, ${g}, ${b})`,
          hsl: `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
          values: { r, g, b, h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) },
        }, null, 2);
      },
    },
    {
      name: "color_contrast",
      description: "Calculate WCAG contrast ratio between two colors. Reports AA and AAA compliance for normal and large text.",
      parameters: {
        foreground: { type: "string", description: "Foreground color (hex, e.g. '#333333')" },
        background: { type: "string", description: "Background color (hex, e.g. '#ffffff')" },
      },
      handler: (input) => {
        const parseHex = (hex: string) => {
          const c = hex.replace("#", "");
          return [0, 2, 4].map(i => parseInt(c.substring(i, i + 2), 16) / 255);
        };
        const toLum = (hex: string) => {
          const [r, g, b] = parseHex(hex).map(v =>
            v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
          );
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const fg = (input.foreground as string) || "#000000";
        const bg = (input.background as string) || "#ffffff";
        const l1 = toLum(fg);
        const l2 = toLum(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        return JSON.stringify({
          foreground: fg,
          background: bg,
          contrastRatio: ratio.toFixed(2) + ":1",
          AA_normalText: ratio >= 4.5 ? "✅ PASS" : "❌ FAIL",
          AA_largeText: ratio >= 3 ? "✅ PASS" : "❌ FAIL",
          AAA_normalText: ratio >= 7 ? "✅ PASS" : "❌ FAIL",
          AAA_largeText: ratio >= 4.5 ? "✅ PASS" : "❌ FAIL",
        }, null, 2);
      },
    },
  ],
};

export default plugin;
