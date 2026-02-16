# Cascade Remote — Feature Roadmap & Status

## Status: ✅ Full-stack implementerat (2026-02-09)

> Backend + Frontend + Prestanda-optimeringar klara. 30+ backend-moduler, 16 frontend-views, 80+ API-endpoints.

---

## ✅ KLART — Backend + Frontend

### 1. Claude Chat ✅
- [x] `agent.ts` — Claude AI-agent med 40+ verktyg (web, filesystem, desktop, process, etc.)
- [x] Streaming med `agent_stream` Socket.IO event
- [x] Markdown-rendering med kodmarkering (Prism)
- [x] Slash-kommandon: `/screenshot`, `/search`, `/files`, `/status`, `/clear`, `/memory`, `/rag`
- [x] Röstinput/output (Web Speech API + SpeechSynthesis)
- [x] Meddelandefeedback (tumme upp/ner)
- [x] Frontend: fullständig chatt-vy med streaming, verktygsindikator, kopiera-knappar

### 2. Gemini Chat ✅
- [x] `agent-gemini.ts` — Gemini AI-agent med streaming
- [x] Separat chatt-tab med egen konversationshistorik
- [x] Token-räknare
- [x] Frontend: komplett Gemini-chatt med streaming

### 3. AI Research Arena ✅
- [x] Claude ↔ Gemini multi-round forskningssamarbete
- [x] `shared-memory.ts` — Delat minne mellan AI:er (insights, findings, decisions)
- [x] Forskningssessioner med faser (analyze → discuss → synthesize → conclude)
- [x] Quick mode (4 rundor) och full mode (8 rundor)
- [x] Frontend: Arena-tab med delat minne-drawer, start/stopp, meddelanden per AI

### 4. Multi-LLM Orchestrator (Lab) ✅
- [x] `llm-orchestrator.ts` — Coordinator-Worker arkitektur
- [x] 4 worker-slots (Claude, Gemini, + 2 extensible)
- [x] Health monitoring (latens, success rate, tokens, kostnad)
- [x] Consensus engine för cross-validation
- [x] Bias detection via consensus divergence analysis
- [x] Cross-worker learning (prestanda per task-typ)
- [x] Audit logging av alla LLM-interaktioner
- [x] Frontend: Lab-tab med workers grid, tasks, bias alerts, audit log, learnings

### 5. Bot Network ✅
- [x] `bot-network.ts` — Autonomt AI-drivet multi-agent system
- [x] 4 roller: Workers, Validators, Coordinators, Innovators
- [x] Riktiga Gemini-anrop per tick
- [x] Reproduktion, mutation, evolution
- [x] Kunskapsbas med validering och confidence scoring
- [x] Frontend: NetworkView med bot-grid, events, knowledge, intelligence-grafer

### 6. Multi-dator stöd ✅
- [x] `computer-registry.ts` — Registry med smart routing
- [x] `computer-agent.ts` — Lättviktig remote agent
- [x] AI:n väljer bästa dator baserat på kapacitet, prestanda, tags
- [x] Frontend: ComputersView med status, kapacitet, task-historik

### 7. Schemalagda uppgifter ✅
- [x] `scheduler.ts` — Cron-baserad scheduler med intervall och engångs-timer
- [x] Åtgärdstyper: ai_prompt, command, http_request, notification
- [x] Frontend: SchedulerView med skapa/redigera/ta bort/kör nu

### 8. Fildelning ✅
- [x] `file-sharing.ts` — Upload/download med metadata och MIME-detection
- [x] Frontend: FilesView med drag-and-drop upload, preview, download

### 9. Konversationshistorik & sök ✅
- [x] `search.ts` — Full-text sök med scoring
- [x] `ConversationSidebar.tsx` — Per-tab konversationshistorik (spara/ladda/ta bort)
- [x] Persistens via localStorage
- [x] Frontend: SearchView + ConversationSidebar i alla chattar

### 10. Plugin-system ✅
- [x] `plugin-loader.ts` — Dynamisk plugin-laddning
- [x] Frontend: PluginsView med enable/disable

### 11. Workflows ✅
- [x] `workflows.ts` — Automation med steg-kedjor
- [x] Steg-typer: ai_prompt, command, http_request, condition, delay, notification
- [x] `{{prev}}` template för att referera föregående stegs output
- [x] Frontend: WorkflowsView med skapa/kör/ta bort

