# Gracestack AI Lab

<p align="center">
  <strong>Mobile/web AI command center by Gracestack AB</strong><br/>
  Multi-LLM orchestration · Cognitive AI research · Swarm intelligence · Remote computer control
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/LLMs-5_Models-blueviolet" alt="5 LLMs" />
  <img src="https://img.shields.io/badge/Views-35+-green" alt="35+ Views" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License" />
</p>

Inspired by [Happy Coder](https://github.com/slopus/happy) and [MCP Bridge API](https://github.com/INQUIRELAB/mcp-bridge-api).

---

## Status (2026-02-19)

- ✅ Aktiv monorepo med `bridge` (Express + Socket.IO), `web` (React/Vite), `mcp-server` (stdio MCP) och `frankenstein-ai` (Python)
- ✅ Cloudflare Tunnel auto-start i bridge, URL via `GET /api/tunnel` + Socket.IO `tunnel_url`
- ✅ Avancerad workspace/editor-stack (Monaco, terminal, AI inline edit, AI autocomplete, git-panel)
- ✅ Archon Knowledge Base (Supabase pgvector + Gemini embeddings) integrerad direkt i bridge
- ✅ Deploybar via Docker Compose med Weaviate, Ollama embed, Nginx och certbot

## Architecture

```
┌──────────────┐     stdio      ┌──────────────────────────────┐     HTTPS      ┌───────────────┐
│ Windsurf/IDE │ ←──────────→  │   Bridge Server               │ ←───────────→  │  PWA (mobile) │
└──────────────┘               │   Express + Socket.IO         │                └───────────────┘
                               │                               │
                               │   ┌─────────┐ ┌──────────┐   │     Agent
                               │   │ Claude   │ │ Gemini   │   │ ←──────────→  Remote PCs
                               │   │ DeepSeek │ │ Grok     │   │
                               │   │ Ollama   │ │ Frank AI │   │     Tunnel
                               │   └─────────┘ └──────────┘   │ ←──────────→  Cloudflare
                               │                               │
                               │   Supabase · Weaviate · RAG   │
                               └──────────────────────────────┘
```

### Packages

| Package | Description |
|---|---|
| `mcp-server/` | MCP server (stdio) — tools: `send_to_mobile`, `read_mobile_messages`, `ask_mobile`, `mobile_status` |
| `bridge/` | Express + Socket.IO relay server with 5 AI agents + cognitive systems |
| `web/` | React 19 + Vite 6 + Tailwind PWA — mobile-first UI with 30+ views |
| `frankenstein-ai/` | Bio-inspired meta-learning agent (HDC + Active Inference + Ebbinghaus) — Python |
| `landing/` | Static marketing landing page |
| `installer/` | One-line install scripts for Windows, macOS, Linux |

---

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

Alternativt på Windows:

```bat
setup.bat
```

### 2. Configure API keys

Create `bridge/.env`:

```env
# Required (at least one)
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...

# Optional — more LLMs
DEEPSEEK_API_KEY=sk-...
GROK_API_KEY=xai-...

# Optional — Auth & persistence
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional — Vector search
WEAVIATE_HOST=localhost
OLLAMA_URL=http://localhost:11434
```

### 3. Start everything

```bash
npm run dev
```

- **Web app:** http://localhost:5173
- **Bridge server:** http://localhost:3031
- **Cloudflare Tunnel:** auto-started (public HTTPS URL logged to console)

### 4. Add MCP server to Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "gracestack-ai-lab": {
      "command": "npx",
      "args": ["tsx", "<path-to>/gracestack-ai-lab/mcp-server/src/index.ts"]
    }
  }
}
```

Tips: MCP-servern använder `CASCADE_REMOTE_BRIDGE_URL` (default `http://localhost:3031`) och `CASCADE_REMOTE_WORKSPACE` för workspace-root.

### 5. Open on your phone

Open the Cloudflare Tunnel URL (printed in console) or `http://<local-ip>:3031` on your phone. Install as PWA for native app feel.

### 6. Add remote computers (optional)

```bash
cd bridge
npm run agent -- --bridge http://<bridge-ip>:3031 --name "Gaming PC"
```

---

## Features

### 💬 Chat & Multi-LLM

- **5 AI Agents** — Claude (Anthropic), Gemini (Google), DeepSeek, Grok (xAI), Ollama (local) — all with full tool support
- **Frankenstein Chat** — Dedicated chat with bio-inspired cognitive AI (HDC + Active Inference)
- **AI Research Arena** — Multi-AI collaboration with shared memory, sandbox code execution, configurable rounds
- **Multi-LLM Orchestrator (Lab)** — Route tasks to best LLM, consensus engine, bias detection, audit logging
- **Conversation History** — Per-tab sidebar with save/load/delete, persisted to localStorage or Supabase
- **Voice Input/Output** — Speech-to-text (Web Speech API) and text-to-speech for hands-free use
- **Slash Commands** — `/screenshot`, `/search`, `/files`, `/status`, `/clear`, `/memory`, `/rag`

### 🧠 Cognitive AI Systems

