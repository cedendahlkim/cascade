# Task: gen-ll-detect_cycle_sim-7394 | Score: 100% | 2026-02-14T13:41:45.682740

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)