# Task: gen-ll-detect_cycle_sim-3264 | Score: 100% | 2026-02-15T13:59:40.796074

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)