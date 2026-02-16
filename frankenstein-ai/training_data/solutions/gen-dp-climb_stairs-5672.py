# Task: gen-dp-climb_stairs-5672 | Score: 100% | 2026-02-11T08:46:42.590584

def solve():
    n = int(input())
    
    if n <= 0:
        print(0)
        return
    
    if n == 1:
        print(1)
        return
    
    if n == 2:
        print(2)
        return
    
    a = 1
    b = 2
    
    for _ in range(3, n + 1):
        temp = a + b
        a = b
        b = temp
    
    print(b)

solve()