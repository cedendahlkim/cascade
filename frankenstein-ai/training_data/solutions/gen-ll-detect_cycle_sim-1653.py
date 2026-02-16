# Task: gen-ll-detect_cycle_sim-1653 | Score: 100% | 2026-02-14T12:05:13.667143

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)