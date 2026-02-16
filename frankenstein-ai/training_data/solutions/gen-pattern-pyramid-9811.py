# Task: gen-pattern-pyramid-9811 | Score: 100% | 2026-02-15T09:17:59.087340

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))