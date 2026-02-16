# Task: gen-dp-climb_stairs-3188 | Score: 100% | 2026-02-10T16:58:53.207799

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