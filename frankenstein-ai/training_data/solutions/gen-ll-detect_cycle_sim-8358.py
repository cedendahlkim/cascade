# Task: gen-ll-detect_cycle_sim-8358 | Score: 100% | 2026-02-15T13:59:39.347009

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)