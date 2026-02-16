# Task: gen-dp-climb_stairs-1338 | Score: 100% | 2026-02-11T10:09:35.275304

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
        return
    
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    
    print(b)

solve()