- **Hierarchical Agent Coordination** — Planner → Executor → Critic → Validator pipeline with state machine
- **ABA-Mycelium Swarm** — Decentralized intelligence: Analyst, Creative, Critic nodes with weighted influence propagation
- **AI Panel Debate** — Swedish political party agents debating topics using Frankenstein cognitive architecture
- **Bot Network** — Autonomous evolving network with workers, validators, coordinators, innovators
- **Agent Chains** — DAG-based node graphs with conditional branching, loops, retry, sub-chains
- **Arena Sandbox** — Isolated code execution (JS/Python/Shell) during AI research sessions

### 💻 Code Editor (Windsurf-level)

- **Monaco Editor** — VS Code engine with syntax highlighting, IntelliSense, multi-tab, diff view
- **Integrated Terminal** — xterm.js + PTY via WebSocket (full bash/PowerShell)
- **AI Inline Edit (Ctrl+K)** — Select code → describe change → streaming AI result → Accept/Dismiss
- **AI Autocomplete** — Gemini-powered ghost text with 800ms debounce
- **Git Integration (Ctrl+G)** — Stage, commit, push, AI-generated commit messages from diff
- **File Tree** — Create, rename, delete, search files and directories
- **Streaming AI Chat** — Multi-file context, conversation history, Apply/Preview code blocks

### 🛠️ Tools & Automation

- **40+ AI Tools** — Web search, screenshots, file system, process management, desktop control, code execution
- **Scheduler** — Cron-based task scheduling (AI prompts, commands, HTTP requests, notifications)
- **Workflows** — Sequential step-by-step automations
- **Agent Chains** — Advanced DAG workflows with branching, loops, and sub-chains
- **Plugin Marketplace** — Community plugins with sandboxing, ratings, one-click install from URL
- **Plugin System** — Extend AI with custom tools via `bridge/plugins/`

### 🖥️ Infrastructure

- **Multi-Computer** — Register remote PCs, AI routes tasks to best machine based on capabilities
- **Dashboard** — Real-time system metrics (CPU, RAM, uptime), AI stats per model, cost tracking, activity grid
- **Cloudflare Tunnel** — Auto-started HTTPS tunnel with auto-restart on crash
- **File Sharing** — Upload/download between mobile and desktop with drag-and-drop
- **Clipboard Sync** — Bidirectional clipboard between devices

### 🧠 Knowledge & Memory

- **Archon Knowledge Base** — Supabase pgvector RAG with Gemini embeddings (768D), semantic search
- **Weaviate RAG** — Alternative vector search via Weaviate + Ollama embeddings (nomic-embed-text)
- **BM25 RAG** — Built-in full-text search fallback (zero dependencies)
- **AI Memories** — Persistent memory with tags, search, and confidence scoring
- **Shared Memory** — Cross-AI memory for Arena research sessions
- **Frankenstein Learning** — Persistent tracking of facts, preferences, skills, insights from conversations
- **Global Rules** — Editable system prompt rules injected into all agents
- **Projects** — Context switching with separate memories, RAG index, and settings per project

### 🔬 Self-Improvement & Research

- **Reflexion Loop** — Agent critiques its own responses and retries (Shinn 2023)
- **Skill Library** — Stores successful tool chains for reuse (Voyager pattern)
- **Self-Evaluation** — Rates responses, learns from user feedback
- **Research Lab** — Advanced multi-agent research view with experiments and analysis
- **Battle Arena** — Live Frankenstein vs bare LLM competition with scoring
- **A/B Testing** — Statistical proof of cognitive stack value over raw LLM

### 📈 Conversation Analytics

- **Token Usage Trends** — Hourly/daily/weekly per-model breakdowns with stacked bar charts
- **Cost Forecasting** — Linear regression projections (daily avg, weekly, monthly) with trend %
- **Activity Heatmap** — Hour × day-of-week grid (requests, tokens, cost)
- **Session Statistics** — Avg duration, messages per session, peak hours
- **Model Comparison** — 6 models side-by-side (latency, cost/1K tokens, quality score)
- **CSV Export** — Download all analytics data

### 🧪 Prompt Lab

- **A/B Testing Framework** — Compare 2+ prompt variants across multiple LLMs simultaneously
- **AI Judge** — Gemini auto-scores each response 0-100
- **Manual Rating** — 1-5 star quality rating per response
- **Auto Winner Selection** — AI score → quality → latency weighted ranking
- **Variant Statistics** — Per-variant and per-model breakdowns
- **Experiment Management** — Create, run, re-run, delete experiments

### 👁️ Vision & Multimodal

- **Image Analysis** — Gemini Vision + Claude Vision (base64-encoded)
- **5 Analysis Modes** — Describe, OCR, Analyze, Compare, Custom question
- **Drag & Drop** — File picker, clipboard paste (Ctrl+V), multi-image support
- **Tag Extraction** — Auto-generated keywords from analysis
- **OCR Text** — Extracted text from images with formatting preserved

### 📸 Snapshot & Rollback

