# Task: gen-pattern-pyramid-1494 | Score: 100% | 2026-02-14T12:59:59.918321

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))