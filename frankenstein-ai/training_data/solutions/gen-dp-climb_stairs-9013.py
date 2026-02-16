# Task: gen-dp-climb_stairs-9013 | Score: 100% | 2026-02-11T10:09:25.118131

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
    else:
        a = 1
        b = 2
        for _ in range(3, n + 1):
            temp = a + b
            a = b
            b = temp
        print(b)

solve()