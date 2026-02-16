# Task: gen-dp-climb_stairs-3650 | Score: 100% | 2026-02-11T11:41:08.662803

def solve():
    n = int(input())
    
    if n <= 1:
        print(1)
        return

    a = 1
    b = 2
    
    for _ in range(2, n):
        temp = a + b
        a = b
        b = temp
    
    print(b)

solve()