"""
Kör 10 sekventiella A/B-tester för forskningsdokumentation.
Varje test: 30 uppgifter, svårighet 3-8, Frankenstein vs Bare LLM.
Sparar individuella resultat + aggregerad sammanställning.
"""

import os
os.environ["PYTHONIOENCODING"] = "utf-8"

import sys
import time
import json
from pathlib import Path

from ab_test import run_ab_test

NUM_RUNS = 10
TASKS_PER_RUN = 30
DIFFICULTIES = [3, 4, 5, 6, 7, 8]

print("=" * 70)
print(f"  🔬 FORSKNINGSSERIE: {NUM_RUNS} A/B-tester × {TASKS_PER_RUN} uppgifter")
print(f"  Totalt: {NUM_RUNS * TASKS_PER_RUN} uppgifter per agent")
print(f"  Svårigheter: {DIFFICULTIES}")
print("=" * 70)

all_results = []
for run_num in range(1, NUM_RUNS + 1):
    print(f"\n{'#' * 70}")
    print(f"  TEST {run_num}/{NUM_RUNS}")
    print(f"{'#' * 70}\n")

    try:
        result = run_ab_test(num_tasks=TASKS_PER_RUN, difficulties=DIFFICULTIES)
        all_results.append(result)
    except Exception as e:
        print(f"  ⚠ Test {run_num} misslyckades: {e}")
        all_results.append(None)

    if run_num < NUM_RUNS:
        print(f"\n  ⏳ Paus 10s innan nästa test...")
        time.sleep(10)

# Sammanfattning
print("\n" + "=" * 70)
print("  📊 SAMMANFATTNING AV ALLA 10 TESTER")
print("=" * 70)

valid = [r for r in all_results if r is not None]
for i, r in enumerate(valid):
    fr = r["frankenstein"]["solve_rate"]
    br = r["bare_llm"]["solve_rate"]
    d = fr - br
    w = "🧟" if d > 0.05 else ("📝" if d < -0.05 else "🤝")
    print(f"  Test {i+1}: Frank {fr:.0%} vs Bare {br:.0%}  {w} ({d:+.1%})")

total_f = sum(r["frankenstein"]["solved"] for r in valid)
total_b = sum(r["bare_llm"]["solved"] for r in valid)
total_n = sum(r["num_tasks"] for r in valid)
print(f"\n  TOTALT: Frankenstein {total_f}/{total_n} ({total_f/max(total_n,1):.1%}) vs Bare LLM {total_b}/{total_n} ({total_b/max(total_n,1):.1%})")
diff = (total_f - total_b) / max(total_n, 1)
print(f"  Skillnad: {diff:+.1%}")
print("=" * 70)
