# Task: gen-dp-climb_stairs-8486 | Score: 100% | 2026-02-14T13:25:55.719966

n = int(input())
if n <= 1:
    print(1)
else:
    a, b = 1, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    print(b)