- **Named Snapshots** — Save current AI state (memories, analytics, settings, RAG)
- **One-Click Restore** — Rollback to any snapshot (auto-saves current state first)
- **Diff Tool** — Compare two snapshots file-by-file (added/removed/modified)
- **Auto-Prune** — Keep max 50 snapshots, auto-cleanup
- **Tags & Stats** — Categorize snapshots, track total size

### 🔗 Webhook & API Gateway

- **Custom Endpoints** — Create webhook URLs mapped to any AI model
- **API Key Auth** — Generated `gsk_` keys per webhook with regeneration
- **Rate Limiting** — Configurable max calls per minute per webhook
- **Templates** — Slack, Discord, GitHub, Custom format support
- **Request Logging** — Full request/response history with latency and status
- **Curl Examples** — Copy-paste ready commands in the UI

### 📱 Mobile & UX

- **PWA** — Installable as native app on iOS/Android
- **Touch-optimized** — Swipe navigation, touch-friendly buttons
- **Real-time streaming** — Throttled Socket.IO for smooth token streaming
- **Notification center** — In-app notifications with history
- **Dark theme** — Slate-based dark UI optimized for OLED
- **Responsive** — Adapts from mobile to desktop seamlessly

### 🔐 Security & Auth

- **Supabase Auth** — Multi-user registration/login with JWT tokens
- **Admin Panel** — User management, role-based access (admin/user)
- **Per-user Data** — Conversations and memories isolated per user in Postgres
- **Rate limiting** — Configurable requests per minute
- **Token budget** — Max tokens per session with 80% warning
- **Audit logging** — All AI interactions logged with timestamps
- **Path traversal protection** — Workspace sandboxing for file operations

### 🐬 Hardware Integration

- **Flipper Zero BLE** — Web Bluetooth connection to Flipper Zero devices
  - Serial RPC communication, file manager, GPIO control
  - Sub-GHz, RFID, NFC, IR signal capture/replay
  - Battery monitoring, firmware info, device scanning

---

## Web App Views (30+)

| View | Description |
|---|---|
| **Claude Chat** | Full chat with streaming, tool use, markdown, code highlighting, feedback |
| **Gemini Chat** | Separate Gemini chat with streaming and tools |
| **Frankenstein Chat** | Bio-inspired cognitive AI with HDC/AIF-driven responses |
| **Arena** | Multi-AI research collaboration with sandbox and shared memories |
| **Research Lab** | Advanced multi-agent experiments, analysis, and visualization |
| **Lab** | Multi-LLM orchestrator with workers, tasks, bias alerts, audit log |
| **Dashboard** | System gauges, sparklines, AI stats per model, cost tracking, activity grid |
| **Code Editor** | Full IDE with Monaco, terminal, AI autocomplete, git, file tree |
| **Hierarchy** | Planner → Executor → Critic → Validator agent coordination |
| **Swarm** | ABA-Mycelium decentralized intelligence visualization |
| **Debate** | AI political panel debate simulation |
| **Agent Chains** | Visual DAG workflow builder with branching and loops |
| **Battle Arena** | Frankenstein vs raw LLM live competition |
| **Tools** | Quick actions and full tool catalog |
| **Computers** | Remote computer management and task execution |
| **Scheduler** | Create/manage cron jobs and scheduled tasks |
| **Files** | File sharing with upload, download, preview |
| **Search** | Full-text search across all conversations |
| **Projects** | Project management with context switching |
| **Clipboard** | Clipboard sync history |
| **Plugins** | Plugin marketplace + installed plugin management |
| **Workflows** | Sequential automation builder |
| **Network** | Bot network visualization with evolution |
| **Self-Improve** | Skills, evaluations, reflections dashboard |
| **Frankenstein** | Training dashboard, cognitive metrics, ablation results |
| **Archon** | Knowledge base management, vector search, crawling |
| **WAF Hardening** | Start/stop WAF profiles, run corpus tests, inspect security regressions |
| **Git** | Repository status, commits, branches, diffs |
| **Flipper Zero** | BLE device control and signal management |
| **Settings** | Global rules, memories, RAG, security, audit, theme |
| **Admin** | User management panel (Supabase auth required) |
| **Login** | Authentication (register/login with Supabase) |
| **Install** | Platform-specific installation instructions |

---

## API Endpoints

### Core
| Endpoint | Description |
|---|---|
| `GET /api/status` | Connection status and client count |
| `GET /healthz` | Liveness probe for runtime health |
| `GET /readyz` | Readiness probe (workspace + runtime checks) |
| `GET/POST/DELETE /api/messages` | Chat messages (CRUD) |
| `POST /api/ask` | Ask mobile user a question (long-poll) |
| `GET /api/qr` | QR code for pairing |
| `GET /api/tunnel` | Cloudflare Tunnel URL |
| `GET /api/dashboard` | Real-time system metrics and AI stats |
| `GET /api/tokens` | Token usage and budget |
| `POST /api/tokens/budget` | Set token budget |

