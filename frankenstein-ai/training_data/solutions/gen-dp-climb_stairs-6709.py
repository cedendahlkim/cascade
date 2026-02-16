# Task: gen-dp-climb_stairs-6709 | Score: 100% | 2026-02-11T09:59:58.748135

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
        return
    
    fib = [0] * (n + 1)
    fib[1] = 1
    fib[2] = 2
    
    for i in range(3, n + 1):
        fib[i] = fib[i-1] + fib[i-2]
        
    print(fib[n])

solve()