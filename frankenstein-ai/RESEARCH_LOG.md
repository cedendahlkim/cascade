# Frankenstein AI — Forskningslogg

## Projektöversikt
**Organisation:** Gracestack AB  
**Mål:** Bygga en kontinuerligt lärande AI baserad på biologiskt inspirerade principer  
**Stack:** HDC + Active Inference + Ebbinghaus Memory + Gut Feeling + Ekman Emotions + Circadian System  

---

## Forskningsdokument (uppladdade PDF:er)

| # | Dokument | Sidor | Nyckelinnehåll |
|---|----------|-------|----------------|
| 1 | Bygga AI: Arkitektur, Hårdvara, Implementation | 12 | Fullständig konstruktionsguide för LNN+HDC+AIF |
| 2 | The Frankenstein Stack: Feasibility Analysis | 5 | Kritisk granskning — "research exploration project" |
| 3 | Lärande AI Utan Superdator | 11 | Edge-deployment, Online LoRA, Hebbian Fast Weights |
| 4 | Frankenstein AGI Forskningsprompt | 9 | NARS-integration, Jag-vektor, do-calculus, NAL 1-9 |
| 5 | Frankenstein AI Idéer | 11 | Dygnsrytm, sömnarkitektur, drömmar, trötthet |

---

## Implementerade moduler

### Fas 1: Grundstack (pre-research)
| Modul | Fil | Status |
|-------|-----|--------|
| HDC NeuroSymbolicBridge | `cognition.py` | ✅ Aktiv |
| Active Inference (AIF) | `agency.py` | ✅ Aktiv |
| Ebbinghaus Memory | `memory.py` | ✅ Aktiv |
| Gut Feeling Engine | `gut_feeling.py` | ✅ Aktiv |
| Ekman Emotion Engine | `emotions.py` | ✅ Aktiv |
| LLM Code Agent | `code_agent.py` | ✅ Aktiv |
| Continuous Training | `continuous_train.py` | ✅ Aktiv |

### Fas 2: Forskningsinspirerade uppgraderingar

#### v4 — Felanalys & LLM-optimering (2026-02-11)
| Ändring | Fil | Effekt |
|---------|-----|--------|
| LLM throttling 1.5s → 3.0s | `code_agent.py` | Rate limits minskade |
| Fas 1 historik-metadata | `continuous_train.py` | Komplett data för analys |
| Feedback i Fas 2 historik | `continuous_train.py` | Bättre felsökning |
| Knapsack/Edit Distance prompt hints | `code_agent.py` | dp_advanced förbättrad |
| HDC threshold 0.45 → 0.30 | `cognition.py` | Fler koncept skapas |

#### v5 — AGI Research Implementation (2026-02-12)
| Ändring | Fil | Inspirerad av | Effekt |
|---------|-----|---------------|--------|
| **Dual-process System 1/2** | `code_agent.py` | Kahneman + Idédokument | Skippar LLM vid hög konfidens → 0ms per uppgift |
| **NARS-budget i Ebbinghaus** | `code_agent.py` | AGI Forskningsprompt | strength = base × priority × quality × durability |
| **Cyklisk svårighetsvariation** | `continuous_train.py` | Egen observation | Var 3:e batch viktat random, favoriserar svaga nivåer |

#### v6 — Circadian System (2026-02-12)
| Ändring | Fil | Inspirerad av | Effekt |
|---------|-----|---------------|--------|
| **CircadianClock** | `circadian.py` | Idédokument: dygnsrytm | 8 faser, 30 batchar/dag, påverkar svårighet |
| **SleepEngine** | `circadian.py` | Idédokument: sömnarkitektur | NREM konsolidering + REM drömmar (HDC-bindning) |
| **FatigueSystem** | `circadian.py` | Idédokument: trötthet | Ackumuleras under dagen, nollställs vid sömn |
| **Circadian → difficulty** | `continuous_train.py` | Idédokument: kognitiva profiler | morning_peak → +2 svårighet, afternoon_dip → -2 |
| **Sömnfas i träningsloop** | `continuous_train.py` | Idédokument: NREM/REM | Konsolidering + drömmar istället för nya uppgifter |
| **Circadian historik-data** | `continuous_train.py` | Forskningsbehov | phase, day, fatigue loggas per uppgift |

---

## Datainsamling

### Mätpunkter per uppgift (i `progress.json → history[]`)
```
task_id, score, difficulty, category, timestamp, time_ms, attempts,
first_try, strategy, feedback, hdc_concept, hdc_new, gut_valence,
gut_rec, circadian_phase, circadian_day, fatigue
```