### Auth
| Endpoint | Description |
|---|---|
| `GET /api/auth/enabled` | Check if auth is active |
| `GET /api/auth/config` | Public Supabase config for frontend |
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Sign in |
| `GET /api/auth/me` | Get current user (requires token) |

### AI Agents
| Endpoint | Description |
|---|---|
| `GET /api/gemini/status` | Gemini status and tokens |
| `GET/DELETE /api/gemini/messages` | Gemini conversation |
| `GET /api/deepseek/status` | DeepSeek status and tokens |
| `GET /api/grok/status` | Grok status and tokens |
| `GET /api/ollama/status` | Ollama status & models |
| `POST /api/ollama/pull` | Pull a new Ollama model |

### Arena & Research
| Endpoint | Description |
|---|---|
| `POST /api/arena/start` | Start research session (topic, rounds, mode) |
| `POST /api/arena/stop` | Stop running session |
| `GET/DELETE /api/arena/messages` | Arena messages |
| `GET /api/arena/participants` | List AI participants |
| `GET /api/shared-memory` | Shared memories (filter by topic/type/author) |

### Orchestrator (Lab)
| Endpoint | Description |
|---|---|
| `GET /api/orchestrator/status` | Orchestrator stats |
| `GET /api/orchestrator/workers` | Worker list with health |
| `POST /api/orchestrator/task` | Submit task (type, prompt, consensus) |
| `GET /api/orchestrator/tasks` | Task history |
| `POST /api/orchestrator/workers/:id/toggle` | Enable/disable worker |
| `GET /api/orchestrator/learnings` | Cross-worker learning data |
| `GET /api/orchestrator/bias-alerts` | Bias detection alerts |

### Hierarchy
| Endpoint | Description |
|---|---|
| `POST /api/hierarchy/task` | Submit task for hierarchical processing |
| `GET /api/hierarchy/state` | Current workflow state |
| `GET /api/hierarchy/history` | Completed task history |

### Swarm
| Endpoint | Description |
|---|---|
| `POST /api/swarm/query` | Send query through swarm nodes |
| `GET /api/swarm/nodes` | List swarm nodes and influence weights |
| `GET /api/swarm/insights` | Cross-domain insight propagations |

### Debate
| Endpoint | Description |
|---|---|
| `POST /api/debate/start` | Start debate session with party agents |
| `POST /api/debate/stop` | Stop debate |
| `GET /api/debate/sessions` | Session history |

### Agent Chains
| Endpoint | Description |
|---|---|
| `GET/POST /api/chains` | List/create chain definitions |
| `POST /api/chains/:id/run` | Execute a chain |
| `GET /api/chains/:id/status` | Execution status |

### Code Editor / Workspace
| Endpoint | Description |
|---|---|
| `GET /api/workspace/tree` | File tree |
| `GET /api/workspace/file` | Read file |
| `PUT /api/workspace/file` | Write file |
| `POST /api/workspace/ai/edit` | AI-powered file edit |
| `POST /api/workspace/ai/complete` | AI autocomplete |
| `POST /api/workspace/ai/chat/stream` | Streaming AI chat (SSE) |
| `GET /api/workspace/git/status` | Git status |
| `POST /api/workspace/git/commit` | Git commit |
| `POST /api/workspace/git/ai-commit` | AI-generated commit message |

### Multi-Computer
| Endpoint | Description |
|---|---|
| `GET /api/computers` | List registered computers |
| `POST /api/computers` | Register a computer |
| `POST /api/computers/:id/execute` | Execute task on specific computer |
| `POST /api/computers/route` | Auto-route to best computer |

### Scheduler
| Endpoint | Description |
|---|---|
| `GET/POST /api/schedules` | List/create schedules |
| `PUT/DELETE /api/schedules/:id` | Update/delete schedule |
| `POST /api/schedules/:id/run` | Run immediately |

### Knowledge & Memory
| Endpoint | Description |
|---|---|
| `GET/POST /api/memories` | List/create memories |
| `PUT/DELETE /api/memories/:id` | Update/delete memory |
| `GET/PUT /api/global-rules` | Global AI rules |
| `GET /api/rag/sources` | RAG knowledge sources |
| `POST /api/rag/index-text` | Index text into RAG |

### Archon (pgvector RAG)
| Endpoint | Description |
|---|---|
| `GET /api/archon/sources` | Knowledge sources |
| `POST /api/archon/ingest` | Chunk + embed text |
| `POST /api/archon/crawl` | Crawl URL → chunk → embed |
| `POST /api/archon/search` | Semantic vector search |
| `POST /api/archon/search/code` | Code example search |

### Plugin Marketplace
| Endpoint | Description |
|---|---|
| `GET /api/marketplace` | Browse available plugins |
| `POST /api/marketplace/install` | Install plugin from URL |
| `DELETE /api/marketplace/:id` | Uninstall plugin |
| `POST /api/marketplace/:id/rate` | Rate a plugin |

### Files, Clipboard, Projects, Search
| Endpoint | Description |
|---|---|
| `GET/POST /api/files` | File listing / upload |
| `GET /api/clipboard` | Clipboard history |
| `GET/POST /api/projects` | List/create projects |
| `GET /api/search?q=...` | Full-text search with scoring |
| `GET /api/search/export` | Export as Markdown/JSON |

