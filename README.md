# Gracestack AI Lab

Mobile/web AI command center by **Gracestack AB** — multi-LLM orchestration, research lab, bot networks, and remote computer control.

Inspired by [Happy Coder](https://github.com/slopus/happy) and [MCP Bridge API](https://github.com/INQUIRELAB/mcp-bridge-api).

## Architecture

```
Windsurf/IDE ←→ MCP Server (stdio) ←→ Bridge Server (Express+Socket.IO) ←→ PWA (mobile/web)
                                                    ↕                              ↕
                                          Computer Agents (remote PCs)    Cloudflare Tunnel
```

### Packages

| Package | Description |
|---|---|
| `mcp-server/` | MCP server (stdio) — tools: `send_to_mobile`, `read_mobile_messages`, `ask_mobile`, `mobile_status` |
| `bridge/` | Express + Socket.IO relay server with AI agents (Claude, Gemini, Ollama) |
| `web/` | React + Vite + Tailwind PWA — mobile-first UI with 16+ views |
| `bridge/src/computer-agent.ts` | Lightweight agent for remote computers |
| `bridge/plugins/` | Plugin directory for extending AI capabilities |
| `frankenstein-ai/` | Bio-inspired meta-learning agent (HDC + Active Inference + Ebbinghaus) — Python |
| `installer/` | One-line install scripts for Windows, macOS, Linux |

---

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure API keys

Create `bridge/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
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

### 5. Open on your phone

Open the Cloudflare Tunnel URL (printed in console) or `http://<local-ip>:3031` on your phone.

### 6. Add remote computers (optional)

```bash
cd bridge
npm run agent -- --bridge http://<bridge-ip>:3031 --name "Gaming PC"
```

---

## Features

### 💬 Chat & AI

- **Claude Chat** — Full conversation with Claude (Anthropic) including streaming, tool use, markdown rendering
- **Gemini Chat** — Separate Gemini (Google) chat tab with streaming
- **AI Research Arena** — Claude ↔ Gemini multi-round research collaboration with shared memory
- **Multi-LLM Orchestrator (Lab)** — Route tasks to best available LLM, consensus engine, bias detection
- **Bot Network** — Autonomous AI bot network with workers, validators, coordinators, innovators — real Gemini-driven evolution
- **Conversation History** — Per-tab conversation sidebar with save/load/delete, persisted to localStorage
- **Voice Input/Output** — Speech-to-text (Web Speech API) and text-to-speech for hands-free use
- **Slash Commands** — `/screenshot`, `/search`, `/files`, `/status`, `/clear`, `/memory`, `/rag`

### 🛠️ Tools & Automation

- **40+ AI Tools** — Web search, screenshots, file system, process management, desktop control, code execution
- **Scheduler** — Cron-based task scheduling (AI prompts, commands, HTTP requests, notifications)
- **Workflows** — Chain multiple AI actions into reusable step-by-step automations
- **Plugin System** — Extend AI with custom tools via `bridge/plugins/`

### 🖥️ Infrastructure

- **Multi-Computer** — Register remote PCs, AI routes tasks to best machine based on capabilities
- **Dashboard** — Real-time system metrics (CPU, RAM, uptime), AI stats, cost tracking, activity grid
- **Cloudflare Tunnel** — Auto-started HTTPS tunnel for remote access (auto-restarts on crash)
- **File Sharing** — Upload/download files between mobile and desktop with drag-and-drop
- **Clipboard Sync** — Copy on mobile, paste on desktop (and vice versa)

### 🧠 Knowledge & Memory

- **RAG Knowledge Base** — Index text/files, semantic search, chunk-based retrieval
- **AI Memories** — Persistent memory system with tags and search
- **Shared Memory** — Cross-AI memory for Arena research sessions
- **Global Rules** — Editable system prompt rules
- **Projects** — Context switching with separate memories, RAG index, and settings per project

### 🔬 Self-Improvement

- **Reflexion Loop** — Agent critiques its own responses and retries (Shinn 2023)
- **Skill Library** — Stores successful tool chains for reuse (Voyager pattern)
- **Self-Evaluation** — Rates responses, learns from user feedback
- **Worker Learning** — Cross-worker performance history per task type

### � Mobile & UX

- **PWA** — Installable as app on iOS/Android
- **Touch-optimized** — Swipe between tabs, touch-friendly buttons
- **Real-time streaming** — Throttled Socket.IO for smooth token streaming
- **Notification center** — In-app notifications with history
- **Dark theme** — Slate-based dark UI optimized for OLED

### 🔒 Security

- **Rate limiting** — Configurable requests per minute
- **Token budget** — Max tokens per session with 80% warning
- **Audit logging** — All AI interactions logged
- **Security config** — Configurable allowed tools and permissions

---

## Web App Views

| View | Description |
|---|---|
| **Claude Chat** | Main chat with Claude, markdown rendering, code highlighting, feedback |
| **Gemini Chat** | Separate Gemini chat with streaming |
| **Arena** | Claude ↔ Gemini research collaboration with shared memories |
| **Lab** | Multi-LLM orchestrator with workers, tasks, bias alerts, audit log |
| **Dashboard** | System gauges, sparklines, AI stats, cost bar, activity grid |
| **Tools** | Quick actions and full tool catalog |
| **Computers** | Remote computer management and task execution |
| **Scheduler** | Create/manage cron jobs and scheduled tasks |
| **Files** | File sharing with upload, download, preview |
| **Search** | Full-text search across all conversations |
| **Projects** | Project management with context switching |
| **Clipboard** | Clipboard sync history |
| **Plugins** | Plugin management (enable/disable) |
| **Workflows** | Automation builder with step chains |
| **Network** | Bot network visualization with evolution |
| **Self-Improve** | Skills, evaluations, reflections |
| **Settings** | Global rules, memories, RAG, security, audit |

---

## API Endpoints

### Core
| Endpoint | Description |
|---|---|
| `GET /api/status` | Connection status and client count |
| `GET/POST/DELETE /api/messages` | Chat messages (CRUD) |
| `POST /api/ask` | Ask mobile user a question (long-poll) |
| `GET /api/qr` | QR code for pairing |
| `GET /api/tunnel` | Cloudflare Tunnel URL |
| `GET /api/dashboard` | Real-time system metrics and AI stats |
| `GET /api/tokens` | Token usage and budget |
| `POST /api/tokens/budget` | Set token budget |

### Gemini
| Endpoint | Description |
|---|---|
| `GET /api/gemini/status` | Gemini status and tokens |
| `GET/DELETE /api/gemini/messages` | Gemini conversation |

### Arena (Research Lab)
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
| `POST /api/orchestrator/workers/:id/reset` | Reset errored worker |
| `GET /api/orchestrator/learnings` | Cross-worker learning data |
| `GET /api/orchestrator/bias-alerts` | Bias detection alerts |
| `GET /api/orchestrator/audit` | Orchestrator audit log |

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
| `GET /api/schedule-results` | Execution results |

### Files
| Endpoint | Description |
|---|---|
| `GET /api/files` | List shared files |
| `POST /api/files/upload` | Upload file (base64) |
| `GET /api/files/:id/download` | Download file |
| `GET /api/files/stats` | Storage statistics |

### Search & Export
| Endpoint | Description |
|---|---|
| `GET /api/search?q=...` | Full-text search with scoring |
| `GET /api/search/stats` | Conversation statistics |
| `GET /api/search/export` | Export as Markdown/JSON |

### Knowledge & Memory
| Endpoint | Description |
|---|---|
| `GET/POST /api/memories` | List/create memories |
| `PUT/DELETE /api/memories/:id` | Update/delete memory |
| `GET/PUT /api/global-rules` | Global AI rules |
| `GET /api/rag/sources` | RAG knowledge sources |
| `POST /api/rag/index-text` | Index text into RAG |
| `GET /api/rag/stats` | RAG statistics |

### Projects
| Endpoint | Description |
|---|---|
| `GET/POST /api/projects` | List/create projects |
| `PUT/DELETE /api/projects/:id` | Update/delete project |
| `POST /api/projects/:id/activate` | Switch to project |

### Clipboard
| Endpoint | Description |
|---|---|
| `GET /api/clipboard` | Clipboard history |
| `POST /api/clipboard` | Send to clipboard |
| `GET /api/clipboard/desktop` | Read desktop clipboard |

### Plugins & Workflows
| Endpoint | Description |
|---|---|
| `GET /api/plugins` | List plugins |
| `POST /api/plugins/:id/toggle` | Enable/disable plugin |
| `GET /api/workflows` | List workflows |
| `POST /api/workflows` | Create workflow |
| `POST /api/workflows/:id/run` | Run workflow |

### Bot Network
| Endpoint | Description |
|---|---|
| `GET /api/network` | Network state (bots, knowledge, events) |
| `POST /api/network/start` | Start network |
| `POST /api/network/stop` | Stop network |
| `POST /api/network/step` | Single tick |
| `POST /api/network/reset` | Reset network |
| `POST /api/network/topic` | Set research topic |

### Self-Improvement
| Endpoint | Description |
|---|---|
| `GET /api/self-improve/skills` | Learned skills |
| `GET /api/self-improve/evaluations` | Response evaluations |
| `GET /api/self-improve/reflections` | Agent reflections |
| `POST /api/self-improve/message-feedback` | User feedback on messages |

### Ollama (Local LLM)
| Endpoint | Description |
|---|---|
| `GET /api/ollama/status` | Ollama status & models |
| `GET /api/ollama/models` | Refresh available models |
| `POST /api/ollama/pull` | Pull a new model |

### Security
| Endpoint | Description |
|---|---|
| `GET /api/security` | Security configuration |
| `GET /api/audit` | Audit log |

---

## Socket.IO Events

### Client → Server
| Event | Description |
|---|---|
| `message` | Send chat message |
| `gemini_message` | Send Gemini message |
| `answer` | Answer a pending question |

### Server → Client
| Event | Description |
|---|---|
| `message` / `history` | Claude messages |
| `agent_stream` | Claude streaming tokens |
| `agent_status` | Tool use status (thinking, tool_start, tool_done) |
| `gemini_message` / `gemini_history` | Gemini messages |
| `gemini_stream` | Gemini streaming tokens |
| `arena_message` / `arena_history` | Arena messages |
| `arena_status` | Arena round progress |
| `orchestrator_task` | Lab task updates |
| `orchestrator_worker` | Worker status changes |
| `token_usage` | Token counter updates |
| `tunnel_url` | Cloudflare Tunnel URL |
| `question` | Pending question for user |
| `budget_warning` | Token budget 80% alert |
| `shared_memories` | Arena shared memories |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Claude API key (required for Claude chat) |
| `GEMINI_API_KEY` | — | Gemini API key (required for Gemini/Arena/Network) |
| `GRACESTACK_BRIDGE_URL` | `http://localhost:3031` | Bridge URL (for MCP server) |
| `PORT` | `3031` | Bridge server port |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3` | Default Ollama model |
| `NO_TUNNEL` | `0` | Set to `1` to disable Cloudflare Tunnel |
| `TOKEN_BUDGET` | `0` | Max tokens per session (0 = unlimited) |
| `RATE_LIMIT_MAX` | `30` | Max requests per minute |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |

---

## Project Structure

```
gracestack-ai-lab/
├── bridge/                    # Backend server
│   ├── src/
│   │   ├── index.ts           # Main server (Express + Socket.IO + all routes)
│   │   ├── agent.ts           # Claude AI agent with 40+ tools
│   │   ├── agent-gemini.ts    # Gemini AI agent
│   │   ├── agent-ollama.ts    # Ollama local LLM agent
│   │   ├── llm-orchestrator.ts # Multi-LLM coordinator with consensus
│   │   ├── bot-network.ts     # Autonomous AI bot network
│   │   ├── shared-memory.ts   # Cross-AI shared memory
│   │   ├── self-improve.ts    # Reflexion, skills, self-evaluation
│   │   ├── workflows.ts       # Automation workflow engine
│   │   ├── scheduler.ts       # Cron-based task scheduler
│   │   ├── computer-registry.ts # Remote computer management
│   │   ├── computer-agent.ts  # Remote agent (runs on each PC)
│   │   ├── dashboard.ts       # Real-time metrics
│   │   ├── rag.ts             # RAG knowledge base
│   │   ├── memory.ts          # Persistent AI memories
│   │   ├── search.ts          # Conversation search & export
│   │   ├── security.ts        # Security config & audit
│   │   ├── projects.ts        # Project management
│   │   ├── file-sharing.ts    # File upload/download
│   │   ├── clipboard.ts       # Clipboard sync
│   │   ├── plugin-loader.ts   # Dynamic plugin system
│   │   ├── tools-*.ts         # Tool implementations (web, desktop, filesystem, etc.)
│   │   └── api-cascade.ts     # Cascade MCP API routes
│   ├── plugins/               # Plugin directory
│   └── data/                  # Persistent data (JSON files)
├── web/                       # Frontend PWA
│   └── src/
│       ├── App.tsx            # Main app (2200+ lines, all tabs)
│       ├── config.ts          # Shared BRIDGE_URL config
│       └── components/        # 16 view components
│           ├── DashboardView.tsx
│           ├── ComputersView.tsx
│           ├── SchedulerView.tsx
│           ├── FilesView.tsx
│           ├── SearchView.tsx
│           ├── ProjectsView.tsx
│           ├── ClipboardView.tsx
│           ├── PluginsView.tsx
│           ├── ToolsView.tsx
│           ├── SettingsView.tsx
│           ├── WorkflowsView.tsx
│           ├── NetworkView.tsx
│           ├── SelfImproveView.tsx
│           ├── InstallView.tsx
│           ├── ConversationSidebar.tsx
│           └── VoiceButton.tsx
├── mcp-server/                # MCP server for Windsurf
│   └── src/index.ts
└── installer/                 # One-line install scripts
```

---

## 🧟 Frankenstein AI — Kognitiv Hybridarkitektur

A bio-inspired meta-learning agent that combines three breakthrough technologies to learn *how to think about problems*, not just memorize answers.

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

### Current Performance (Feb 2026)

| Metric | Current | Target |
|---|---|---|
| Total tasks solved | 20,489 | > 1,000,000 |
| Overall solve rate | 91.8% | 99.99% |
| System 0 utilization | 83.6% | > 95% |
| System 2 (LLM) utilization | 15.2% | < 2% |
| Avg response time | 401 ms | < 100 ms |

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
```

See `frankenstein-ai/RESEARCH.md` for research documentation and `frankenstein-ai/ROADMAP.md` for the research plan.

---

## Performance Optimizations

- **Socket.IO throttling** — Streaming events throttled to 50ms (agent_stream, gemini_stream)
- **Message cap** — Max 200 messages per chat to prevent DOM bloat
- **React.memo** — Memoized Sparkline, CircularGauge, and other heavy components
- **Polling reduction** — Dashboard 15s, Computers 15s, Network 3s (reduced from 2-5s)
- **Gzip compression** — All HTTP responses compressed via `compression` middleware
- **Cache headers** — Hashed assets cached 1 year (immutable), HTML no-cache
- **Lazy loading** — All sub-views loaded via `React.lazy` + `Suspense`
- **Memoized state** — Per-tab conversation lists, token formatting, cost calculations

---

## License

MIT
