---
description: Starta, övervaka och hantera Frankenstein AI-träning
---

# Frankenstein AI — Träningsworkflow

## Förutsättningar

- Python 3.11+ installerat
- `GEMINI_API_KEY` satt i environment (eller `.env` i frankenstein-ai/)
- Bridge-servern körs (för dashboard)

## 1. Starta ny träningssession

```bash
cd frankenstein-ai
python -u continuous_train.py
```

Eller i bakgrunden (Windows):

// turbo
```powershell
Start-Process -FilePath "python" -ArgumentList "-u","continuous_train.py" -WorkingDirectory "C:\Users\kim\CascadeProjects\cascade-remote\frankenstein-ai" -RedirectStandardOutput "C:\Users\kim\CascadeProjects\cascade-remote\frankenstein-ai\training_data\stdout.log" -RedirectStandardError "C:\Users\kim\CascadeProjects\cascade-remote\frankenstein-ai\training_data\stderr.log" -NoNewWindow -PassThru | Select-Object Id
```

## 2. Övervaka träning

### Via terminal

// turbo
```powershell
Get-Content "C:\Users\kim\CascadeProjects\cascade-remote\frankenstein-ai\training_data\stdout.log" -Tail 40
```

### Via dashboard

Öppna Cascade Remote → More → 🧟 Frankenstein

### Kolla progress.json direkt

// turbo
```powershell
python -c "import json; d=json.load(open('frankenstein-ai/training_data/progress.json')); print(f'Lösta: {d[\"total_tasks_solved\"]}/{d[\"total_tasks_attempted\"]} ({d[\"total_tasks_solved\"]/max(d[\"total_tasks_attempted\"],1):.0%}), Nivå: {d[\"current_difficulty\"]}, Skills: {len(d.get(\"skills\",{}))}')"
```

## 3. Stoppa träning

Tryck `Ctrl+C` i terminalen (sparar automatiskt).

Eller om bakgrundsprocess:

```powershell
Stop-Process -Id <PID>
```

## 4. Rensa och starta om från scratch

```powershell
Remove-Item "frankenstein-ai/training_data/progress.json" -ErrorAction SilentlyContinue
Remove-Item "frankenstein-ai/training_data/training.log" -ErrorAction SilentlyContinue
Remove-Item "frankenstein-ai/training_data/solutions/*" -ErrorAction SilentlyContinue
```

Sedan starta om (steg 1).

## 5. Analysera resultat

### Exportera stats

// turbo
```powershell
python -c "
import json
d = json.load(open('frankenstein-ai/training_data/progress.json'))
print('=== FRANKENSTEIN AI RAPPORT ===')
print(f'Sessions: {d.get(\"session_count\", 0)}')
print(f'Total tid: {d.get(\"total_training_seconds\", 0)/3600:.1f}h')
print(f'Uppgifter: {d[\"total_tasks_solved\"]}/{d[\"total_tasks_attempted\"]}')
print(f'Lösningsgrad: {d[\"total_tasks_solved\"]/max(d[\"total_tasks_attempted\"],1):.0%}')
print(f'Nivå: {d[\"current_difficulty\"]}')
print(f'Skills: {len(d.get(\"skills\", {}))}')
print(f'Bästa streak: {d.get(\"best_streak\", 0)}')
stack = d.get('stack', {})
print(f'HDC Koncept: {stack.get(\"hdc_concepts\", 0)}')
print(f'AIF Exploration: {stack.get(\"aif_exploration\", 0):.2f}')
print(f'Minnen: {stack.get(\"memory_active\", 0)} aktiva / {stack.get(\"memory_stored\", 0)} totalt')
print()
print('Per nivå:')
for lvl in range(1, 9):
    ls = d.get('level_stats', {}).get(str(lvl), {'attempted': 0, 'solved': 0})
    a, s = ls['attempted'], ls['solved']
    rate = s / max(a, 1)
    print(f'  Nivå {lvl}: {s}/{a} ({rate:.0%})')
"
```

## 6. Uppgradera och fortsätt

Om du ändrar kod i `code_agent.py`, `task_generator.py` etc:

1. Stoppa pågående träning
2. Gör ändringar
3. Testa: `python -c "from code_agent import FrankensteinCodeAgent; print('OK')"`
4. Starta om (progress.json behålls — träningen fortsätter där den var)

## Felsökning

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### "API rate limit"
Gemini Flash har 15 RPM gratis. Träningen har inbyggd rate limiting (1s delay).

### "Timeout" på alla uppgifter
Kolla att sandbox-timeout inte är för kort. Standard: 10s i `programming_env.py`.

### Processen dör tyst
Kolla stderr:
// turbo
```powershell
Get-Content "frankenstein-ai/training_data/stderr.log" -Tail 20
```
