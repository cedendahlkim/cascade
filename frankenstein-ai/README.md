# 🧟 Frankenstein AI Stack

**Flytande Intelligens, Hyperdimensionell Kognition och Aktiv Inferens**

En fungerande prototyp av nästa generations AI-arkitektur som kombinerar tre banbrytande teknologier:

## Arkitektur

```
Sensor → CNN Encoder → LNN (CfC) → HDC Projektion → Kognition →
Active Inference → Handling → Inlärning → Minneskonsolidering
```

### De fyra pelarna

| Pelare | Teknologi | Bibliotek | Roll |
|--------|-----------|-----------|------|
| **Perception** | Liquid Neural Networks (LNN) | `ncps` | Tidsmedveten perception via CfC-neuroner |
| **Kognition** | Hyperdimensional Computing (HDC) | `torchhd` | Robust minne, one-shot learning |
| **Agentskap** | Active Inference (AIF) | `pymdp` | Nyfikenhetsdriven beslutsfattning |
| **Minne** | Ebbinghaus + ChromaDB | `chromadb` | Hierarkisk minneskonsolidering |

### Flöde per steg

1. **SENSOR**: Rådata → CNN Encoder (feature extraction)
2. **PERCEPTION (LNN)**: CNN Features → CfC-lager → Kontinuerligt Tillstånd (h_t)
3. **KODNING (Bridge)**: h_t → Random Projection → Hypervektor (10 000D)
4. **KOGNITION (HDC)**: Hypervektor jämförs med prototyper → Observations-ID
5. **BESLUT (Active Inference)**: Minimera Expected Free Energy → Välj Handling
6. **INLÄRNING**: One-shot learning (HDC) + Ebbinghaus minneskonsolidering

## Installation

```bash
cd frankenstein-ai
pip install -r requirements.txt
```

## Körning

```bash
python frankenstein_agent.py
```

## Moduler

- `perception.py` — LiquidPerceptionUnit (CNN + CfC/AutoNCP)
- `cognition.py` — NeuroSymbolicBridge (HDC projektion, bundling, klassificering)
- `agency.py` — ActiveInferenceAgent (pymdp, EFE-minimering)
- `memory.py` — EbbinghausMemory (ChromaDB + glömskekurva) + ShortTermBuffer
- `frankenstein_agent.py` — FrankensteinAgent (integration + demo)

## Nyckelkoncept

- **19 neuroner** räcker för autonom styrning (inspirerat av MIT/C. elegans)
- **CfC** (Closed-form Continuous-time): 8 752% snabbare än standard ODE-lösare
- **HDC**: One-shot learning utan backpropagation, extremt brustolerant
- **Active Inference**: Balanserar exploitation och exploration via fri energi
- **Ebbinghaus**: Biologiskt inspirerad minneskonsolidering med glömskekurva

## Träning (v2)

Frankenstein tränas via kodgenerering med 8 svårighetsnivåer:

```bash
cd frankenstein-ai
python -u continuous_train.py
```

Se [RESEARCH.md](RESEARCH.md) för forskningsdokumentation och [ROADMAP.md](ROADMAP.md) för forskningsplan.

### Workflows (Windsurf/Cascade)

- `/frankenstein-train` — Starta, övervaka och hantera träning
- `/frankenstein-upgrade` — Uppgradera med nya uppgiftstyper/strategier
- `/frankenstein-analyze` — Analysera resultat och identifiera svaga områden

### Dashboard

Realtidsövervakning i Cascade Remote → More → 🧟 Frankenstein

## Baserat på

Rapporten "Flytande Intelligens, Hyperdimensionell Kognition och Aktiv Inferens:
En Uttömmande Konstruktionsanalys av Nästa Generations AI-Arkitektur"
