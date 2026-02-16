# Task: gen-ll-detect_cycle_sim-6560 | Score: 100% | 2026-02-13T21:48:46.834419

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)