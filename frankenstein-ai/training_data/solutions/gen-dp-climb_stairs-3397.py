# Task: gen-dp-climb_stairs-3397 | Score: 100% | 2026-02-10T17:09:18.437155

def solve():
    n = int(input())
    
    if n <= 2:
        print(n)
        return

    fib = [0] * (n + 1)
    fib[0] = 1
    fib[1] = 1
    
    for i in range(2, n + 1):
        fib[i] = fib[i-1] + fib[i-2]
    
    print(fib[n])
    
solve()