### 12. Projekt-läge ✅
- [x] `projects.ts` — Separata minnen, RAG-index, systemPrompt per projekt
- [x] Frontend: ProjectsView med skapa/aktivera/redigera

### 13. Clipboard-synk ✅
- [x] `clipboard.ts` — Clipboard-hantering med historik
- [x] Frontend: ClipboardView med synk mobil ↔ desktop

### 14. Ollama (Lokal LLM) ✅
- [x] `agent-ollama.ts` — Auto-detect, registrerad som orchestrator-worker
- [x] API: status, modeller, pull

### 15. Self-Improvement ✅
- [x] `self-improve.ts` — Reflexion Loop, Skill Library, Self-Evaluation
- [x] Frontend: SelfImproveView med skills, evaluations, reflections

### 16. Dashboard ✅
- [x] `dashboard.ts` — Realtids-metrics (CPU, RAM, uptime, AI-stats, kostnader)
- [x] Frontend: DashboardView med gauges, sparklines, activity grid, computers

### 17. RAG Knowledge Base ✅
- [x] `rag.ts` — Indexering, chunking, semantisk sökning
- [x] Frontend: Settings → Knowledge tab

### 18. Säkerhet ✅
- [x] `security.ts` — Rate limiting, token budget, audit logging
- [x] Frontend: Settings → Security tab

### 19. Röstinput/output ✅
- [x] `VoiceButton.tsx` — Web Speech API (SpeechRecognition) + TTS (SpeechSynthesis)
- [x] Mikrofon-knapp + uppläsnings-toggle i chatten

### 20. Cloudflare Tunnel ✅
- [x] Auto-start vid serverstart, auto-restart vid krasch (5s delay)
- [x] URL via Socket.IO `tunnel_url` event + `GET /api/tunnel`
- [x] `NO_TUNNEL=1` i .env för att stänga av

### 21. Prestanda-optimeringar ✅
- [x] Socket.IO throttling (agent_stream 50ms, gemini_stream 50ms, orchestrator_worker 200ms)
- [x] Meddelandebegränsning (max 200 per chatt)
- [x] React.memo på Sparkline, CircularGauge
- [x] Polling-reduktion (Dashboard 15s, Computers 15s, Network 3s)
- [x] Gzip compression middleware
- [x] Cache headers (hashed assets 1yr immutable, HTML no-cache)
- [x] Lazy loading av alla sub-views
- [x] BRIDGE_URL centraliserad till `config.ts` (15 filer)
- [x] Memoized per-tab konversationslistor

---

## 💡 Framtida funktioner — Idéer

### 🔥 Hög prioritet

#### A. Bildanalys i chatten
- [ ] Skicka bilder/screenshots till Claude Vision / Gemini Vision
- [ ] Klistra in bilder från clipboard
- [ ] Kamera-knapp i mobilen för att fota och fråga AI

#### B. Multi-user stöd
- [ ] Autentisering (JWT eller passkeys)
- [ ] Separata sessioner per användare
- [ ] Roller: admin, user, viewer
- [ ] Delad workspace med permissions

#### C. Push-notifikationer
- [ ] Web Push API (VAPID keys) — notiser även när appen är stängd
- [ ] Konfigurerbart: vilka events triggar push
- [ ] Webhook-registrering för externa integrationer

#### D. Förbättrad Arena
- [x] Fler AI-deltagare — Ollama (lokal LLM) tillagd som 5:e deltagare med "Lokal Expert / Djävulens advokat"-roll
- [x] Röstning/ranking av AI-svar — 👍/👎 per meddelande, ranking-API (`/api/arena/ranking`)
- [x] Automatisk sammanfattning av forskningssessioner (fanns redan)
- [x] Export av Arena-resultat till Markdown — `/api/arena/export` + Export-knapp i UI

### ⚡ Medium prioritet

#### E. Skärmdelning / Live-view
- [ ] MJPEG/WebRTC-stream av skärmen till mobilen
- [ ] Klickbar overlay — styr datorn från mobilen
- [ ] Annoterings-verktyg (rita på skärmen)

#### F. Git-integration
- [ ] Visa git status, diff, log i frontend
- [ ] AI-genererade commit messages
- [ ] Branch-hantering och PR-review

