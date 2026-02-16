# Task: gen-dp-climb_stairs-7336 | Score: 100% | 2026-02-11T11:54:59.402133

def solve():
    n = int(input())
    
    if n <= 1:
        print(1)
        return

    a = 1
    b = 1
    
    for _ in range(2, n + 1):
        temp = a + b
        a = b
        b = temp
        
    print(b)

solve()