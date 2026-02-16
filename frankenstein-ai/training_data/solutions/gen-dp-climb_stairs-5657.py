# Task: gen-dp-climb_stairs-5657 | Score: 100% | 2026-02-10T18:54:37.296238

def climb_stairs(n):
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b

n = int(input())
print(climb_stairs(n))