#### G. Förbättrad RAG ✅
- [x] PDF-indexering (`ragIndexPdf()` via pdf-parse, base64-upload från frontend, temp-fil-hantering)
- [x] URL-indexering (`ragIndexUrl()` med HTML-stripping, JSON/text-stöd, 15s timeout)
- [x] Vektor-embeddings (`ragSearchSemantic()` + `ragHybridSearch()` via Ollama, cosine similarity, BM25-fallback)
- [x] Automatisk re-indexering vid filändringar (`ragStartAutoReindex()` med fs.watch, debounce 2s, stöd för PDF/text)

#### H. AI Agent Chains ✅
- [x] Visuell drag-and-drop workflow builder (`AgentChainsView.tsx` — canvas med noder, kopplingar, config panel)
- [x] Villkorlig logik (if/else baserat på AI-svar — 9 villkorstyper: contains, equals, regex, greater_than, etc.)
- [x] Loopar och retry-mekanismer (count/until-loopar, retry med exponentiell backoff)
- [x] Schemalagda workflow-körningar (scheduler-integration via `scheduleId`, sub-chain-stöd)

#### I. Förbättrad Dashboard ✅
- [x] Historiska trender (`getDailyTrends()` + `getWeeklyTrends()`, persisterade till disk, stacked bar charts i frontend)
- [x] Kostnadsbudget med alerts (`setBudget()` + `checkBudgetAlerts()`, dag/vecka/månad-gränser, konfigurerbar threshold)
- [x] Jämförelse mellan AI-modeller (`getModelComparison()` — latens, $/request, $/1k tokens, snabbast/billigast-highlight)
- [x] Exportera metrics till CSV (`/api/dashboard/export/csv` + `/api/dashboard/export/snapshots`, download-knappar i UI)

### � Lägre prioritet / Experimentellt

#### J. Lokal modell-finetuning
- [ ] Exportera konversationer som training data (JSONL)
- [ ] Ollama-baserad finetuning pipeline
- [ ] A/B-test mellan finetunad och bas-modell

#### K. Plugin Marketplace ✅
- [x] Sökbar katalog av community-plugins (8 built-in plugins med kategorier, betyg, tags)
- [x] One-click install från URL (GitHub raw / valfri URL)
- [x] Plugin-sandboxing för säkerhet (blockerar fs, child_process, eval, process.exit)

#### L. Mobil-specifika features ✅
- [x] Haptic feedback vid AI-svar (`useMobile.ts` hook, konfigurerbar per event: message/thinking/done/error/question, 3 intensitetsnivåer, Settings → Mobil)
- [x] Widgets (iOS/Android) för snabb-frågor (PWA shortcuts i `manifest.json`: Ny fråga, Screenshot, Sök, Dashboard + URL-param-hantering i App.tsx)
- [x] Siri/Google Assistant integration (Web Share Target API i manifest — ta emot delat innehåll från andra appar, VoiceButton med Web Speech API)
- [x] Offline-läge med cached konversationer (Service Worker v2 med API-caching, offline-banner, message queue med auto-flush vid reconnect, conversation caching i localStorage)

#### M. Team Collaboration
- [ ] Delad konversationshistorik
- [ ] @mentions och notifikationer
- [ ] Kommentarer på AI-svar
- [ ] Gemensamma projekt med rollbaserad access

#### N. Code Playground
- [ ] Inline code-editor med syntax highlighting
- [ ] Kör JavaScript/Python direkt i browsern (WebAssembly)
- [ ] AI-assisterad kodgranskning
- [ ] Diff-vy för AI-genererade kodändringar

#### O. Monitoring & Alerting
- [ ] Healthcheck-endpoint för uptime-monitoring
- [ ] Slack/Discord/Telegram-integration för alerts
- [ ] Automatisk eskalering vid fel
- [ ] SLA-tracking per AI-modell

---

## 🧟 Frankenstein AI — Nästa Steg mot Övermäktighet

> Baserat på analysen i "Frankenstein AI: Nästa steg mot övermäktighet" (PDF, feb 2026).
> Jämfört med befintlig kodbas — vad finns redan, vad kan implementeras.

### ✅ Redan implementerat (från PDF-rekommendationer)

