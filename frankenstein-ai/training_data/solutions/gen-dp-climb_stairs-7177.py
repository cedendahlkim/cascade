# Task: gen-dp-climb_stairs-7177 | Score: 100% | 2026-02-10T17:08:06.958593

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
        return
    
    a = 1
    b = 2
    
    for _ in range(3, n + 1):
        c = a + b
        a = b
        b = c
        
    print(b)

solve()