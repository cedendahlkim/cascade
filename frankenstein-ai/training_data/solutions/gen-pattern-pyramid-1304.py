# Task: gen-pattern-pyramid-1304 | Score: 100% | 2026-02-15T08:36:00.173892

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))