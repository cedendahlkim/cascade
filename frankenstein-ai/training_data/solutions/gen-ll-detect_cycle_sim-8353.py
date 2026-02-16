# Task: gen-ll-detect_cycle_sim-8353 | Score: 100% | 2026-02-13T21:07:59.998231

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)