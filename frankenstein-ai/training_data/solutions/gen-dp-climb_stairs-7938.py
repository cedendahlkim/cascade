# Task: gen-dp-climb_stairs-7938 | Score: 100% | 2026-02-11T11:05:51.483513

def climb_stairs(n):
    if n <= 1:
        return 1
    a, b = 1, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

n = int(input())
print(climb_stairs(n))