### WAF Hardening
| Endpoint | Description |
|---|---|
| `GET /api/waf/config` | Active WAF hardening bridge config |
| `GET /api/waf/profiles` | List available WAF profiles |
| `GET /api/waf/status` | Check WAF runtime/health status |
| `POST /api/waf/start` | Start WAF environment with selected profile |
| `POST /api/waf/stop` | Stop WAF environment |
| `POST /api/waf/run` | Start a WAF test run (tags/ids/concurrency) |
| `GET /api/waf/recent-runs` | Get latest test run IDs and status |
| `GET /api/waf/run/:runId/results` | Get run summary + failing tests (returns `status`, `running_seconds`, `stale`, `message` while run is still active) |

### Bot Network
| Endpoint | Description |
|---|---|
| `GET /api/network` | Network state (bots, knowledge, events) |
| `POST /api/network/start` | Start network |
| `POST /api/network/stop` | Stop network |
| `POST /api/network/topic` | Set research topic |

### Self-Improvement
| Endpoint | Description |
|---|---|
| `GET /api/self-improve/skills` | Learned skills |
| `GET /api/self-improve/evaluations` | Response evaluations |
| `GET /api/self-improve/reflections` | Agent reflections |
| `POST /api/self-improve/message-feedback` | User feedback on messages |

---

## Socket.IO Events

### Client → Server
| Event | Description |
|---|---|
| `message` | Send Claude chat message |
| `gemini_message` | Send Gemini message |
| `deepseek_message` | Send DeepSeek message |
| `grok_message` | Send Grok message |
| `frankenstein_message` | Send Frankenstein message |
| `answer` | Answer a pending question |
| `terminal:spawn` | Start PTY session (code editor) |
| `terminal:input` | Send input to terminal |
| `terminal:kill` | Kill terminal session |

### Server → Client
| Event | Description |
|---|---|
| `message` / `history` | Claude messages |
| `agent_stream` | Claude streaming tokens |
| `agent_status` | Tool use status (thinking, tool_start, tool_done) |
| `gemini_message` / `gemini_stream` | Gemini messages/streaming |
| `deepseek_message` / `deepseek_stream` | DeepSeek messages/streaming |
| `grok_message` / `grok_stream` | Grok messages/streaming |
| `frankenstein_message` / `frankenstein_stream` | Frankenstein messages/streaming |
| `arena_message` / `arena_status` | Arena messages/round progress |
| `debate_message` / `debate_status` | Debate messages/status |
| `hierarchy_update` | Hierarchical agent state changes |
| `swarm_update` | Swarm node responses |
| `chain_status` | Agent chain execution updates |
| `orchestrator_task` / `orchestrator_worker` | Lab task/worker updates |
| `token_usage` | Token counter updates |
| `tunnel_url` | Cloudflare Tunnel URL |
| `question` | Pending question for user |
| `budget_warning` | Token budget 80% alert |
| `terminal:output` | Terminal PTY output |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Claude API key |
| `GEMINI_API_KEY` | — | Gemini API key |
| `DEEPSEEK_API_KEY` | — | DeepSeek API key |
| `GROK_API_KEY` | — | Grok (xAI) API key |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3` | Default Ollama model |
| `SUPABASE_URL` | — | Supabase project URL (enables auth + per-user data) |
| `SUPABASE_ANON_KEY` | — | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | — | Supabase service role key |
| `WEAVIATE_HOST` | `localhost` | Weaviate vector DB host |
| `CASCADE_REMOTE_BRIDGE_URL` | `http://localhost:3031` | Bridge URL (for MCP server) |
| `CASCADE_REMOTE_WORKSPACE` | repo root | Workspace root path used by MCP server/workspace routes |
| `PORT` | `3031` | Bridge server port |
| `NO_TUNNEL` | `0` | Set to `1` to disable Cloudflare Tunnel |
| `TOKEN_BUDGET` | `0` | Max tokens per session (0 = unlimited) |
| `RATE_LIMIT_MAX` | `30` | Max requests per minute |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |

### Trading Bot (Frankenstein)

Trading bot settings are read from environment variables and from `frankenstein-ai/.env.local` (see `frankenstein-ai/.env.local.example`).

