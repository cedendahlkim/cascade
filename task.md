# Cascade Remote — Feature Roadmap & Status

## Status: ✅ Full-stack implementerat & deployat (2026-02-16)

> Backend + Frontend + Frankenstein AI + Deploy. 46 backend-moduler, 27 frontend-views, 80+ API-endpoints.
> Live på **https://app.gracestack.se/** — Docker + Nginx + SSL + Cloudflare Tunnel.
> Landningssida på **https://www.gracestack.se/** — Investor-fokuserad.

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

### 22. Deploy & Infrastruktur ✅

- [x] `Dockerfile` — Multi-stage Node 22 + Python 3 + git, bridge + web build
- [x] `docker-compose.yml` — Bridge-service med named volumes (`bridge-data`, `frank-training`)
- [x] `deploy/nginx-ssl.conf` — Nginx reverse proxy med SSL (Let's Encrypt)
- [x] `deploy/setup-server.sh` — Server setup-skript
- [x] Certbot auto-renewal
- [x] Live på `https://app.gracestack.se/` (89.167.57.244)

### 23. Autentisering (Supabase) ✅

- [x] `bridge/src/supabase.ts` — Supabase-klient
- [x] `bridge/src/auth-middleware.ts` — JWT-validering (soft middleware)
- [x] `bridge/src/auth-routes.ts` — Login/register/logout endpoints
- [x] `web/src/contexts/AuthContext.tsx` — React auth context
- [x] `web/src/components/LoginView.tsx` — Login/register UI
- [x] `web/src/lib/supabase.ts` — Frontend Supabase-klient

### 24. Adversarial Research Protocol ✅

- [x] Steel Man + Red Team faser i arena-sessioner
- [x] Random Seed bank (15 prompts) för att bryta groupthink
- [x] Surprise Score — kvantifierar nyhet, motsägelse, frågedensitet per meddelande
- [x] 4 forskningsprotokoll: Standard, Quick, Adversarial, Deepdive
- [x] `GET /api/arena/protocols` endpoint
- [x] Frontend: Protokollväljare + surprise score badge (färgkodad) i `ResearchLabView.tsx`

### 25. Frankenstein Terminal-Bench ✅

- [x] `terminal_env.py` — Sandboxad bash-miljö med blocked commands
- [x] `terminal_tasks.py` — 17 uppgiftsgeneratorer (fil, text, git, script, pipeline) nivå 1-10
- [x] `terminal_solver.py` — Deterministisk lösare för alla terminaluppgiftstyper
- [x] `terminal_agent.py` — Sekventiell agent med LLM-fallback och recovery
- [x] Git installerat i Docker-containern (git init, branch, merge, commit)
- [x] Terminal-batch var 5:e batch i träningsloopen

### 26. Frankenstein Persistent Memory ✅

- [x] Docker volume `frank-training` → `/app/frankenstein-ai/training_data/`
- [x] `memory.py` — ChromaDB PersistentClient + JSON-fallback (`ebbinghaus_memory.json`)
- [x] Automatisk sparning var 50:e store + vid garbage collect
- [x] Backup av 134MB träningsdata på host
- [x] Minne överlever container-restarts och rebuilds

### 27. Multi-user stöd ✅

- [x] Supabase-tabeller: `conversations`, `messages`, `workspace_shares` med RLS
- [x] `bridge/src/user-data.ts` — Per-user konversationer CRUD, meddelanden, workspace-delning (15 endpoints)
- [x] `bridge/src/auth-middleware.ts` — `requireAuth()`, `requireRole()`, `requireAdmin()` guards
- [x] `bridge/src/auth-routes.ts` — Admin-endpoints: lista/ändra roll/ta bort användare
- [x] `bridge/src/supabase.ts` — `listUsers()`, `updateUserRole()`, `deleteUser()`, `getUserCount()`
- [x] `web/src/contexts/AuthContext.tsx` — `role`, `isAdmin`, `isViewer` + `fetchRole()`
- [x] `web/src/components/AdminPanel.tsx` — Användarhantering med rollväljare (admin/user/viewer)
- [x] Admin-tab i SettingsView (bara synlig för admins)
- [x] Roller: admin (full åtkomst), user (chatta + dela), viewer (läs delade)

### 28. Landningssida (Investor) ✅

- [x] `landing/index.html` — Statisk landningssida för `www.gracestack.se`
- [x] Hero med live-stats, teknologi-sektion (6 kognitiva moduler)
- [x] Arkitektur (System 0/1/2), jämförelsetabell vs LLM:er
- [x] Plattform-features, tech stack, roadmap-timeline, team, CTA
- [x] Scroll-reveal animationer, animerade räknare, mobil hamburger-meny
- [x] SVG favicon, SEO meta-tags, Open Graph
- [x] Nginx multi-domain: `gracestack.se` → `www.gracestack.se` → landing, `app.gracestack.se` → app

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

#### B. Multi-user stöd ✅
- [x] Autentisering (Supabase JWT — se §23)
- [x] Separata sessioner per användare (Supabase `conversations` + `messages` tabeller med RLS, `user-data.ts`)
- [x] Roller: admin, user, viewer (`profiles.role` check constraint, `requireRole()` middleware, `AdminPanel.tsx`)
- [x] Delad workspace med permissions (`workspace_shares` tabell, read/write/admin, share via email)

#### C. Push-notifikationer
- [ ] Web Push API (VAPID keys) — notiser även när appen är stängd
- [ ] Konfigurerbart: vilka events triggar push
- [ ] Webhook-registrering för externa integrationer

#### D. Förbättrad Arena ✅
- [x] Fler AI-deltagare — Ollama (lokal LLM) tillagd som 5:e deltagare med "Lokal Expert / Djävulens advokat"-roll
- [x] Röstning/ranking av AI-svar — 👍/👎 per meddelande, ranking-API (`/api/arena/ranking`)
- [x] Automatisk sammanfattning av forskningssessioner (fanns redan)
- [x] Export av Arena-resultat till Markdown — `/api/arena/export` + Export-knapp i UI
- [x] Steel Man + Red Team faser (se §24)
- [x] Random Seed bank + Surprise Score
- [x] 4 protokolllägen: Standard, Quick, Adversarial, Deepdive

### ⚡ Medium prioritet

#### E. Skärmdelning / Live-view
- [ ] MJPEG/WebRTC-stream av skärmen till mobilen
- [ ] Klickbar overlay — styr datorn från mobilen
- [ ] Annoterings-verktyg (rita på skärmen)

#### F. Git-integration ✅
- [x] Visa git status, diff, log i frontend (`GitView.tsx` — 3 sub-tabs: Status, Historik, Branches)
- [x] AI-genererade commit messages (Claude/Gemini via `POST /api/git/ai-commit-message`)
- [x] Branch-hantering: checkout, push, pull, stash
- [x] Stage/unstage/discard filer, inline diff-vy
- [x] Backend: `git-routes.ts` — 14 endpoints (status, diff, log, branches, stage, unstage, commit, push, pull, checkout, discard, stash, ai-commit-message)

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

#### J2. Conversation Analytics ✅
- [x] Token usage trends per modell (hourly/daily/weekly buckets, persisterade till disk)
- [x] Kostnadsprognos med linjär regression (dagligt snitt, projicerat vecka/månad, trend %)
- [x] Aktivitets-heatmap (timme × veckodag, anrop/tokens/kostnad)
- [x] Sessionsstatistik (snitt längd, meddelanden per session, mest aktiv timme)
- [x] Modelljämförelse (6 modeller: claude/gemini/deepseek/grok/ollama/frankenstein)
- [x] CSV-export av all analytikdata
- [x] 8 API-endpoints (`/api/analytics/*`)
- [x] Frontend: `AnalyticsView.tsx` med KPI-kort, stapeldiagram, heatmap, tabeller
- Implementation: `bridge/src/conversation-analytics.ts` (450+ rader), `web/src/components/AnalyticsView.tsx`

#### J3. Prompt Lab ✅
- [x] A/B-testa prompt-varianter mot flera LLM:er samtidigt
- [x] Skapa experiment med 2+ varianter, olika system prompts och temperatur
- [x] Kör mot 1-5 modeller (gemini/claude/deepseek/grok/ollama)
- [x] AI-domare (Gemini) poängsätter 0-100 varje svar
- [x] Manuell 1-5 betygsättning per svar
- [x] Automatisk vinnarval (AI score → kvalitet → latens)
- [x] Statistikjämförelse per variant och modell
- [x] 6 API-endpoints (`/api/prompt-lab/*`)
- [x] Frontend: `PromptLabView.tsx` med experiment-lista, skapningsmodal, resultatjämförelse
- Implementation: `bridge/src/prompt-lab.ts` (400+ rader), `web/src/components/PromptLabView.tsx`

#### J4. Vision & Multimodal ✅
- [x] Bildanalys via Gemini Vision och Claude Vision (base64-encoded)
- [x] 5 analyslägen: Beskriv, OCR, Analysera, Jämför, Custom fråga
- [x] Drag-and-drop, filväljare, clipboard paste (Ctrl+V)
- [x] Multi-bild jämförelse
- [x] Tagg-extraktion och OCR-textutdrag
- [x] 2 API-endpoints (`/api/vision/*`)
- [x] Frontend: `VisionView.tsx` med dropzone, bildförhandsgranskning, resultatvy
- Implementation: `bridge/src/vision.ts` (250+ rader), `web/src/components/VisionView.tsx`

#### J5. Snapshot & Rollback ✅
- [x] Skapa namngivna snapshots av AI-tillstånd (minnen, konversationer, settings)
- [x] Återställ till valfri snapshot (auto-sparar nuvarande tillstånd först)
- [x] Diff mellan snapshots (filjämförelse: added/removed/modified/unchanged)
- [x] Auto-prune (behåll max 50 snapshots)
- [x] Tagg-system för att kategorisera snapshots
- [x] Stats: total storlek, antal, äldsta/nyaste
- [x] 8 API-endpoints (`/api/snapshots/*`)
- [x] Frontend: `SnapshotsView.tsx` med snapshot-lista, skapa-form, diff-verktyg, stats
- Implementation: `bridge/src/snapshots.ts` (250+ rader), `web/src/components/SnapshotsView.tsx`

#### J6. Webhook & API Gateway ✅
- [x] Skapa webhook-endpoints med egna URL-paths
- [x] Mappa webhooks till valfri AI-modell (claude/gemini/deepseek/grok/ollama)
- [x] API-nyckelautentisering per webhook (`gsk_` prefix)
- [x] Rate limiting per webhook (konfigurerbart max/min)
- [x] Request/response-loggning med historik
- [x] 4 mallar: Custom, Slack, Discord, GitHub
- [x] 3 svarsformat: JSON, text, markdown
- [x] Curl-exempel direkt i UI
- [x] 7+ API-endpoints (`/api/webhooks/*`)
- [x] Frontend: `WebhooksView.tsx` med webhook-lista, skapningsform, loggar, API-nyckelhantering
- Implementation: `bridge/src/webhooks.ts` (300+ rader), `web/src/components/WebhooksView.tsx`

### 🔮 Lägre prioritet / Experimentellt

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

### 📊 Nuvarande Prestanda vs Mål (uppdaterad 2026-02-16)

| Metrik | Aktuellt | Mål för Omnipotens |
|---|---|---|
| Totalt antal försök | 31 549 | > 1 000 000 |
| Övergripande lösningsgrad | 99% | 99,99% |
| Alla 10 nivåer | 100% | 100% ✅ |
| Skills inlärda | 127 | > 500 |
| Superhuman benchmark | 21/21 (100%) | 100% ✅ |
| System 0 utnyttjande | ~95% | > 95% ✅ |
| Terminal/Git solve rate | 100% | 100% ✅ |
| Genomsnittlig svarstid | ~270 ms | < 100 ms |
| Ebbinghaus minnen | 4 800+ | Persistent ✅ |
| Träningsdata | 134 MB | Persistent ✅ |

---

## Alla filer i projektet

### Bridge (Backend — 51 filer)

| Fil | Beskrivning |
|---|---|
| `bridge/src/index.ts` | Huvudserver (Express + Socket.IO + 80+ routes) |
| `bridge/src/agent.ts` | Claude AI-agent med 40+ verktyg |
| `bridge/src/agent-gemini.ts` | Gemini AI-agent |
| `bridge/src/agent-deepseek.ts` | DeepSeek AI-agent |
| `bridge/src/agent-frankenstein.ts` | Frankenstein AI bridge-integration |
| `bridge/src/agent-grok.ts` | Grok (xAI) AI-agent |
| `bridge/src/agent-ollama.ts` | Ollama lokal LLM-agent |
| `bridge/src/agent-chains.ts` | AI Agent Chains — DAG-baserad kedjeexekvering |
| `bridge/src/auth-middleware.ts` | JWT-validering + role guards (requireAuth/requireRole/requireAdmin) |
| `bridge/src/auth-routes.ts` | Login/register/logout + admin endpoints (list/update/delete users) |
| `bridge/src/bot-network.ts` | Autonomt AI bot-nätverk |
| `bridge/src/cascade-client.ts` | Cascade MCP-klient |
| `bridge/src/clipboard.ts` | Clipboard-synk |
| `bridge/src/computer-agent.ts` | Remote agent (körs på varje PC) |
| `bridge/src/computer-registry.ts` | Remote dator-hantering |
| `bridge/src/dashboard.ts` | Realtids-metrics |
| `bridge/src/file-sharing.ts` | Fildelning |
| `bridge/src/frank-learning.ts` | Frankenstein learning bridge |
| `bridge/src/hierarchy.ts` | Hierarkisk agent-koordinering (Planner/Executor/Critic/Validator) |
| `bridge/src/llm-orchestrator.ts` | Multi-LLM coordinator med consensus |
| `bridge/src/memory.ts` | Persistenta AI-minnen |
| `bridge/src/plugin-loader.ts` | Dynamiskt plugin-system |
| `bridge/src/plugin-marketplace.ts` | Plugin marketplace med sökbar katalog |
| `bridge/src/projects.ts` | Projekthantering |
| `bridge/src/rag.ts` | RAG knowledge base |
| `bridge/src/rag-weaviate.ts` | Weaviate vektor-DB integration |
| `bridge/src/sandbox.ts` | Kod-sandbox för säker exekvering |
| `bridge/src/scheduler.ts` | Cron-baserad task scheduler |
| `bridge/src/search.ts` | Konversationssök och export |
| `bridge/src/security.ts` | Säkerhetskonfig och audit |
| `bridge/src/self-improve.ts` | Reflexion, skills, self-evaluation |
| `bridge/src/shared-memory.ts` | Delat minne för AI-samarbete |
| `bridge/src/supabase.ts` | Supabase-klient |
| `bridge/src/swarm.ts` | Frankenstein swarm-integration |
| `bridge/src/system-context.ts` | System-kontext för AI |
| `bridge/src/tools-commands.ts` | Kommando-verktyg |
| `bridge/src/tools-computers.ts` | Multi-dator verktyg |
| `bridge/src/tools-desktop.ts` | Desktop-verktyg (screenshot, klick, tangentbord) |
| `bridge/src/tools-filesystem.ts` | Filsystem-verktyg |
| `bridge/src/tools-process.ts` | Process-verktyg |
| `bridge/src/workflows.ts` | Automation workflow engine |
| `bridge/src/user-data.ts` | Per-user konversationer, meddelanden, workspace-delning (15 endpoints) |
| `bridge/src/git-routes.ts` | Git-integration: status, diff, log, branches, commit, push, AI commit msg (14 endpoints) |
| `bridge/src/api-cascade.ts` | Cascade MCP API routes |
| `bridge/src/conversation-analytics.ts` | Conversation Analytics — token trends, heatmap, kostnadsprognos, sessions |
| `bridge/src/prompt-lab.ts` | Prompt Lab — A/B-testning av prompts mot flera LLM:er |
| `bridge/src/vision.ts` | Vision & Multimodal — bildanalys via Gemini/Claude Vision |
| `bridge/src/snapshots.ts` | Snapshot & Rollback — version control för AI-tillstånd |
| `bridge/src/webhooks.ts` | Webhook & API Gateway — exponera AI som webhook-endpoints |
| `bridge/plugins/` | 20 community-plugins (math, crypto, network, etc.) |

### Web (Frontend — 32 views + lib)

| Fil | Beskrivning |
|---|---|
| `web/src/App.tsx` | Huvudapp (2200+ rader, alla tabs) |
| `web/src/main.tsx` | Entry point |
| `web/src/config.ts` | Delad BRIDGE_URL-konfiguration |
| `web/src/index.css` | Global CSS (Tailwind) |
| `web/src/components/AgentChainsView.tsx` | AI Agent Chains — visuell drag-and-drop kedjebyggare |
| `web/src/components/BattleArenaView.tsx` | Frankenstein Battle Arena |
| `web/src/components/ClipboardView.tsx` | Clipboard-synk |
| `web/src/components/ComputersView.tsx` | Remote dator-hantering |
| `web/src/components/ConversationSidebar.tsx` | Konversationshistorik sidebar |
| `web/src/components/DashboardView.tsx` | Dashboard med gauges, sparklines |
| `web/src/components/FilesView.tsx` | Fildelning |
| `web/src/components/FlipperZeroView.tsx` | Flipper Zero BLE-integration |
| `web/src/components/FrankensteinChatView.tsx` | Frankenstein AI chatt |
| `web/src/components/FrankensteinView.tsx` | Frankenstein AI träning & stats |
| `web/src/components/HierarchyView.tsx` | Hierarkisk agent-koordinering |
| `web/src/components/InstallView.tsx` | Installationsguide |
| `web/src/components/LoginView.tsx` | Login/register (Supabase) |
| `web/src/components/NetworkView.tsx` | Bot-nätverk visualisering |
| `web/src/components/PluginsView.tsx` | Plugin-hantering |
| `web/src/components/ProjectsView.tsx` | Projekthantering |
| `web/src/components/ResearchLabView.tsx` | AI Research Lab med protokollväljare + surprise score |
| `web/src/components/SchedulerView.tsx` | Schemalagda uppgifter |
| `web/src/components/SearchView.tsx` | Konversationssök |
| `web/src/components/SelfImproveView.tsx` | Self-improvement dashboard |
| `web/src/components/AdminPanel.tsx` | Admin-panel: användarhantering, roller, ta bort |
| `web/src/components/GitView.tsx` | Git-integration: status, diff, log, branches, AI commit, stage/commit/push |
| `web/src/components/SettingsView.tsx` | Inställningar (rules, memories, RAG, security, admin) |
| `web/src/components/SwarmView.tsx` | Frankenstein Swarm visualisering |
| `web/src/components/ToolsView.tsx` | Verktyg och snabbkommandon |
| `web/src/components/VoiceButton.tsx` | Röstinput/output |
| `web/src/components/WorkflowsView.tsx` | Workflow-builder |
| `web/src/components/AnalyticsView.tsx` | Conversation Analytics — KPI-kort, heatmap, stapeldiagram |
| `web/src/components/PromptLabView.tsx` | Prompt Lab — experiment, varianter, AI-domare |
| `web/src/components/VisionView.tsx` | Vision & Multimodal — drag-and-drop bildanalys |
| `web/src/components/SnapshotsView.tsx` | Snapshot & Rollback — skapa, återställ, diff |
| `web/src/components/WebhooksView.tsx` | Webhooks & API Gateway — CRUD, loggar, curl-exempel |
| `web/src/contexts/AuthContext.tsx` | React auth context (Supabase) med role/isAdmin/isViewer |
| `web/src/hooks/useMobile.ts` | Haptic feedback + mobil-detection |
| `web/src/lib/api.ts` | API-klient |
| `web/src/lib/supabase.ts` | Supabase-klient |
| `web/src/lib/bleScanner.ts` | BLE scanner |
| `web/src/lib/flipperBle.ts` | Flipper Zero BLE-protokoll |

### Frankenstein AI (Python — 35 filer)

| Fil | Beskrivning |
|---|---|
| `frankenstein-ai/code_agent.py` | FrankensteinCodeAgent — full stack (HDC+AIF+Ebbinghaus+Gut+Emotions) |
| `frankenstein-ai/cognition.py` | NeuroSymbolicBridge — HDC projektion, bundling, klassificering (4096D) |
| `frankenstein-ai/agency.py` | ActiveInferenceAgent — pymdp, EFE-minimering, strategival |
| `frankenstein-ai/memory.py` | EbbinghausMemory — ChromaDB PersistentClient + JSON-fallback |
| `frankenstein-ai/perception.py` | LiquidPerceptionUnit — feature extraction |
| `frankenstein-ai/gut_feeling.py` | GutFeelingEngine — sub-symbolisk intuition (Damasios Somatic Markers) |
| `frankenstein-ai/emotions.py` | EkmanEmotionEngine — 6 grundemotioner som påverkar beteende |
| `frankenstein-ai/circadian.py` | CircadianClock + SleepArchitecture + DreamEngine |
| `frankenstein-ai/promotion_pipeline.py` | S2→S1→S0 Promotion Pipeline med loggning |
| `frankenstein-ai/chaos_monkey.py` | Självkorrigeringsträning via bugg-injektion |
| `frankenstein-ai/frankenstein_swarm.py` | Multi-agent swarm med Mycelium-protokoll |
| `frankenstein-ai/frankenstein_agent.py` | Frankenstein agent-wrapper |
| `frankenstein-ai/spaced_repetition.py` | SpacedRepetitionScheduler — SM-2 baserad |
| `frankenstein-ai/ablation_runner.py` | Ablationsstudier — systematisk komponentanalys |
| `frankenstein-ai/ab_test.py` | A/B-test: Frankenstein vs ren LLM |
| `frankenstein-ai/run_10_ab_tests.py` | Batch-körning av 10 A/B-tester |
| `frankenstein-ai/battle_arena.py` | Live-tävling med realtids-events till bridge |
| `frankenstein-ai/continuous_train.py` | Huvudträningsloop (circadian, terminal, spaced rep) |
| `frankenstein-ai/train.py` | Enkel träningsentry-point |
| `frankenstein-ai/task_generator.py` | Uppgiftsgenerator (17+ typer, 10 svårighetsnivåer) |
| `frankenstein-ai/task_generator_v2.py` | V2-uppgifter (software engineering, API-design) |
| `frankenstein-ai/task_generator_v3.py` | V3-uppgifter (avancerade) |
| `frankenstein-ai/code_solver.py` | Deterministisk kodlösare (System 0) |
| `frankenstein-ai/curriculum.py` | Progressiv läroplan (5 nivåer × 6 uppgifter) |
| `frankenstein-ai/programming_env.py` | Sandbox-miljö för kodexekvering |
| `frankenstein-ai/terminal_tasks.py` | Terminal-uppgifter (17 generatorer, nivå 1-10) |
| `frankenstein-ai/terminal_solver.py` | Deterministisk terminal-lösare |
| `frankenstein-ai/terminal_agent.py` | Terminal-agent med LLM-fallback |
| `frankenstein-ai/terminal_env.py` | Terminal-sandbox (bash) |
| `frankenstein-ai/reflection_loop.py` | Reflexionsloop för självförbättring |
| `frankenstein-ai/cross_domain_bridge.py` | Cross-domain kunskapsöverföring |
| `frankenstein-ai/symbolic_regression.py` | Symbolisk regression |
| `frankenstein-ai/comprehensive_benchmark.py` | Omfattande benchmark-svit |
| `frankenstein-ai/superhuman_benchmark.py` | Superhuman benchmark (21/21 ✅) |
| `frankenstein-ai/analyze_training.py` | Träningsdata-analysverktyg |

### Deploy & Infrastruktur

| Fil | Beskrivning |
|---|---|
| `Dockerfile` | Multi-stage: Node 22 + Python 3 + git → bridge + web build |
| `docker-compose.yml` | Bridge-service, named volumes (bridge-data, frank-training) |
| `deploy/nginx-ssl.conf` | Nginx multi-domain: landing + app + SSL (Let's Encrypt) |
| `deploy/nginx.conf` | Nginx base-konfiguration |
| `deploy/setup-server.sh` | Server provisioning-skript |
| `landing/index.html` | Investor-landningssida (www.gracestack.se) |

### MCP Server

| Fil | Beskrivning |
|---|---|
| `mcp-server/src/index.ts` | MCP server med 4 verktyg för Windsurf |
