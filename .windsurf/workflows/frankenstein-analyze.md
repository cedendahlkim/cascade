---
description: Analysera Frankenstein AI träningsresultat och generera rapport
---

# Frankenstein AI — Analysworkflow

## 1. Hämta aktuell status

// turbo
```powershell
python -c "
import json, os
path = 'frankenstein-ai/training_data/progress.json'
if not os.path.exists(path):
    print('Ingen progress.json hittad'); exit()
d = json.load(open(path))
print('=== FRANKENSTEIN AI RAPPORT ===')
print(f'Sessions: {d.get(\"session_count\", 0)}')
print(f'Total tid: {d.get(\"total_training_seconds\", 0)/3600:.1f}h')
print(f'Uppgifter: {d[\"total_tasks_solved\"]}/{d[\"total_tasks_attempted\"]} ({d[\"total_tasks_solved\"]/max(d[\"total_tasks_attempted\"],1):.0%})')
print(f'Nivå: {d[\"current_difficulty\"]}')
print(f'Skills: {len(d.get(\"skills\", {}))}')
print(f'Bästa streak: {d.get(\"best_streak\", 0)}')
stack = d.get('stack', {})
print(f'HDC Koncept: {stack.get(\"hdc_concepts\", 0)}')
print(f'AIF Exploration: {stack.get(\"aif_exploration\", 0):.2f}')
print(f'Minnen: {stack.get(\"memory_active\", 0)} aktiva / {stack.get(\"memory_stored\", 0)} totalt')
print()
print('--- Per nivå ---')
for lvl in range(1, 9):
    ls = d.get('level_stats', {}).get(str(lvl), {'attempted': 0, 'solved': 0})
    a, s = ls['attempted'], ls['solved']
    rate = s / max(a, 1)
    bar = '█' * int(rate * 20) + '░' * (20 - int(rate * 20))
    print(f'  Nivå {lvl}: [{bar}] {s}/{a} ({rate:.0%})')
print()
ec = stack.get('error_counts', {})
if ec:
    print('--- Felanalys ---')
    for t, c in sorted(ec.items(), key=lambda x: -x[1]):
        if c > 0: print(f'  {t}: {c}')
print()
ss = stack.get('strategy_stats', {})
if ss:
    print('--- Strategi-framgång ---')
    for name, st in ss.items():
        rate = st['successes']/max(st['attempts'],1) if st['attempts'] > 0 else 0
        print(f'  {name}: {st[\"successes\"]}/{st[\"attempts\"]} ({rate:.0%})')
"
```

## 2. Kolla om träning körs

// turbo
```powershell
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*continuous_train*" } | Select-Object Id, StartTime, @{N='Runtime';E={(Get-Date) - $_.StartTime}}
```

## 3. Kolla senaste loggrader

// turbo
```powershell
Get-Content "frankenstein-ai/training_data/training.log" -Tail 20
```

## 4. Kolla senaste stdout

// turbo
```powershell
Get-Content "frankenstein-ai/training_data/stdout.log" -Tail 30
```

## 5. Räkna sparade lösningar

// turbo
```powershell
(Get-ChildItem "frankenstein-ai/training_data/solutions/*.py" -ErrorAction SilentlyContinue).Count
```

## 6. Identifiera svaga områden

// turbo
```powershell
python -c "
import json
d = json.load(open('frankenstein-ai/training_data/progress.json'))
history = d.get('history', [])
# Hitta uppgiftstyper med låg lösningsgrad
from collections import defaultdict
type_stats = defaultdict(lambda: {'solved': 0, 'total': 0})
for h in history:
    tid = h.get('id', '')
    parts = tid.split('-')
    task_type = '-'.join(parts[:2]) if len(parts) >= 2 else tid
    type_stats[task_type]['total'] += 1
    if h.get('score', 0) >= 1.0:
        type_stats[task_type]['solved'] += 1

print('Svagaste uppgiftstyper (minst 3 försök):')
weak = [(t, s['solved']/s['total'], s['solved'], s['total'])
        for t, s in type_stats.items() if s['total'] >= 3]
for t, rate, solved, total in sorted(weak, key=lambda x: x[1])[:10]:
    print(f'  {t}: {solved}/{total} ({rate:.0%})')
"
```
