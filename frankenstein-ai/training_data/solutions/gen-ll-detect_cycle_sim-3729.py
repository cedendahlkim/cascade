# Task: gen-ll-detect_cycle_sim-3729 | Score: 100% | 2026-02-14T13:41:46.609481

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)