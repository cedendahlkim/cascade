# Task: gen-dp-climb_stairs-1553 | Score: 100% | 2026-02-11T11:53:26.905459

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
        return
    
    a = 1
    b = 2
    
    for _ in range(3, n + 1):
        temp = a + b
        a = b
        b = temp
    
    print(b)

solve()