# Task: gen-ll-detect_cycle_sim-8010 | Score: 100% | 2026-02-13T13:42:11.022669

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)