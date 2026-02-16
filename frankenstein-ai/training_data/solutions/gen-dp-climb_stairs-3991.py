# Task: gen-dp-climb_stairs-3991 | Score: 100% | 2026-02-11T11:26:40.666754

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
    
    fib = [0] * (n + 1)
    fib[1] = 1
    fib[2] = 2
    
    for i in range(3, n + 1):
        fib[i] = fib[i-1] + fib[i-2]
        
    print(fib[n])

solve()