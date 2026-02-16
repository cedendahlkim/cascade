# Task: gen-dp-climb_stairs-9703 | Score: 100% | 2026-02-11T11:48:44.012368

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