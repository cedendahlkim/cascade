# Task: gen-dp-climb_stairs-9590 | Score: 100% | 2026-02-10T18:57:53.472522

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