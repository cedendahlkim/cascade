# Task: gen-ll-detect_cycle_sim-2665 | Score: 100% | 2026-02-13T21:49:24.563628

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)