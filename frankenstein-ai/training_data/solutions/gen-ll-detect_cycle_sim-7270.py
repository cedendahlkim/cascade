# Task: gen-ll-detect_cycle_sim-7270 | Score: 100% | 2026-02-15T08:24:22.988611

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)