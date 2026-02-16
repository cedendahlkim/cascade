#!/usr/bin/env python3
"""Analyze Frankenstein training data and print summary report."""
import json
import os
import sys
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), "training_data")
PROGRESS_FILE = os.path.join(DATA_DIR, "progress.json")
EBBINGHAUS_DIR = os.path.join(DATA_DIR, "ebbinghaus")

def main():
    if not os.path.exists(PROGRESS_FILE):
        print(f"ERROR: {PROGRESS_FILE} not found")
        sys.exit(1)

    with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
        d = json.load(f)

    total = d.get("total_tasks_attempted", 0)
    solved = d.get("total_tasks_solved", 0)
    rate = round(solved / max(total, 1) * 100, 1)
    diff = d.get("current_difficulty", 0)
    skills = d.get("skills", {})
    ss = d.get("strategy_stats", {})
    ls = d.get("level_stats", {})

    print("=" * 60)
    print("  FRANKENSTEIN AI - TRAINING ANALYSIS")
    print("=" * 60)
    print(f"  Total attempted:  {total:,}")
    print(f"  Total solved:     {solved:,}")
    print(f"  Solve rate:       {rate}%")
    print(f"  Current level:    {diff}")
    print(f"  Skills learned:   {len(skills)}")
    print()

    # Level stats
    print("-" * 60)
    print("  LEVEL BREAKDOWN")
    print("-" * 60)
    for k in sorted(ls.keys(), key=lambda x: int(x)):
        v = ls[k]
        att = v.get("attempted", v.get("total", "?"))
        sol = v.get("solved", "?")
        r = round(sol / max(att, 1) * 100, 1) if isinstance(att, int) and isinstance(sol, int) else "?"
        bar_len = int(r / 5) if isinstance(r, float) else 0
        bar = "#" * bar_len + "." * (20 - bar_len)
        print(f"  Level {k:>2}: [{bar}] {sol}/{att} ({r}%)")
    print()

    # Strategy stats
    print("-" * 60)
    print("  STRATEGY PERFORMANCE")
    print("-" * 60)
    strat_list = []
    for k, v in ss.items():
        if isinstance(v, dict):
            t = v.get("total", 0)
            s = v.get("solved", 0)
            r = round(s / max(t, 1) * 100, 1)
            strat_list.append((k, t, s, r))
    strat_list.sort(key=lambda x: -x[1])
    for name, t, s, r in strat_list:
        print(f"  {name:<30} {s:>5}/{t:<5} ({r}%)")
    print()

    # Skills summary
    print("-" * 60)
    print("  SKILL CATEGORIES")
    print("-" * 60)
    categories = defaultdict(int)
    for skill_name in skills:
        cat = skill_name.split("_")[0] if "_" in skill_name else skill_name
        categories[cat] += 1
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat:<25} {count} skills")
    print()

    # Ebbinghaus memory stats
    print("-" * 60)
    print("  EBBINGHAUS MEMORY SYSTEM")
    print("-" * 60)
    if os.path.exists(EBBINGHAUS_DIR):
        mem_files = [f for f in os.listdir(EBBINGHAUS_DIR) if f.endswith(".json")]
        total_memories = 0
        forgotten = 0
        active = 0
        for mf in mem_files:
            try:
                with open(os.path.join(EBBINGHAUS_DIR, mf), "r", encoding="utf-8") as f:
                    mem_data = json.load(f)
                if isinstance(mem_data, list):
                    total_memories += len(mem_data)
                    for item in mem_data:
                        if isinstance(item, dict):
                            if item.get("forgotten", False):
                                forgotten += 1
                            else:
                                active += 1
                elif isinstance(mem_data, dict):
                    items = mem_data.get("items", mem_data.get("memories", []))
                    total_memories += len(items)
                    for item in items:
                        if isinstance(item, dict):
                            if item.get("forgotten", False):
                                forgotten += 1
                            else:
                                active += 1
            except Exception as e:
                print(f"  Warning: Could not read {mf}: {e}")
        print(f"  Memory files:     {len(mem_files)}")
        print(f"  Total memories:   {total_memories:,}")
        print(f"  Active:           {active:,}")
        print(f"  Forgotten:        {forgotten:,}")
    else:
        print(f"  Ebbinghaus dir not found: {EBBINGHAUS_DIR}")
    print()

    # Check persistence
    print("-" * 60)
    print("  PERSISTENCE CHECK")
    print("-" * 60)
    data_files = []
    for root, dirs, files in os.walk(DATA_DIR):
        for f in files:
            fp = os.path.join(root, f)
            size = os.path.getsize(fp)
            data_files.append((fp.replace(DATA_DIR, ""), size))
    data_files.sort(key=lambda x: -x[1])
    total_size = sum(s for _, s in data_files)
    print(f"  Data directory:   {DATA_DIR}")
    print(f"  Total files:      {len(data_files)}")
    print(f"  Total size:       {total_size / 1024 / 1024:.1f} MB")
    print(f"  Top 10 files:")
    for path, size in data_files[:10]:
        print(f"    {size/1024:>8.1f} KB  {path}")
    print()
    print("=" * 60)

if __name__ == "__main__":
    main()