| Rekommendation | Fil | Status |
|---|---|---|
| Ablation Study Framework | `ablation_runner.py` (461 rader) | ✅ 7 konfigurationer (baseline, no_hdc, no_aif, no_ebbinghaus, no_circadian, no_gut, no_sleep) |
| S2→S1→S0 Promotion Pipeline | `promotion_pipeline.py` (269 rader) | ✅ 3 framgångar → S1, 10 konsekutiva → S0, loggning till promotions.log |
| Chaos Monkey / Självläkning | `chaos_monkey.py` (252 rader) | ✅ 6 mutationstyper (off-by-one, wrong operator, variable swap, etc.) |
| Gut Feeling / Metakognitiv filtrering | `gut_feeling.py` (491 rader) | ✅ HDC familiarity + historik + momentum + komplexitet + Ebbinghaus + AIF |
| Sömnfas / Drömmotor | `circadian.py` (550 rader) | ✅ 16h vaken/8h sömn, 5×90min NREM/REM-cykler, DreamEngine med HDC-insikter |
| Multi-Agent Swarm | `frankenstein_swarm.py` (713 rader) | ✅ 3 specialiserade agenter, Mycelium-protokoll, konsensus, emergensanalys |
| Emotioner (Ekman) | `emotions.py` (478 rader) | ✅ 6 grundemotioner som påverkar strategi, temperature, exploration |
| A/B-test (Frankenstein vs ren LLM) | `ab_test.py` (557 rader) | ✅ Statistisk jämförelse med bridge-integration |
| Battle Arena | `battle_arena.py` (386 rader) | ✅ Live-tävling med realtids-events till bridge |

### 🔥 Implementerbart — Hög prioritet

#### P. Hierarkisk Agent-koordinering (Planner/Executor/Critic/Validator) ✅
- [x] Planner Agent — bryter ner komplexa uppgifter till delsteg (LLM-driven, genererar JSON-plan med specialty, dependencies, maxAttempts)
- [x] Executor Agents — specialiserade arbetare per uppgiftstyp (6 specialiteter: code/research/analysis/writing/data/general, kontextmedvetna med dependency-resultat)
- [x] Critic Agent — adversarial reasoning, utmanar antaganden (poängsätter 0-10, approve/revise/reject, identifierar issues per severity/category)
- [x] Validator Agent — deterministiska hooks + LLM-validering, blockerar om tester misslyckas (4 deterministiska checks + LLM-baserade relevance/correctness checks)
- [x] Orchestrator med state machine för arbetsflödeskoordinering (9 states: idle→planning→plan_review→executing→criticizing→validating→completed/failed/blocked, revision-loops, max 3 revisioner)
- Implementation: `bridge/src/hierarchy.ts` (550+ rader), 6 API-endpoints, `web/src/components/HierarchyView.tsx` med realtids-UI, Socket.IO events

#### Q. Spaced Repetition & Curriculum Optimization ✅
- [x] Ebbinghaus-driven schemaläggning — återbesök misslyckade uppgifter med ökande intervall (`spaced_repetition.py`)
- [x] Prioritera uppgifter i "inlärningszonen" (30-70% lösningsgrad)
- [x] Adaptiv repetitionsfrekvens baserat på SM-2 easiness factor + retention strength

#### R. Hierarkisk HDC (Sub-koncept)
- [ ] Sub-koncept: "sorting" → "bubble_sort", "merge_sort", "insertion_sort"
- [ ] Koncepthierarki med similarity threshold decay
- [ ] Transfer learning mellan liknande koncept

#### S. Specialiserade Prompt-mallar (API-design & Software Engineering)
- [ ] REST-konventioner, statuskoder, CRUD-mönster som System 0-mallar
- [ ] Kategori-specifika timeout-gränser (längre för api_design)
- [ ] Deterministiska mönster för vanliga uppgiftstyper direkt i System 0

### ⚡ Implementerbart — Medium prioritet

#### T. Deterministiska Hooks & Exit-blocking
- [ ] Hooks som lyssnar på redigeringsverktyg
- [ ] Blockera avslutning av uppgifter om tester misslyckas
- [ ] Dual-state arkitektur: persistent (workflow) + efemärt (runtime-reparation)

