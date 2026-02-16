# Task: gen-ll-detect_cycle_sim-7729 | Score: 100% | 2026-02-13T12:21:53.587324

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)