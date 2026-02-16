# Task: gen-ll-detect_cycle_sim-3412 | Score: 100% | 2026-02-13T21:28:05.364713

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)