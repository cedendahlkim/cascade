# Task: gen-dp-climb_stairs-5346 | Score: 100% | 2026-02-11T11:14:37.757392

def climb_stairs(n):
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b

n = int(input())
print(climb_stairs(n))