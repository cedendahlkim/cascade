# Task: gen-ll-detect_cycle_sim-6952 | Score: 100% | 2026-02-13T17:36:21.502512

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)