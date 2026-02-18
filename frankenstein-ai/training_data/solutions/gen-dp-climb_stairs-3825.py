# Task: gen-dp-climb_stairs-3825 | Score: 100% | 2026-02-17T20:10:02.564790

n = int(input())
if n <= 1:
    print(1)
else:
    a, b = 1, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    print(b)