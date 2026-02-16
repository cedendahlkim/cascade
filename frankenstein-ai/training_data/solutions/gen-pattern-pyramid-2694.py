# Task: gen-pattern-pyramid-2694 | Score: 100% | 2026-02-15T08:06:02.191890

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))