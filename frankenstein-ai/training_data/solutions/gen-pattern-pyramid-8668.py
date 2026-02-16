# Task: gen-pattern-pyramid-8668 | Score: 100% | 2026-02-14T12:37:22.019403

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))