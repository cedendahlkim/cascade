# Task: gen-dp-climb_stairs-2614 | Score: 100% | 2026-02-11T12:13:33.736386

def solve():
    n = int(input())
    
    if n <= 1:
        print(1)
        return

    fib = [0] * (n + 1)
    fib[0] = 1
    fib[1] = 1

    for i in range(2, n + 1):
        fib[i] = fib[i-1] + fib[i-2]
    
    print(fib[n])

solve()