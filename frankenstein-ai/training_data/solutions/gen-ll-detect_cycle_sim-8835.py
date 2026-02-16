# Task: gen-ll-detect_cycle_sim-8835 | Score: 100% | 2026-02-13T11:45:33.620215

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)