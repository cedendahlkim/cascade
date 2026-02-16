# Task: gen-ll-detect_cycle_sim-6638 | Score: 100% | 2026-02-14T13:26:00.657431

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)