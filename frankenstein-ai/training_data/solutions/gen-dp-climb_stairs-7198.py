# Task: gen-dp-climb_stairs-7198 | Score: 100% | 2026-02-10T18:54:35.860263

def climb_stairs(n):
    if n <= 1:
        return 1
    a, b = 1, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

n = int(input())
print(climb_stairs(n))