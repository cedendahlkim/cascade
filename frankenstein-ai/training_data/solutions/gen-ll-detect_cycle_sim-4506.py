# Task: gen-ll-detect_cycle_sim-4506 | Score: 100% | 2026-02-15T12:03:21.354926

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)