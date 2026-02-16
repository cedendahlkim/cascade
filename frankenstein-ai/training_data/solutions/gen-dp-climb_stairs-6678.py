# Task: gen-dp-climb_stairs-6678 | Score: 100% | 2026-02-10T19:07:07.746424

def solve():
    n = int(input())
    
    if n <= 2:
        if n == 0:
            print(0)
        elif n == 1:
            print(1)
        else:
            print(2)
        return

    fib = [0] * (n + 1)
    fib[0] = 0
    fib[1] = 1
    fib[2] = 2
    
    for i in range(3, n + 1):
        fib[i] = fib[i-1] + fib[i-2]
    
    print(fib[n])

solve()