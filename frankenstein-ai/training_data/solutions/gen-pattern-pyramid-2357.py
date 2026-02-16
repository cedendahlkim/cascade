# Task: gen-pattern-pyramid-2357 | Score: 100% | 2026-02-15T09:51:25.212002

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))