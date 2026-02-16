# Task: gen-pattern-pyramid-6012 | Score: 100% | 2026-02-14T12:37:21.317313

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))