# 🧟 Frankenstein AI — Forskningsdokumentation

**Projekt:** Flytande Intelligens med Hyperdimensionell Kognition och Aktiv Inferens
**Forskare:** Kim Cedendahl
**Start:** Februari 2026
**Status:** Aktiv prototyp, träningsfas

---

## 1. Bakgrund & Motivation

### Problemställning

Nuvarande AI-system (LLM:er som GPT, Gemini, Claude) har fundamentala begränsningar:

- **Ingen one-shot learning** — kräver massiv träningsdata
- **Inget adaptivt beslutsfattande** — kan inte balansera exploration/exploitation
- **Inget biologiskt minne** — ingen naturlig glömska eller konsolidering
- **Ingen mönsterigenkänning utan backprop** — allt kräver gradient descent

### Hypotes

Genom att kombinera tre bio-inspirerade teknologier kan vi bygga en meta-lärande agent som:

1. Lär sig mönster med ett enda exempel (HDC)
2. Fattar beslut genom att minimera överraskning (Active Inference)
3. Konsoliderar kunskap med biologisk glömskekurva (Ebbinghaus)

**Nyckelinsikt:** Systemet lär sig inte *svaren* — det lär sig *hur man tänker om problem*.

---

## 2. Teoretisk Grund

### 2.1 Hyperdimensional Computing (HDC)

**Källa:** Kanerva (2009), "Hyperdimensional Computing: An Introduction to Computing in Distributed Representation with High-Dimensional Random Vectors"

- Representerar koncept som hypervektorer i ~4096 dimensioner
- Operationer: bundling (addition), binding (multiplikation), permutation
- **One-shot learning**: Ett enda exempel räcker för att lära ett nytt koncept
- **Brustolerant**: Upp till 30% av vektorn kan korrumperas utan informationsförlust
- Kosinuslikhet för mönstermatchning

**Vår implementation:** `cognition.py` — `NeuroSymbolicBridge`
- Random projection från feature-space (64D) till hyperspace (4096D)
- Konceptbibliotek med prototyp-hypervektorer
- Similarity threshold: 0.3 (lägre = fler nya koncept)

### 2.2 Active Inference (AIF)

**Källa:** Friston (2010), "The free-energy principle: a unified brain theory?"

- Agenten har en *generativ modell* av världen (A, B, C, D-matriser)
- Beslutsfattande genom att minimera **Expected Free Energy (EFE)**
- EFE = pragmatiskt värde (exploitation) + epistemiskt värde (exploration)
- Naturlig balans: utforskar när osäker, utnyttjar när säker

**Vår implementation:** `agency.py` — `ActiveInferenceAgent`
- 8 observationstyper: solved_first, solved_retry, failed_logic, failed_syntax, failed_timeout, partial_solve, new_pattern, known_pattern
- 12 dolda tillstånd
- 4 handlingar (strategier): direct, with_hints, from_memory, step_by_step
- Exploration weight: startar 0.6, sjunker mot 0.15 vid framgång

### 2.3 Ebbinghaus Minnesmodell

**Källa:** Ebbinghaus (1885), "Über das Gedächtnis"

- Minnen har en *retention strength* som avtar exponentiellt: R = e^(-t/S)
- Varje recall förstärker minnet (ökar S)
- Svaga minnen glöms bort (garbage collection vid R < 0.05)
- Starka, ofta använda minnen blir permanenta

**Vår implementation:** `memory.py` — `EbbinghausMemory`
- ChromaDB-backend för persistent vektorlagring
- Metadata: retention, recall_count, last_recall, creation_time
- ShortTermBuffer (FIFO, 50 items) för omedelbar kontext

---

## 3. Systemarkitektur