#### U. Lokal LLM-fallback (Ollama-integration i Frankenstein)
- [ ] AIF väljer LLM: Gemini vs Grok vs Ollama (lokal)
- [ ] Kostnads-medveten routing (billigare/snabbare modell för enkla uppgifter)
- [ ] Automatisk fallback-kedja vid API-fel eller rate limits

#### V. MCP-verktygsintegration i Frankenstein
- [ ] Frankenstein använder MCP-protokollet för verktygsanvändning
- [ ] Standardiserade tool-calls istället för custom HTTP
- [ ] Eliminera integrationsskuld med universella protokoll

#### W. Förbättrad Perception (Sentence Embeddings)
- [ ] Sentence embeddings istället för keyword-boosting
- [ ] Kontextuella features (svårighetsgrad, uppgiftstyp, kodlängd)
- [ ] Temporal features (tid på dygnet, session-position)

### 📊 Nuvarande Prestanda vs Mål (från PDF)

| Metrik | Aktuellt | Mål för Omnipotens |
|---|---|---|
| Totalt antal försök | 20 489 | > 1 000 000 |
| Övergripande lösningsgrad | 91,8% | 99,99% |
| System 0 utnyttjande | 83,6% | > 95% |
| System 2 utnyttjande | 15,2% | < 2% |
| LLM Success Rate | 57% | 95% (via lokala modeller) |
| Rate Limit Hits (S2) | 27/72 | 0 |
| Genomsnittlig svarstid | 401 ms | < 100 ms |

---

## Alla filer i projektet

### Bridge (Backend)

| Fil | Beskrivning |
|---|---|
| `bridge/src/index.ts` | Huvudserver (Express + Socket.IO + 80+ routes) |
| `bridge/src/agent.ts` | Claude AI-agent med 40+ verktyg |
| `bridge/src/agent-gemini.ts` | Gemini AI-agent |
| `bridge/src/agent-ollama.ts` | Ollama lokal LLM-agent |
| `bridge/src/llm-orchestrator.ts` | Multi-LLM coordinator med consensus |
| `bridge/src/bot-network.ts` | Autonomt AI bot-nätverk |
| `bridge/src/shared-memory.ts` | Delat minne för AI-samarbete |
| `bridge/src/self-improve.ts` | Reflexion, skills, self-evaluation |
| `bridge/src/workflows.ts` | Automation workflow engine |
| `bridge/src/agent-chains.ts` | AI Agent Chains — DAG-baserad kedjeexekvering med villkor, loopar, retry |
| `bridge/src/scheduler.ts` | Cron-baserad task scheduler |
| `bridge/src/computer-registry.ts` | Remote dator-hantering |
| `bridge/src/computer-agent.ts` | Remote agent (körs på varje PC) |
| `bridge/src/dashboard.ts` | Realtids-metrics |
| `bridge/src/rag.ts` | RAG knowledge base |
| `bridge/src/memory.ts` | Persistenta AI-minnen |
| `bridge/src/search.ts` | Konversationssök och export |
| `bridge/src/security.ts` | Säkerhetskonfig och audit |
| `bridge/src/projects.ts` | Projekthantering |
| `bridge/src/file-sharing.ts` | Fildelning |
| `bridge/src/clipboard.ts` | Clipboard-synk |
| `bridge/src/plugin-loader.ts` | Dynamiskt plugin-system |
| `bridge/src/tools-web.ts` | Web-verktyg (sök, fetch, download) |
| `bridge/src/tools-desktop.ts` | Desktop-verktyg (screenshot, klick, tangentbord) |
| `bridge/src/tools-filesystem.ts` | Filsystem-verktyg |
| `bridge/src/tools-commands.ts` | Kommando-verktyg |
| `bridge/src/tools-process.ts` | Process-verktyg |
| `bridge/src/tools-computers.ts` | Multi-dator verktyg |
| `bridge/src/api-cascade.ts` | Cascade MCP API routes |
| `bridge/src/system-context.ts` | System-kontext för AI |
| `bridge/plugins/example-plugin.ts` | Exempelplugin |

### Web (Frontend)

