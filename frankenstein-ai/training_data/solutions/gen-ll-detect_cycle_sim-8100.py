# Task: gen-ll-detect_cycle_sim-8100 | Score: 100% | 2026-02-13T20:50:30.290085

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)