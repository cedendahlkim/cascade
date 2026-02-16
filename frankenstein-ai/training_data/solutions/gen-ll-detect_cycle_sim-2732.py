# Task: gen-ll-detect_cycle_sim-2732 | Score: 100% | 2026-02-15T12:03:08.108554

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)