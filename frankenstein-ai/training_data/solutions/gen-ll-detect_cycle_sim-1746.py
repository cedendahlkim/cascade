# Task: gen-ll-detect_cycle_sim-1746 | Score: 100% | 2026-02-13T18:33:54.224214

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)