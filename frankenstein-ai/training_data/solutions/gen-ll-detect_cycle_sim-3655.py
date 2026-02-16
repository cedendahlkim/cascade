# Task: gen-ll-detect_cycle_sim-3655 | Score: 100% | 2026-02-15T09:34:14.193685

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)