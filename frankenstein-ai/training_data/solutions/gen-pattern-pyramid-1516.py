# Task: gen-pattern-pyramid-1516 | Score: 100% | 2026-02-13T21:49:27.769201

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))