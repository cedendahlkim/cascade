# Task: gen-pattern-pyramid-3264 | Score: 100% | 2026-02-15T09:51:51.136853

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))