| Variable | Default | Description |
|---|---|---|
| `TRADING_EXCHANGE` | `binance` | Exchange backend: `binance` or `kraken` |
| `TRADING_PAPER_MODE` | `true` | Paper trading (simulated orders) |
| `TRADING_ALLOW_LIVE` | `false` | Safety gate for real orders |
| `TRADING_SYMBOLS` | depends | Comma-separated symbols/pairs. Kraken often uses `XBT` for Bitcoin (e.g. `XBTUSDT`) |
| `TRADING_INTERVAL_SECONDS` | `3600` | Tick interval in seconds |
| `TRADING_RISK_PER_TRADE` | `0.02` | Risk allocation (fraction of portfolio when <= 1.0, otherwise treated as USD) |
| `TRADING_MIN_CONFIDENCE` | `0.60` | Minimum confidence to place orders |
| `TRADING_KLINE_INTERVAL` | `1h` | Market data timeframe (e.g. `1m`, `5m`, `15m`, `1h`, `4h`, `1d`) |
| `TRADING_MAX_POSITIONS` | `2` | Max concurrent open positions (prevents overtrading across many coins) |
| `TRADING_COOLDOWN_SECONDS` | `0` | Cooldown per symbol after a filled order (seconds) |
| `TRADING_TAKE_PROFIT_PCT` | `0` | Take profit threshold (percent) for open positions |
| `TRADING_STOP_LOSS_PCT` | `0` | Stop loss threshold (percent) for open positions |
| `TRADING_TRAILING_STOP_PCT` | `0` | Trailing stop (percent). Uses peak price since entry |
| `TRADING_AGGRESSION` | `0.5` | 0..1 entry aggressiveness (0 = chill, 1 = degenerate) |
| `TRADING_TARGET_ORDER_COUNT` | `0` | Optional burst mode: stop the bot after N filled orders |
| `TRADING_MAX_RUNTIME_SECONDS` | `0` | Optional burst mode: stop the bot after max runtime (seconds) |
| `KRAKEN_API_KEY` | — | Kraken API key (only required for live trading) |
| `KRAKEN_API_SECRET` | — | Kraken API secret (only required for live trading) |
| `KRAKEN_BASE_URL` | `https://api.kraken.com` | Kraken REST API base URL |
| `BINANCE_API_KEY` | — | Binance API key (only required for live trading) |
| `BINANCE_API_SECRET` | — | Binance API secret (only required for live trading) |
| `BINANCE_BASE_URL` | `https://api.binance.com` | Binance REST API base URL |

### Runtime quality

- Bridge performs startup env validation (fails fast on invalid/incomplete runtime config).
- HTTP requests get request IDs via `x-request-id` (incoming value is reused, otherwise generated).
- Request logs include `req_id`, method, path, status and duration.

---

## Project Structure

