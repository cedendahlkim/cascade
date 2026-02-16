# Task: gen-dp-climb_stairs-9395 | Score: 100% | 2026-02-11T09:21:30.924255

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
    else:
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        print(b)

solve()