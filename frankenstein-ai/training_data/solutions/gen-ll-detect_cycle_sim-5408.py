# Task: gen-ll-detect_cycle_sim-5408 | Score: 100% | 2026-02-14T12:37:18.195555

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)