# Task: gen-pattern-pyramid-8414 | Score: 100% | 2026-02-14T13:12:24.347429

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))