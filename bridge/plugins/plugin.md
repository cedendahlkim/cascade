# Gracestack AI Lab — Plugin System

## Översikt

Plugins utökar AI-agentens kapacitet med nya verktyg. Varje plugin registrerar ett eller flera tools som Claude/Gemini kan anropa direkt i konversationen.

## Skapa en plugin

1. Skapa en `.ts`-fil i `bridge/plugins/`
2. Exportera ett objekt som uppfyller `PluginManifest`:

```typescript
import type { PluginManifest } from "../src/plugin-loader.js";

const plugin: PluginManifest = {
  name: "Min Plugin",
  version: "1.0.0",
  description: "Kort beskrivning",
  author: "Ditt namn",
  tools: [
    {
      name: "tool_name",
      description: "Vad verktyget gör (visas för AI:n)",
      parameters: {
        param1: { type: "string", description: "Beskrivning" },
      },
      handler: async (input) => {
        // Logik här — returnera en sträng
        return "Resultat";
      },
    },
  ],
};

export default plugin;
```

3. Starta om servern — pluginen laddas automatiskt

## Plugin-regler

- **Handler returnerar alltid `string`** (eller `Promise<string>`)
- **Parametrar** definieras som `{ type, description }` objekt
- **Async stöds** — handlers kan vara `async`
- **Node.js API:er** — du har tillgång till alla Node.js moduler
- **Namnkonvention** — tool-namn bör vara `snake_case`

## Installera via Marketplace

1. Gå till **Plugins → Marketplace** i webgränssnittet
2. Klicka **Installera** på valfri plugin
3. Starta om servern

Eller installera från URL:
- Klistra in en rå URL till en `.ts`-fil
- Pluginen sandboxas automatiskt (farliga API:er blockeras)

## De 21 inbyggda plugins

| # | Plugin | Kategori | Tools | Beskrivning |
|---|--------|----------|-------|-------------|
| 1 | **System Monitor** | 🔧 Verktyg | 2 | CPU, RAM, disk, nätverk |
| 2 | **Hash & Crypto** | 🔒 Säkerhet | 4 | SHA256, UUID, base64, lösenord |
| 3 | **JSON Transformer** | 📊 Data | 3 | Query, format, JSON→CSV |
| 4 | **Code Analyzer** | 🔧 Verktyg | 2 | LOC, TODOs, komplexitet, duplicates |
| 5 | **HTTP Client** | 🔗 Integration | 2 | GET/POST requests, ping |
| 6 | **Regex Helper** | 🛠️ Utility | 2 | Test, replace med regex |
| 7 | **Color Tools** | 🛠️ Utility | 2 | HEX↔RGB↔HSL, WCAG kontrast |
| 8 | **Markdown Tools** | 🔧 Verktyg | 2 | TOC-generering, statistik |
| 9 | **File Converter** | 📊 Data | 3 | Base64, hex dump, encoding |
| 10 | **Date & Time** | 🛠️ Utility | 3 | Tidszoner, diff, unix timestamps |
| 11 | **Math Tools** | 🔧 Verktyg | 3 | Evaluate, statistik, enhetskonvertering |
| 12 | **String Utils** | 🛠️ Utility | 3 | Case, slug, lorem ipsum, textanalys |
| 13 | **Network Scanner** | 🔧 Verktyg | 3 | DNS lookup, port check, nätverksinfo |
| 14 | **Image Info** | 🔧 Verktyg | 2 | Dimensioner, format, palette |
| 15 | **Environment Inspector** | 🔧 Verktyg | 2 | Node.js info, env vars, dev tools |
| 16 | **Log Analyzer** | 📊 Data | 2 | Parsa loggar, tidslinje, felfrekvens |
| 17 | **Cron Parser** | 🛠️ Utility | 2 | Tolka cron, nästa körningar |
| 18 | **Data Generator** | 📊 Data | 2 | Fake data (svenska), SQL inserts |
| 19 | **Text Translator** | 🎮 Kul | 2 | ROT13, morse, NATO, binär, leet |
| 20 | **Diff Tool** | 🔧 Verktyg | 2 | Fil-diff, JSON deep-compare |
| 21 | **Process Manager** | 🔧 Verktyg | 2 | Processlista, port-användare |

**Totalt: 51 verktyg** som AI:n kan använda direkt i konversationen.

## Säkerhet

- Plugins från Marketplace som installeras via URL **sandboxas automatiskt**
- Blockerade API:er: `child_process`, `eval`, `new Function()`, `process.exit`
- Lokala plugins i `bridge/plugins/` körs utan sandbox (full åtkomst)
- Max filstorlek för URL-installation: 100 KB

## Filstruktur

```text
bridge/plugins/
├── plugin.md              ← Denna dokumentation
├── example-plugin.ts      ← Exempelplugin (template)
├── system-monitor.ts      ← System Monitor
├── hash-crypto.ts         ← Hash & Crypto
├── json-transformer.ts    ← JSON Transformer
├── code-analyzer.ts       ← Code Analyzer
├── http-client.ts         ← HTTP Client
├── regex-helper.ts        ← Regex Helper
├── color-tools.ts         ← Color Tools
├── markdown-tools.ts      ← Markdown Tools
├── file-converter.ts      ← File Converter
├── date-time.ts           ← Date & Time
├── math-tools.ts          ← Math Tools
├── string-utils.ts        ← String Utils
├── network-scanner.ts     ← Network Scanner
├── image-info.ts          ← Image Info
├── env-inspector.ts       ← Environment Inspector
├── log-analyzer.ts        ← Log Analyzer
├── cron-parser.ts         ← Cron Parser
├── data-generator.ts      ← Data Generator
├── text-translator.ts     ← Text Translator
├── diff-tool.ts           ← Diff Tool
└── process-manager.ts     ← Process Manager
```
