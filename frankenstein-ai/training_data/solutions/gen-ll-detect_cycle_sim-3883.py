# Task: gen-ll-detect_cycle_sim-3883 | Score: 100% | 2026-02-15T08:24:06.860295

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)