```
gracestack-ai-lab/
├── bridge/                         # Backend server
│   ├── src/
│   │   ├── index.ts                # Main server (Express + Socket.IO, 160K+ lines)
│   │   ├── agent.ts                # Claude AI agent with 40+ tools
│   │   ├── agent-gemini.ts         # Gemini AI agent
│   │   ├── agent-deepseek.ts       # DeepSeek AI agent (OpenAI-compatible)
│   │   ├── agent-grok.ts           # Grok AI agent (xAI)
│   │   ├── agent-ollama.ts         # Ollama local LLM agent
│   │   ├── agent-frankenstein.ts   # Frankenstein cognitive AI agent
│   │   ├── agent-chains.ts         # DAG-based workflow engine
│   │   ├── hierarchy.ts            # Planner/Executor/Critic/Validator coordination
│   │   ├── swarm.ts                # ABA-Mycelium swarm intelligence
│   │   ├── debate-routes.ts        # AI political panel debate
│   │   ├── llm-orchestrator.ts     # Multi-LLM coordinator with consensus
│   │   ├── bot-network.ts          # Autonomous AI bot network
│   │   ├── sandbox.ts              # Isolated code execution for Arena
│   │   ├── workspace-routes.ts     # Code editor backend (file ops, AI, terminal)
│   │   ├── archon-routes.ts        # Archon pgvector RAG
│   │   ├── plugin-marketplace.ts   # Community plugin marketplace
│   │   ├── auth-routes.ts          # Supabase auth endpoints
│   │   ├── auth-middleware.ts      # JWT verification middleware
│   │   ├── user-data.ts            # Per-user data isolation
│   │   ├── supabase.ts             # Supabase client & auth helpers
│   │   ├── frank-learning.ts       # Frankenstein persistent learning
│   │   ├── system-context.ts       # Shared AI system prompt
│   │   ├── shared-memory.ts        # Cross-AI shared memory
│   │   ├── self-improve.ts         # Reflexion, skills, self-evaluation
│   │   ├── rag.ts                  # BM25 RAG knowledge base
│   │   ├── rag-weaviate.ts         # Weaviate vector RAG
│   │   ├── memory.ts               # Persistent AI memories
│   │   ├── workflows.ts            # Sequential automation engine
│   │   ├── scheduler.ts            # Cron-based task scheduler
│   │   ├── computer-registry.ts    # Remote computer management
│   │   ├── computer-agent.ts       # Remote agent (runs on each PC)
│   │   ├── dashboard.ts            # Real-time system metrics
│   │   ├── search.ts               # Conversation search & export
│   │   ├── security.ts             # Security config & audit
│   │   ├── projects.ts             # Project management
│   │   ├── file-sharing.ts         # File upload/download
│   │   ├── clipboard.ts            # Clipboard sync
│   │   ├── plugin-loader.ts        # Dynamic plugin system
│   │   ├── git-routes.ts           # Git operations API
│   │   ├── tools-*.ts              # Tool implementations (web, desktop, filesystem, etc.)
│   │   └── api-cascade.ts          # Cascade MCP API routes
│   ├── plugins/                    # Plugin directory
│   └── data/                       # Persistent data (JSON files)
├── web/                            # Frontend PWA
│   └── src/
│       ├── App.tsx                 # Main app (126K+ lines)
│       ├── config.ts               # Shared BRIDGE_URL config
│       ├── contexts/AuthContext.tsx # Auth state management
│       ├── hooks/useMobile.ts      # Mobile detection & gestures
│       ├── lib/
│       │   ├── api.ts              # API client helpers
│       │   ├── supabase.ts         # Supabase client init
│       │   ├── flipperBle.ts       # Flipper Zero BLE protocol
│       │   └── bleScanner.ts       # BLE device scanner
│       └── components/             # 30+ view components
│           ├── CodeEditorView.tsx       # Full IDE (173K)
│           ├── FrankensteinView.tsx     # Training dashboard (112K)
│           ├── ResearchLabView.tsx      # Research experiments (90K)
│           ├── FlipperZeroView.tsx      # Hardware control (51K)
│           ├── DashboardView.tsx        # System metrics (48K)
│           ├── ArchonDashboard.tsx      # Knowledge base UI (44K)
│           ├── AgentChainsView.tsx      # DAG workflow builder (41K)
│           ├── SettingsView.tsx         # Global settings (38K)
│           ├── FrankensteinChatView.tsx # Cognitive AI chat (31K)
│           ├── BattleArenaView.tsx      # AI competition (29K)
│           ├── SwarmView.tsx            # Swarm intelligence (28K)
│           ├── NetworkView.tsx          # Bot network (25K)
│           ├── GitView.tsx             # Git integration (24K)
│           ├── HierarchyView.tsx       # Agent hierarchy (21K)
│           ├── DebateView.tsx          # Political debate (21K)
│           ├── PluginsView.tsx         # Plugin marketplace (20K)
│           ├── SchedulerView.tsx       # Task scheduler (19K)
│           ├── SelfImproveView.tsx     # Self-improvement (17K)
│           ├── ComputersView.tsx       # Remote PCs (15K)
│           ├── WorkflowsView.tsx       # Automations (14K)
│           ├── FilesView.tsx           # File sharing (13K)
│           ├── ProjectsView.tsx        # Projects (12K)
│           ├── SearchView.tsx          # Search (11K)
│           ├── AdminPanel.tsx          # User admin (9K)
│           ├── ClipboardView.tsx       # Clipboard (7K)
│           ├── LoginView.tsx           # Auth (7K)
│           ├── ConversationSidebar.tsx  # Chat history
│           ├── VoiceButton.tsx         # Speech I/O
│           ├── XTerminal.tsx           # Terminal component
│           └── InstallView.tsx         # Install guide
├── frankenstein-ai/                # Cognitive AI research
│   ├── continuous_train.py         # Main training loop
│   ├── code_agent.py               # Code generation agent
│   ├── task_generator*.py          # Task generators v1-v4
│   ├── cognition.py                # HDC 4096D processing
│   ├── agency.py                   # Active Inference (pymdp)
│   ├── memory.py                   # Ebbinghaus memory
│   ├── perception.py               # Feature extraction
│   ├── emotions.py                 # Emotional state engine
│   ├── circadian.py                # Sleep/wake cycles
│   ├── gut_feeling.py              # Somatic marker intuition
│   ├── frankenstein_swarm.py       # Multi-agent swarm
│   ├── battle_arena.py             # vs-LLM competition
│   ├── ab_test.py                  # Statistical A/B testing
│   ├── ablation_runner.py          # Component contribution analysis
│   ├── spaced_repetition.py        # SM-2 review scheduler
│   └── RESEARCH.md / ROADMAP.md    # Research documentation
├── mcp-server/                     # MCP server for Windsurf
├── landing/                        # Static marketing page
├── installer/                      # Cross-platform install scripts
├── deploy/                         # Deployment configs
└── docs/                           # Architecture documentation
```

---

## 🧟 Frankenstein AI — Kognitiv Hybridarkitektur

A bio-inspired meta-learning agent that combines breakthrough cognitive technologies to learn *how to think about problems*, not just memorize answers. **Achieved 100% on superhuman benchmark** (21/21) vs Gemini 2.0 Flash at 81%.

### Cognitive Pipeline

```
Task → Perception (Features) → Cognition (HDC) → Agency (AIF) → Strategy
                                     ↕                  ↕
                              Concept Library     Exploration/Exploitation
                                     ↕                  ↕
                              LLM (Gemini/Grok) ← Strategy + Context → Code
                                     ↓
                              Evaluation (sandbox) → Feedback
                                     ↓
                              Memory (Ebbinghaus) → Consolidate/Forget
```

### The Four Pillars

