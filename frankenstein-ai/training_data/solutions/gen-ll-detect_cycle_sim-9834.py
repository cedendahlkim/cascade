# Task: gen-ll-detect_cycle_sim-9834 | Score: 100% | 2026-02-15T10:29:10.128192

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)