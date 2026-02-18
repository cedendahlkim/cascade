# Frankenstein AI — Matematisk Forskningsmodul

## Översikt

Frankenstein AI utforskar **olösta matematiska problem** autonomt. Systemet formulerar hypoteser, testar dem empiriskt, encoderar mönster som HDC-vektorer, och lagrar upptäckter i Ebbinghaus-minnet. Active Inference (AIF) styr vilka problem och intervall som utforskas baserat på nyfikenhetsdrift (surprise-minimering).

## Arkitektur

```
┌─────────────────────────────────────────────────────┐
│              MathResearchEngine                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   AIF    │  │   HDC    │  │   Ebbinghaus     │  │
│  │ Problem  │  │ Encoder  │  │   Memory         │  │
│  │ Selector │  │ (10000D) │  │   (ChromaDB)     │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │             │
│  ┌────▼──────────────▼─────────────────▼──────────┐ │
│  │            Research Problems                    │ │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────────┐ │ │
│  │  │ Goldbach │ │Twin Primes│ │Perfect Numbers│ │ │
│  │  └──────────┘ └───────────┘ └───────────────┘ │ │
│  │  ┌──────────────┐ ┌──────────┐                │ │
│  │  │Lonely Runner │ │ Syracuse │                │ │
│  │  └──────────────┘ └──────────┘                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │         Cross-Domain Discovery                  │ │
│  │   HDC-similarity mellan fynd från olika problem │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Olösta Problem

### 1. Goldbach's Conjecture
**Påstående:** Varje jämnt heltal > 2 är summan av två primtal.

**Vad vi utforskar:**
- Antal Goldbach-partitioner per jämnt tal
- Mönster i minsta primtal i partitionen
- Residue class patterns (mod 6)
- Tillväxttakt av partitionsantal

**Metoder:** Sieve of Eratosthenes, z-score anomali-detektion, mod-analys.

### 2. Twin Prime Conjecture
**Påstående:** Det finns oändligt många primtalspar (p, p+2).

**Vad vi utforskar:**
- Densitet av tvillingprimtal som funktion av n
- Gap-distribution mellan konsekutiva tvillingpar
- Tvillingprimtals-öknar och kluster
- Brun's constant approximation

**Metoder:** Sieve, gap-analys, densitets-kvartiler, partialsummor.

### 3. Perfect Numbers (Odd)
**Påstående:** Finns det udda perfekta tal? (σ(n) = 2n där n är udda)

**Vad vi utforskar:**
- Abundans-mönster: σ(n)/n distribution för udda tal
- Nära-perfekta udda tal (σ(n)/n ≈ 1.0)
- Multiperfekta tal (σ(n) = k·n)
- Divisorsumme-mönster per mod-klass

**Metoder:** Divisorsumma-beräkning, abundans-analys, mod-gruppering.

### 4. Lonely Runner Conjecture
**Påstående:** k löpare med distinkta hastigheter på en cirkulär bana av längd 1 — varje löpare blir vid någon tidpunkt ensam (avstånd ≥ 1/k från alla andra).

**Vad vi utforskar:**
- Verifiering för specifika hastighetsuppsättningar
- Minimalt "ensamt avstånd" som funktion av k
- Marginalen (min avstånd - 1/k) per k
- Optimala vs sämsta hastighetsval

**Metoder:** Numerisk simulering, stokastisk sampling av hastigheter.

### 5. Syracuse / Generalized Collatz
**Påstående:** Vilka (a, b) i "om udda: a·n+b, om jämnt: n/2" konvergerar alltid till 1?

**Vad vi utforskar:**
- Konvergens/cykel/divergens-klassificering per (a, b)
- Cykeldetektion i icke-standard varianter (5n+1, 3n+3, etc.)
- Mönster i vilka varianter som konvergerar
- Cykelstrukturer

**Metoder:** Iterativ beräkning med cykel/divergens-detektion, variant-jämförelse.

## Forskningsmetodik

### Hypotes-livscykel
```
Observation → Hypotes (confidence=0.5)
    → Empiriskt test → Bayesiansk uppdatering
    → confidence > 0.9 + 10 tester → "supported"
    → confidence < 0.1 + 5 tester  → "refuted"
    → annars                        → "active" (fortsätt testa)
```

### AIF-driven Problem Selection
Active Inference-agenten väljer vilket problem som ska utforskas härnäst:
- **Hög surprise** → Utforska mer av samma problem (epistemiskt värde)
- **Låg surprise** → Byt till annat problem (pragmatiskt värde)
- **exploration_weight=0.6** → Balans mellan nyfikenhet och konsolidering

### Cross-Domain Discovery
HDC-vektorer från olika problem jämförs via cosine similarity. Om fynd från t.ex. Goldbach och Twin Primes har hög similarity kan det indikera en djupare koppling.

### HDC Encoding
Varje fynd encoderas som en 10 000-dimensionell hypervektor:
- **Problem-typ vektor** (unik per problem)
- **Numeriska egenskaper** (magnitude, density, gap, etc.) via kvantisering + binding
- **Bundling** av alla egenskaper → holografisk representation

## Filer

| Fil | Beskrivning |
|-----|-------------|
| `math_research.py` | Huvudmodul — engine, 5 problem, HDC encoder, journal |
| `math_research_test.py` | 86 enhetstester |
| `collatz_explorer.py` | Dedikerad Collatz-utforskare (separat modul) |
| `collatz_explorer_test.py` | 61 enhetstester för Collatz |
| `training_data/math_research/` | Forskningsjournal (JSONL) |

## Användning

### Snabb synkron körning
```python
from math_research import run_quick_research

result = run_quick_research(iterations=10)
print(result["report"])
```

### Fullständig asynkron forskningscykel
```python
import asyncio
from math_research import MathResearchEngine

engine = MathResearchEngine()
summary = asyncio.run(engine.run_research_cycle(
    iterations=50,
    range_size=10000,
))
print(engine.get_research_report())
```

### Utforska specifikt problem
```python
from math_research import MathResearchEngine

engine = MathResearchEngine()
findings = engine.explore_problem("goldbach", start=4, end=100000)
hypotheses = engine.generate_hypotheses("goldbach")
results = engine.test_hypotheses("goldbach", sample_size=1000)
```

### Integration med sömnkonsolidering
```python
# I circadian.py's DreamEngine:
from math_research import MathResearchEngine

engine = MathResearchEngine(memory=episodic_memory, bridge=hdc_bridge)
# Kör under REM-sömn som drömprocess
summary = await engine.run_research_cycle(iterations=5, range_size=2000)
```

## Loggning

Alla fynd loggas till `training_data/math_research/research_journal.jsonl`:
```json
{
  "iteration": 3,
  "problem": "goldbach",
  "findings_count": 5,
  "findings": [{"id": "gb_single_4", "category": "anomaly", "description": "..."}],
  "timestamp": 1739882400.0,
  "surprise": 0.342
}
```

Sammanfattningar loggas till `training_data/math_research/research_summaries.jsonl`.

## Framtida Utvidgningar

- **LLM-integration**: Låt Frankenstein formulera hypoteser i naturligt språk via Gemini
- **Bevisförsök**: Symbolisk bevisföring med Z3/SymPy
- **Visualisering**: Generera plots av mönster och anomalier
- **Fler problem**: Riemann Hypothesis (ζ-nollställen), ABC Conjecture, P vs NP
- **Peer review**: Swarm-agenter granskar varandras hypoteser
- **Publicering**: Auto-generera LaTeX-rapporter av starka hypoteser
