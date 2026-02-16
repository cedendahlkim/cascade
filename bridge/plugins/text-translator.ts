/**
 * Text Translator Plugin — Översätt mellan vanliga format och språkverktyg
 */
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Text Translator",
  version: "1.0.0",
  description: "Textöversättning: ROT13, morse, NATO-alfabet, binär, leetspeak, pig latin",
  author: "Gracestack",
  tools: [
    {
      name: "text_encode",
      description: "Encode/decode text in various fun and useful formats: ROT13, morse code, NATO phonetic alphabet, binary, leetspeak, pig latin, reverse words",
      parameters: {
        text: { type: "string", description: "Text to encode" },
        format: { type: "string", description: "Format: rot13, morse, nato, binary, leet, pig_latin, reverse_words (default: rot13)" },
        decode: { type: "boolean", description: "Decode instead of encode (for rot13, morse, binary)" },
      },
      handler: (input) => {
        const text = (input.text as string) || "";
        const format = ((input.format as string) || "rot13").toLowerCase();
        const decode = input.decode as boolean;

        switch (format) {
          case "rot13": {
            return text.replace(/[a-zA-Z]/g, c => {
              const base = c <= "Z" ? 65 : 97;
              return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
            });
          }

          case "morse": {
            const morseMap: Record<string, string> = {
              A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
              G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
              M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
              S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
              Y: "-.--", Z: "--..",
              "0": "-----", "1": ".----", "2": "..---", "3": "...--",
              "4": "....-", "5": ".....", "6": "-....", "7": "--...",
              "8": "---..", "9": "----.",
              ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--",
              " ": "/",
            };
            if (decode) {
              const reverseMorse: Record<string, string> = {};
              for (const [k, v] of Object.entries(morseMap)) reverseMorse[v] = k;
              return text.split(" ").map(code => reverseMorse[code] || code).join("");
            }
            return text.toUpperCase().split("").map(c => morseMap[c] || c).join(" ");
          }

          case "nato": {
            const nato: Record<string, string> = {
              A: "Alfa", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo",
              F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliet",
              K: "Kilo", L: "Lima", M: "Mike", N: "November", O: "Oscar",
              P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango",
              U: "Uniform", V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee",
              Z: "Zulu",
            };
            return text.toUpperCase().split("").map(c => {
              if (c === " ") return "[space]";
              return nato[c] || c;
            }).join(" ");
          }

          case "binary": {
            if (decode) {
              return text.split(" ").map(b => String.fromCharCode(parseInt(b, 2))).join("");
            }
            return text.split("").map(c => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
          }

          case "leet": {
            const leetMap: Record<string, string> = {
              a: "4", e: "3", i: "1", o: "0", s: "5", t: "7", l: "1", b: "8", g: "9",
            };
            return text.split("").map(c => leetMap[c.toLowerCase()] || c).join("");
          }

          case "pig_latin": {
            return text.split(/\s+/).map(word => {
              const lower = word.toLowerCase();
              const vowels = "aeiou";
              if (vowels.includes(lower[0])) return word + "way";
              const consonantEnd = lower.split("").findIndex(c => vowels.includes(c));
              if (consonantEnd === -1) return word + "ay";
              return word.slice(consonantEnd) + word.slice(0, consonantEnd) + "ay";
            }).join(" ");
          }

          case "reverse_words": {
            return text.split(/\s+/).reverse().join(" ");
          }

          default:
            return `Unknown format: ${format}. Use: rot13, morse, nato, binary, leet, pig_latin, reverse_words`;
        }
      },
    },
    {
      name: "text_diff_simple",
      description: "Compare two texts and show differences line by line. Marks added (+), removed (-), and unchanged lines.",
      parameters: {
        text1: { type: "string", description: "Original text" },
        text2: { type: "string", description: "Modified text" },
      },
      handler: (input) => {
        const lines1 = ((input.text1 as string) || "").split("\n");
        const lines2 = ((input.text2 as string) || "").split("\n");
        const maxLen = Math.max(lines1.length, lines2.length);
        const diff: string[] = [];
        let added = 0, removed = 0, unchanged = 0;

        for (let i = 0; i < maxLen; i++) {
          const l1 = lines1[i];
          const l2 = lines2[i];
          if (l1 === undefined) {
            diff.push(`+ ${l2}`);
            added++;
          } else if (l2 === undefined) {
            diff.push(`- ${l1}`);
            removed++;
          } else if (l1 === l2) {
            diff.push(`  ${l1}`);
            unchanged++;
          } else {
            diff.push(`- ${l1}`);
            diff.push(`+ ${l2}`);
            added++;
            removed++;
          }
        }

        return `--- original\n+++ modified\n\n${diff.join("\n")}\n\nSummary: ${added} added, ${removed} removed, ${unchanged} unchanged`;
      },
    },
  ],
};

export default plugin;
