# Task: gen-dp-climb_stairs-9858 | Score: 100% | 2026-02-11T09:03:37.316112

def solve():
    n = int(input())
    
    if n <= 2:
        if n == 0:
            print(1)
        elif n == 1:
            print(1)
        else:
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