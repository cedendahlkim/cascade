# Task: gen-pattern-pyramid-7528 | Score: 100% | 2026-02-14T13:41:42.993858

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))