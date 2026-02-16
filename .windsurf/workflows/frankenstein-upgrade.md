---
description: Uppgradera Frankenstein AI med nya uppgiftstyper, strategier eller moduler
---

# Frankenstein AI — Uppgraderingsworkflow

## När ska detta användas?

- Lägga till nya svårighetsnivåer eller uppgiftstyper
- Förbättra prompt-engineering eller retry-logik
- Lägga till nya AIF-observationer eller strategier
- Ändra HDC-parametrar eller Ebbinghaus-inställningar

## 1. Stoppa pågående träning

Hitta PID:

// turbo
```powershell
Get-Process python | Where-Object { $_.CommandLine -like "*continuous_train*" } | Select-Object Id, StartTime
```

Stoppa:

```powershell
Stop-Process -Id <PID>
```

## 2. Läs nuvarande kod

Relevanta filer:

- `frankenstein-ai/task_generator.py` — Uppgiftsgeneratorer (nivå 1-8)
- `frankenstein-ai/code_agent.py` — FrankensteinCodeAgent (HDC+AIF+Ebbinghaus)
- `frankenstein-ai/continuous_train.py` — Träningsloop och adaptive difficulty
- `frankenstein-ai/cognition.py` — HDC NeuroSymbolicBridge
- `frankenstein-ai/agency.py` — Active Inference Agent
- `frankenstein-ai/memory.py` — Ebbinghaus Memory + ShortTermBuffer
- `frankenstein-ai/programming_env.py` — Task/TestCase/EvalResult dataklasser

## 3. Gör ändringar

### Ny uppgiftstyp

1. Skapa generator-funktion i `task_generator.py`: `def _gen_<name>() -> Task:`
2. Lägg till i `GENERATORS`-listan med rätt difficulty
3. Generera testfall programmatiskt (minst 3 per uppgift)

### Ny AIF-observation

1. Öka `NUM_OBSERVATIONS` i `code_agent.py`
2. Uppdatera `_choose_strategy()` med ny observation-mapping
3. Uppdatera `_update_after_result()` med ny feedback-logik

### Ny strategi

1. Lägg till i `STRATEGIES`-listan i `code_agent.py`
2. Uppdatera `NUM_STRATEGIES`
3. Implementera prompt-logik i `_build_prompt()`
4. Lägg till i `strategy_stats`

## 4. Verifiera

// turbo
```powershell
cd frankenstein-ai
python -c "from code_agent import FrankensteinCodeAgent; a = FrankensteinCodeAgent(); print('Agent OK')"
python -c "from task_generator import generate_task; [print(f'L{i}: {generate_task(i).title}') for i in range(1,9)]"
```

## 5. Bygg web (om dashboard ändrats)

```powershell
cd web
npm run build
```

## 6. Starta om träning

Behåll progress (fortsätt där den var):

```powershell
cd frankenstein-ai
python -u continuous_train.py
```

Eller rensa och börja om:

```powershell
Remove-Item "frankenstein-ai/training_data/progress.json" -ErrorAction SilentlyContinue
python -u continuous_train.py
```

## 7. Dokumentera

Uppdatera `RESEARCH.md` med:

- Nya experimentresultat
- Ändrade parametrar
- Observationer och insikter
