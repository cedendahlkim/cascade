# Task: gen-pattern-pyramid-1001 | Score: 100% | 2026-02-13T16:07:17.058797

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))