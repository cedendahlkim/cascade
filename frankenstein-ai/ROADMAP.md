# 🗺️ Frankenstein AI — Forskningsplan & Roadmap

**Version:** 1.0
**Senast uppdaterad:** 2026-02-10

---

## Övergripande Mål

Bygga en **generell meta-lärande agent** som kan appliceras på godtyckliga domäner, med kodgenerering som första träningsdomän.

---

## Fas 1: Grundläggande Stack ✅ (Klar)

**Mål:** Bevisa att HDC + AIF + Ebbinghaus kan samverka

- [x] HDC kognition med one-shot learning
- [x] Active Inference med EFE-minimering
- [x] Ebbinghaus minne med glömskekurva
- [x] Integration i FrankensteinCodeAgent
- [x] Grundläggande träningsloop (continuous_train.py)
- [x] Dashboard i Cascade Remote (FrankensteinView)

**Resultat:** 76% lösningsgrad, 49 koncept, exploration 0.60→0.29

---

## Fas 2: Utökad Träning ✅ (Klar)

**Mål:** Bredda uppgiftsrymden och förbättra inlärningen

- [x] 8 svårighetsnivåer (var 5)
- [x] 17 uppgiftsgeneratorer (sortering, datastrukturer, grafer, DP, kombinatorik)
- [x] 8 AIF-observationer (partial, syntax, timeout)
- [x] Felklassificering (syntax/logic/timeout/runtime)
- [x] Strategi-framgångsspårning
- [x] Bättre prompt-engineering (alla testfall, feltyp-specifik retry)
- [x] Smartare adaptive difficulty (nivåspecifik utvärdering)

**Resultat:** Baseline etablerad, redo för längre träningskörningar

---

## Fas 3: Djupare Inlärning 🔄 (Pågående)

**Mål:** Förbättra inlärningskvaliteten och minnesanvändningen

### 3.1 Spaced Repetition
- [ ] Återbesök misslyckade uppgiftstyper med ökande intervall
- [ ] Prioritera uppgifter där lösningsgraden är 30-70% (inlärningszonen)
- [ ] Ebbinghaus-driven schemaläggning av repetitioner

### 3.2 Hierarkisk HDC
- [ ] Sub-koncept: "sorting" → "bubble_sort", "merge_sort", "insertion_sort"
- [ ] Koncepthierarki med similarity threshold decay
- [ ] Transfer learning mellan liknande koncept

### 3.3 Förbättrad Perception
- [ ] Sentence embeddings istället för keyword-boosting
- [ ] Kontextuella features (svårighetsgrad, uppgiftstyp, kodlängd)
- [ ] Temporal features (tid på dygnet, session-position)

### 3.4 Multi-LLM Routing
- [ ] AIF väljer inte bara strategi utan även LLM (Gemini vs Grok vs lokal)
- [ ] Kostnads-medveten routing (billigare modell för enkla uppgifter)
- [ ] Fallback-kedja vid API-fel

**Milstolpe:** ≥85% lösningsgrad på nivå 1-5, ≥60% på nivå 6-8

---

## Fas 4: Generalisering 📋 (Planerad)

**Mål:** Applicera Frankenstein-stacken på andra domäner

### 4.1 Unity-utveckling
- [ ] Uppgifter: Skapa GameObjects, skript, prefabs via MCP
- [ ] HDC lär sig Unity-mönster (Singleton, Observer, State Machine)
- [ ] AIF styr vilka MCP-verktyg som används

### 4.2 Projektplanering
- [ ] Uppgifter: Bryt ner features till tasks
- [ ] HDC känner igen projekttyper
- [ ] Ebbinghaus minns vilka estimat som var korrekta

### 4.3 Felsökning
- [ ] Uppgifter: Diagnostisera och fixa buggar
- [ ] HDC matchar felmeddelanden mot kända mönster
- [ ] AIF väljer debug-strategi (logga, isolera, reproducera)

**Milstolpe:** Frankenstein kan styra minst 2 domäner med delad kunskapsbas

---

## Fas 5: Självförbättring 🔮 (Framtid)

**Mål:** Systemet förbättrar sig själv

### 5.1 Meta-meta-learning
- [ ] Frankenstein analyserar sin egen inlärningskurva
- [ ] Justerar HDC-dimensioner, AIF-parametrar, Ebbinghaus-thresholds automatiskt

### 5.2 Kunskapsdelning
- [ ] Flera Frankenstein-instanser delar koncept via federation
- [ ] Distribuerad HDC: koncept synkas mellan agenter

### 5.3 Förklarbarhet
- [ ] Varje beslut kan spåras: "Jag valde X för att Y"
- [ ] Konceptvisualisering: vilka mönster har systemet lärt sig?
- [ ] Confidence calibration: är systemet rätt kalibrerat?

**Milstolpe:** Systemet kan förklara varför det valde en viss strategi

---

## Mätplan

### Nyckelmetrik

| Metrik | Beskrivning | Mål |
|--------|-------------|-----|
| **Solve Rate** | Andel lösta uppgifter | ≥85% (nivå 1-5) |
| **First-Try Rate** | Löst utan retry | ≥60% |
| **Exploration Decay** | Hur snabbt AIF konvergerar | 0.60→0.15 inom 500 uppgifter |
| **Concept Efficiency** | Uppgifter per nytt koncept | ≤5 |
| **Memory Retention** | Andel aktiva minnen | 20-40% (resten glömda = bra) |
| **Strategy Convergence** | Bästa strategi per uppgiftstyp | Tydlig preferens efter 100 uppgifter |
| **Level Progression** | Tid till nivå 8 | <30 minuter |
| **Cross-Domain Transfer** | Prestanda i ny domän med befintlig kunskap | >50% dag 1 |

### Datainsamling

- `progress.json` — Löpande statistik per session
- `training.log` — Detaljerad logg per uppgift
- `solutions/` — Alla genererade lösningar
- Dashboard — Realtidsvisualisering i Cascade Remote

---

## Risker & Mitigering

| Risk | Sannolikhet | Konsekvens | Mitigering |
|------|-------------|------------|------------|
| LLM API-kostnader | Hög | Medel | Gemini Flash (gratis tier), lokal fallback |
| Overfitting till koddomänen | Medel | Hög | Abstrakt arkitektur, domän-agnostisk HDC |
| HDC skalbarhet | Låg | Hög | Dimensionsreduktion, hierarkisk HDC |
| AIF konvergerar för snabbt | Medel | Medel | Minimum exploration weight (0.15) |
| Ebbinghaus glömmer för mycket | Låg | Medel | Justerbar decay threshold |
