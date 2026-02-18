# Task: gen-ll-detect_cycle_sim-2051 | Score: 100% | 2026-02-17T20:00:23.757025

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)