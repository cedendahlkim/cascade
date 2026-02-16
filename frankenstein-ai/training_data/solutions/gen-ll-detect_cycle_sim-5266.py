# Task: gen-ll-detect_cycle_sim-5266 | Score: 100% | 2026-02-13T18:00:46.527741

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)