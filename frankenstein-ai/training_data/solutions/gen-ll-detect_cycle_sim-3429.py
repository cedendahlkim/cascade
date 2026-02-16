# Task: gen-ll-detect_cycle_sim-3429 | Score: 100% | 2026-02-13T17:36:22.233604

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)