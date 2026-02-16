# Task: gen-ll-detect_cycle_sim-5561 | Score: 100% | 2026-02-15T10:28:29.408428

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)