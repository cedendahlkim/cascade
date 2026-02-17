# Gracestack Code Editor — Arkitektur

## Översikt

En webbbaserad kodeditor integrerad i Gracestack-appen där **Frankenstein AI har full kontroll** över filsystem, terminal och kodredigering. Inspirerad av Windsurf/Cascade men med Frankensteins kognitiva arkitektur som motor.

## Teknologival

| Komponent | Teknologi | Motivering |
|-----------|-----------|------------|
| Editor | Monaco Editor (@monaco-editor/react) | Samma editor som VS Code. Syntax highlighting, IntelliSense, diff-view, multi-language |
| Terminal | xterm.js + node-pty via WebSocket | Riktig terminal-emulering med full PTY-stöd |
| Filsystem | Express REST API + fs-modulen | Direkt åtkomst till serverns filsystem |
| AI-agent | Frankenstein code_agent + terminal_agent | Befintlig kognitiv stack för kodgenerering och terminalstyrning |
| Realtid | Socket.IO | Redan i bruk i Gracestack för live-uppdateringar |

## Arkitekturdiagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CodeEditorView.tsx                         │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ FileTree  │  │  Monaco Editor   │  │   AI Panel        │  │
│  │           │  │  (tabs, diff)    │  │   (chat + actions)│  │
│  │ - browse  │  │                  │  │                   │  │
│  │ - create  │  │  - edit          │  │   - ask           │  │
│  │ - delete  │  │  - save          │  │   - generate      │  │
│  │ - rename  │  │  - multi-tab     │  │   - refactor      │  │
│  │ - search  │  │  - syntax hl     │  │   - explain       │  │
│  └──────────┘  │  - diff view     │  │   - fix           │  │
│                └──────────────────┘  └───────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Terminal (xterm.js)                       │    │
│  │  - bash/powershell via PTY                            │    │
│  │  - AI kan köra kommandon direkt                       │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                    Socket.IO + REST
                              │
┌─────────────────────────────────────────────────────────────┐
│                   workspace-routes.ts                         │
│                                                               │
│  REST API:                                                    │
│  GET    /api/workspace/tree         → Filträd                │
│  GET    /api/workspace/file?path=   → Läs fil                │
│  PUT    /api/workspace/file         → Skriv fil              │
│  POST   /api/workspace/file         → Skapa fil              │
│  DELETE /api/workspace/file?path=   → Ta bort fil            │
│  POST   /api/workspace/dir          → Skapa mapp             │
│  POST   /api/workspace/rename       → Byt namn               │
│  GET    /api/workspace/search       → Sök i filer            │
│                                                               │
│  Socket.IO:                                                   │
│  terminal:spawn    → Starta PTY-session                      │
│  terminal:input    → Skicka input till PTY                   │
│  terminal:resize   → Ändra terminalstorlek                   │
│  terminal:kill     → Avsluta PTY                             │
│                                                               │
│  AI Agent:                                                    │
│  POST /api/workspace/ai/edit        → AI redigerar fil       │
│  POST /api/workspace/ai/generate    → AI genererar kod       │
│  POST /api/workspace/ai/explain     → AI förklarar kod       │
│  POST /api/workspace/ai/terminal    → AI kör terminalkommando│
│  POST /api/workspace/ai/task        → AI löser hel uppgift   │
│                                                               │
│  Frankenstein Integration:                                    │
│  - Använder code_agent.py för kodgenerering                  │
│  - Använder terminal_agent.py för terminalkommandon          │
│  - HDC-minne för att komma ihåg kodmönster                   │
│  - Active Inference för strategival                           │
│  - Ebbinghaus för långtidsminne av lösningar                 │
└─────────────────────────────────────────────────────────────┘
```

## Frankenstein AI — Full kontroll

Frankenstein kan:

1. **Läsa filer** — Analysera kod, hitta buggar, förstå kontext
2. **Skriva filer** — Generera, redigera, refaktorera kod
3. **Köra terminalen** — Installera paket, bygga, testa, deploya
4. **Navigera filsystemet** — Söka, skapa mappar, organisera
5. **Multi-step tasks** — Lösa komplexa uppgifter autonomt (skapa projekt, fixa buggar, etc.)

### AI-agentloop

```
Användaren ger instruktion
        │
        ▼
Frankenstein analyserar (HDC + Active Inference)
        │
        ▼
Väljer strategi: edit / generate / terminal / multi-step
        │
        ▼
Utför åtgärder (kan vara flera steg)
        │
        ▼
Visar diff / resultat för användaren
        │
        ▼
Användaren accepterar / ber om ändring
```

## Säkerhet

- Workspace är begränsat till `WORKSPACE_ROOT` — ingen åtkomst utanför
- Terminal-sessioner körs som samma användare som bridge-servern
- AI-åtgärder loggas och kan ångras
- Filoperationer validerar sökvägar mot path traversal
