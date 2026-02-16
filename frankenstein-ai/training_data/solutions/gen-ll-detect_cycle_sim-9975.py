# Task: gen-ll-detect_cycle_sim-9975 | Score: 100% | 2026-02-13T10:14:49.612682

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)