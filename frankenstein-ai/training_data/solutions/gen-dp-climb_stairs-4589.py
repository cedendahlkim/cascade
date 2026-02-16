# Task: gen-dp-climb_stairs-4589 | Score: 100% | 2026-02-10T19:14:09.952299

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
    else:
        a = 1
        b = 2
        for _ in range(3, n + 1):
            c = a + b
            a = b
            b = c
        print(b)

solve()