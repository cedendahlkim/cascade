# Task: gen-ll-detect_cycle_sim-8832 | Score: 100% | 2026-02-15T10:50:27.940914

n = int(input())
lst = [int(input()) for _ in range(n)]
seen = set()
for x in lst:
    if x in seen:
        print(x)
        break
    seen.add(x)