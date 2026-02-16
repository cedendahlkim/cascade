# Task: 3.5 | Score: 100% | 2026-02-13T18:30:54.279456

n = int(input())
fib = [0, 1]
if n > 2:
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])

if n >= 1:
    print(fib[0], end="")
    for i in range(1, n):
        print(" " + str(fib[i]), end="")
    print()