### Aggregerad data (i `progress.json`)
- `level_stats`: Attempted/solved per nivå 1-10
- `category_stats`: Attempted/solved/first_try/time per kategori
- `stack`: HDC concepts, AIF exploration, memory stats, strategy stats
- `circadian`: Day number, phase, fatigue, analytical, creativity, phase_stats
- `sleep_stats`: Total nights, consolidated, dreams, insights
- `trends`: Rolling solve rates (10/50/100)

### Circadian-specifik data (i `circadian_state.json`)
- `batch_in_day`: Position i dygnet
- `day_number`: Vilken dag
- `fatigue`: Trötthetsnivå
- `phase_stats`: Per fas: batches, tasks, solved, total_time_ms

---

## Forskningsfrågor att besvara

### 1. Circadian påverkan på prestanda
**Hypotes:** Morning peak ger högre solve rate på svåra uppgifter, afternoon dip ger lägre.  
**Mätning:** Jämför solve rate per `circadian_phase` och `difficulty`.  
**Data:** `progress.json → history[].circadian_phase` + `score` + `difficulty`

### 2. Sömnens effekt på minnesretention
**Hypotes:** Sömncykler förstärker viktiga minnen och rensar oviktiga → bättre recall.  
**Mätning:** Jämför memory_active count före/efter sömn, och solve rate dag N vs dag N+1.  
**Data:** `sleep_stats.total_consolidated` + `circadian.phase_stats`

### 3. System 1 bypass-effektivitet
**Hypotes:** Dual-process sparar LLM-anrop utan att minska solve rate.  
**Mätning:** Andel `system1_memory` i strategy_stats, dess success rate.  
**Data:** `stack.strategy_stats.system1_memory`

### 4. NARS-budget vs enkel Ebbinghaus
**Hypotes:** Sällsynta kategorier behåller minnen längre → bättre solve rate på ovanliga uppgifter.  
**Mätning:** Jämför solve rate för kategorier med < 20 attempts före/efter NARS-budget.  
**Data:** `category_stats` + `memory_active`

### 5. Trötthet och kreativitet
**Hypotes:** Hög fatigue → fler fel MEN mer kreativa lösningar (nya strategier).  
**Mätning:** Korrelera `fatigue` med `strategy` diversity och `hdc_new`.  
**Data:** `history[].fatigue` + `strategy` + `hdc_new`

### 6. Drömmar och insikter
**Hypotes:** REM-drömmar (HDC-vektorbindning) hittar oväntade mönster.  
**Mätning:** Antal insikter per natt, korrelation med nästa dags prestanda.  
**Data:** `sleep_stats.total_insights` + dag-för-dag solve rate

---

## Baseline-mätningar

| Mätpunkt | Värde | Datum |
|----------|-------|-------|
| Total lösta vid v6-start | ~11 100 | 2026-02-12 |
| Solve rate (senaste 100) | 94% | 2026-02-12 |
| HDC koncept | 2 | 2026-02-12 |
| Ebbinghaus minnen | ~300 | 2026-02-12 |
| System 1 bypass | 0 (nytt) | 2026-02-12 |
| Circadian dag | 1 (nytt) | 2026-02-12 |
| Drömmar | 0 (nytt) | 2026-02-12 |

---

## Utvärderingsplan

| Checkpoint | Uppgifter | Fokus |
|------------|-----------|-------|
| v6 + 500 | ~11 600 | Circadian fungerar? Sömnfas kör? |
| v6 + 1000 | ~12 100 | Fas-specifik solve rate, System 1 usage |
| v6 + 3000 | ~14 100 | Dag-för-dag trend, dröminsikter |
| v6 + 10000 | ~21 100 | Fullständig circadian-analys |

---

## Framtida implementeringar (backlog)

| Idé | Källa | Prioritet | Status |
|-----|-------|-----------|--------|
| Jag-vektor (V_ego) | AGI Forskningsprompt | Medium | Planerad |
| NARS NAL 1-9 i HDC | AGI Forskningsprompt | Låg | Forskningsfas |
| Kausal förståelse (do-calculus) | AGI Forskningsprompt | Låg | Forskningsfas |
| Kronotyp (emergent lärka/uggla) | Idédokument | Låg | Väntar på data |
| Melatonin-analog | Idédokument | Låg | Väntar på circadian-data |
| Drömlogg (naturligt språk) | Idédokument | Medium | Delvis implementerad |
| Online LoRA | Lärande AI doc | Låg | Alternativ approach |
| Hebbian Fast Weights | Lärande AI doc | Låg | Forskningsfas |