| Pillar | Technology | Role |
|---|---|---|
| **Perception** | Feature extraction (keyword-boosting) | Task → 64D feature vector |
| **Cognition** | Hyperdimensional Computing (HDC, 4096D) | One-shot pattern matching, concept library |
| **Agency** | Active Inference (AIF, pymdp) | Curiosity-driven strategy selection via free energy minimization |
| **Memory** | Ebbinghaus + ChromaDB | Biological forgetting curve, spaced consolidation |

### Extended Cognitive Stack

| Module | File | Description |
|---|---|---|
| Gut Feeling | `gut_feeling.py` | Sub-symbolic intuition — fast pre-LLM assessment (Damasio's Somatic Markers) |
| Emotions | `emotions.py` | Ekman's 6 basic emotions affecting strategy, temperature, exploration |
| Circadian/Sleep | `circadian.py` | 16h wake/8h sleep cycles, NREM/REM consolidation, DreamEngine |
| Promotion Pipeline | `promotion_pipeline.py` | S2→S1→S0 automatic knowledge distillation |
| Chaos Monkey | `chaos_monkey.py` | Self-correction training via intentional bug injection |
| Swarm Intelligence | `frankenstein_swarm.py` | 3 specialized agents with Mycelium protocol, consensus |
| Battle Arena | `battle_arena.py` | Live Frankenstein vs bare LLM competition |
| A/B Testing | `ab_test.py` | Statistical proof that the stack improves over raw LLM |
| Spaced Repetition | `spaced_repetition.py` | SM-2 scheduler — revisits weak categories with adaptive intervals |
| Ablation Runner | `ablation_runner.py` | Systematic component contribution analysis |
| Cross-Domain Bridge | `cross_domain_bridge.py` | Transfer learning across task domains |
| Symbolic Regression | `symbolic_regression.py` | Mathematical pattern discovery |
| Math Research | `math_research.py` | Automated mathematical exploration |
| Multi-LLM Router | `multi_llm_router.py` | Intelligent routing between LLM providers |

### Performance Highlights

| Metric | Score |
|---|---|
| Superhuman Benchmark | **100%** (21/21) — vs Gemini 2.0 Flash 81% |
| Overall solve rate | 91.8% |
| System 0 (no-LLM) utilization | 83.6% |
| Avg response time | 401 ms |

### Running Frankenstein AI

```bash
cd frankenstein-ai
pip install -r requirements.txt

# Training
python -u continuous_train.py

# A/B test
python ab_test.py 30

# Battle arena
python battle_arena.py http://localhost:3031

# Ablation study
python ablation_runner.py --config all --tasks 200

# Superhuman benchmark
python superhuman_benchmark.py
```

See `frankenstein-ai/RESEARCH.md` for research documentation and `frankenstein-ai/ROADMAP.md` for the research plan.

---

## Performance Optimizations

- **Socket.IO throttling** — Streaming events throttled to 50ms
- **Message cap** — Max 200 messages per chat to prevent DOM bloat
- **React.memo** — Memoized Sparkline, CircularGauge, and heavy components
- **Polling reduction** — Dashboard 15s, Computers 15s, Network 3s
- **Gzip compression** — All HTTP responses compressed
- **Cache headers** — Hashed assets cached 1 year (immutable)
- **Lazy loading** — All 30+ views loaded via `React.lazy` + `Suspense`
- **Memoized state** — Per-tab conversation lists, token formatting, cost calculations

---

## 🚀 Roadmap — Nästa förbättringar

### Hög prioritet

- **Modularisera monoliter** — Dela upp `bridge/src/index.ts`, `web/src/App.tsx` och `CodeEditorView.tsx` i feature-moduler för snabbare iteration och mindre regressionsrisk.
- **Testlager för kritiska flöden** — Lägg till integrationstester för auth, workspace-filoperationer, git-routes, snapshots och webhooks.
- **Enhetlig config-hantering** — Inför gemensam validering av env-variabler (bridge/web/mcp-server) med tydlig startup-felrapportering.
- **Observability** — Standardisera structured logs + request-id och felklassning för enklare drift/debugg.

### Medium prioritet

- **Multi-user collaboration** — Delade projekt, mentions och kommentarsflöde i konversationsvyer.
- **Multimodal direkt i chat** — Vision-uppladdning i ordinarie chattvyer (inte bara separat Vision-view).
- **Backup/migration tooling** — Export/import för memories, rules, projects och snapshots mellan miljöer.
- **API hardening** — Konsekvent rate-limit och auth-policy per route-grupp, plus tydligare endpoint-versionering.

### Längre sikt

- **Event-driven intern arkitektur** — Minska tight koppling mellan moduler via intern event-bus.
- **Job queue för tunga tasks** — Flytta långkörande AI- och indexeringsjobb till kö med status/spårning.
- **Federerad lärandemodell** — Synka anonymiserade Frankenstein-insikter mellan instanser.
- **Policy sandbox för plugins/workflows** — Finmaskiga rättigheter per plugin och workflow-step.

---

## Docker

```bash
# Build and run everything
docker-compose up -d

# Or just the bridge
docker build -t gracestack-ai-lab .
docker run -p 3031:3031 --env-file bridge/.env gracestack-ai-lab
```

---

## License

MIT