```
┌─────────────────────────────────────────────────────────┐
│                    FRANKENSTEIN STACK                     │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │PERCEPTION│──▶│ KOGNITION│──▶│AGENTSKAP │            │
│  │(Features)│   │  (HDC)   │   │  (AIF)   │            │
│  └──────────┘   └──────────┘   └──────────┘            │
│       │              │              │                    │
│       │         ┌────▼────┐    ┌────▼────┐              │
│       │         │ Koncept │    │Strategi │              │
│       │         │Bibliotek│    │  Val    │              │
│       │         └─────────┘    └────┬────┘              │
│       │                             │                    │
│       │    ┌────────────────────────▼──────┐            │
│       │    │         LLM (Gemini)          │            │
│       │    │    Kodgenerering med vald     │            │
│       │    │    strategi och kontext       │            │
│       │    └────────────┬─────────────────┘            │
│       │                 │                               │
│       │    ┌────────────▼─────────────────┐            │
│       │    │       UTVÄRDERING            │            │
│       │    │  Kör kod mot testfall        │            │
│       │    └────────────┬─────────────────┘            │
│       │                 │                               │
│  ┌────▼─────────────────▼─────────────────┐            │
│  │            MINNE (Ebbinghaus)           │            │
│  │  Lagra lösning → Förstärk/Glöm         │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Dataflöde per uppgift

1. **Perception**: Uppgiftstext → 64D feature-vektor (keyword-boosting, TF-IDF-liknande)
2. **Kognition**: Feature → 4096D hypervektor → Kosinusmatchning mot konceptbibliotek
3. **Agentskap**: Observation (ny/känd/misslyckad) → AIF → Strategi (direct/hints/memory/step)
4. **Generering**: Strategi + uppgift + ev. minnen → LLM-prompt → Kod
5. **Utvärdering**: Kod körs i sandbox mot testfall → Score (0.0–1.0)
6. **Inlärning**: HDC lär mönster, AIF uppdaterar preferenser, Ebbinghaus lagrar/förstärker

---

## 4. Träningsdomän: Kodgenerering

### Varför kodgenerering?

- **Objektivt mätbart**: Testfall ger exakt score (0% eller 100%)
- **Skalbar svårighet**: 8 nivåer från aritmetik till dynamisk programmering
- **Rik mönsterrymd**: 17+ uppgiftstyper med parametrisk variation
- **Snabb feedback-loop**: Sekunder per uppgift, inte timmar

### Svårighetsnivåer

| Nivå | Domän | Uppgiftstyper | Exempel |
|------|-------|---------------|---------|
| 1 | Aritmetik | Grundläggande I/O, beräkningar | Summa, area, temperatur |
| 2 | Kontrollflöde | Villkor, loopar, mönster | FizzBuzz, trianglar, nedräkning |
| 3 | Strängar & Listor | Manipulation, talteori | Palindrom, vokaler, fakultet |
| 4 | Algoritmer | Dict, rekursion, matriser | Primtal, binärsökning, ordfrekvens |
| 5 | Sortering & Strängar | Sorteringsalgoritmer, chiffer | Bubble sort, Caesar, anagram |
| 6 | Datastrukturer | Stack, kö, länkad lista | Balanserade parenteser, min-stack |
| 7 | Funktionell & Grafer | Map/filter, BFS/DFS | Flatten, zip, sammanhängande komponenter |
| 8 | DP & Kombinatorik | Dynamisk programmering | Kadane, coin change, LIS, permutationer |

### Adaptiv Svårighet

- Klättrar vid ≥75% lösningsgrad (≥70% för nivå 5+)
- Backar vid <25% lösningsgrad
- Utvärderar senaste 15 uppgifter på nuvarande nivå

---

## 5. Experimentresultat

### Baseline — Session 1 (v2, 2026-02-10)

| Metrik | Värde |
|--------|-------|
| Uppgifter | 138 |
| Lösta | 105 (76%) |
| Tid | 8 minuter |
| Max nivå nådd | 8 |
| HDC Koncept | 49 |
| AIF Exploration | 0.29 (start: 0.60) |
| AIF Surprise | 2.08 |
| Ebbinghaus aktiva | 25 av 111 lagrade |
| Bästa streak | 12 |
| Skills | 58 |

#### Per nivå

| Nivå | Lösta/Försökta | Lösningsgrad |
|------|----------------|--------------|
| 1 | 4/5 | 80% |
| 2 | 12/16 | 75% |
| 3 | 19/26 | 73% |
| 4 | 33/45 | 73% |
| 5 | 37/46 | 80% |
| 6 | 0/0 | — |
| 7 | 0/0 | — |
| 8 | 0/0 | — |

### Observationer

1. **Exploration sjunker**: 0.60 → 0.29 — systemet lär sig vilka strategier som fungerar
2. **Minneskonsolidering fungerar**: 86 av 111 minnen glömda — svaga lösningar rensas
3. **Nivå 5 överträffar nivå 1-4**: 80% vs 73-80% — möjligen bättre prompt-engineering för avancerade uppgifter
4. **Nivå 6-8 ej nådda i fas 2**: Adaptiv difficulty hoppade direkt till 8 men sessionen avslutades

---

## 6. Kända Begränsningar

1. **Perception är enkel**: Keyword-boosting istället för riktig embedding — missar semantiska nyanser
2. **Ingen spaced repetition ännu**: Svåra uppgifter återbesöks inte systematiskt
3. **LLM-beroende**: Frankenstein styr processen men Gemini gör det tunga arbetet
4. **Ingen cross-domain transfer**: Tränad på kod, kan inte direkt appliceras på andra domäner
5. **Sandbox-begränsningar**: Timeout 10s, ingen nätverksåtkomst, begränsad minnesanvändning

---

## 7. Nästa Steg

Se `ROADMAP.md` för detaljerad forskningsplan.

---

## 8. Referenser

1. Kanerva, P. (2009). Hyperdimensional Computing: An Introduction. *Cognitive Computation*.
2. Friston, K. (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience*.
3. Ebbinghaus, H. (1885). Über das Gedächtnis.
4. Hasani, R. et al. (2021). Liquid Time-constant Networks. *AAAI*.
5. Da Costa, L. et al. (2020). Active Inference on Discrete State-Spaces. *Journal of Mathematical Psychology*.
6. Kleyko, D. et al. (2022). A Survey on Hyperdimensional Computing. *ACM Computing Surveys*.
