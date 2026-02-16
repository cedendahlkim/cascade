# Task: gen-dp-climb_stairs-1249 | Score: 100% | 2026-02-10T18:15:08.687763

def solve():
    n = int(input())
    
    if n <= 2:
        if n == 0:
            print(1)
        else:
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