| Fil | Beskrivning |
|---|---|
| `web/src/App.tsx` | Huvudapp (2200+ rader, alla tabs) |
| `web/src/config.ts` | Delad BRIDGE_URL-konfiguration |
| `web/src/components/DashboardView.tsx` | Dashboard med gauges, sparklines |
| `web/src/components/ComputersView.tsx` | Remote dator-hantering |
| `web/src/components/SchedulerView.tsx` | Schemalagda uppgifter |
| `web/src/components/FilesView.tsx` | Fildelning |
| `web/src/components/SearchView.tsx` | Konversationssök |
| `web/src/components/ProjectsView.tsx` | Projekthantering |
| `web/src/components/ClipboardView.tsx` | Clipboard-synk |
| `web/src/components/PluginsView.tsx` | Plugin-hantering |
| `web/src/components/ToolsView.tsx` | Verktyg och snabbkommandon |
| `web/src/components/SettingsView.tsx` | Inställningar (rules, memories, RAG, security) |
| `web/src/components/WorkflowsView.tsx` | Workflow-builder |
| `web/src/components/AgentChainsView.tsx` | AI Agent Chains — visuell drag-and-drop kedjebyggare |
| `web/src/components/NetworkView.tsx` | Bot-nätverk visualisering |
| `web/src/components/SelfImproveView.tsx` | Self-improvement dashboard |
| `web/src/components/InstallView.tsx` | Installationsguide |
| `web/src/components/ConversationSidebar.tsx` | Konversationshistorik sidebar |
| `web/src/components/VoiceButton.tsx` | Röstinput/output |

### Frankenstein AI (Python)

| Fil | Beskrivning |
|---|---|
| `frankenstein-ai/code_agent.py` | FrankensteinCodeAgent — full stack-integration (HDC+AIF+Ebbinghaus+Gut+Emotions) |
| `frankenstein-ai/cognition.py` | NeuroSymbolicBridge — HDC projektion, bundling, klassificering (4096D) |
| `frankenstein-ai/agency.py` | ActiveInferenceAgent — pymdp, EFE-minimering, strategival |
| `frankenstein-ai/memory.py` | EbbinghausMemory — ChromaDB + glömskekurva + ShortTermBuffer |
| `frankenstein-ai/perception.py` | LiquidPerceptionUnit — feature extraction |
| `frankenstein-ai/gut_feeling.py` | GutFeelingEngine — sub-symbolisk intuition (Damasios Somatic Markers) |
| `frankenstein-ai/emotions.py` | EkmanEmotionEngine — 6 grundemotioner som påverkar beteende |
| `frankenstein-ai/circadian.py` | CircadianClock + SleepArchitecture + DreamEngine |
| `frankenstein-ai/promotion_pipeline.py` | S2→S1→S0 Promotion Pipeline med loggning |
| `frankenstein-ai/chaos_monkey.py` | Självkorrigeringsträning via bugg-injektion |
| `frankenstein-ai/frankenstein_swarm.py` | Multi-agent swarm med Mycelium-protokoll |
| `frankenstein-ai/spaced_repetition.py` | SpacedRepetitionScheduler — SM-2 baserad schemaläggning av svaga kategorier |
| `frankenstein-ai/ablation_runner.py` | Ablationsstudier — systematisk komponentanalys |
| `frankenstein-ai/ab_test.py` | A/B-test: Frankenstein vs ren LLM |
| `frankenstein-ai/battle_arena.py` | Live-tävling med realtids-events till bridge |
| `frankenstein-ai/continuous_train.py` | Huvudträningsloop |
| `frankenstein-ai/task_generator.py` | Uppgiftsgenerator (17+ typer, 8 svårighetsnivåer) |
| `frankenstein-ai/task_generator_v2.py` | V2-uppgifter (software engineering, API-design) |
| `frankenstein-ai/code_solver.py` | Deterministisk kodlösare (System 0) |
| `frankenstein-ai/curriculum.py` | Progressiv läroplan (5 nivåer × 6 uppgifter) |
| `frankenstein-ai/programming_env.py` | Sandbox-miljö för kodexekvering |
| `frankenstein-ai/terminal_tasks.py` | Terminal-baserade uppgifter |
| `frankenstein-ai/terminal_solver.py` | Terminal-uppgiftslösare |
| `frankenstein-ai/terminal_agent.py` | Terminal-agent |
| `frankenstein-ai/terminal_env.py` | Terminal-sandbox |

### MCP Server

| Fil | Beskrivning |
|---|---|
| `mcp-server/src/index.ts` | MCP server med 4 verktyg för Windsurf |
