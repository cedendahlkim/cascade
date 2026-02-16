# Task: gen-pattern-pyramid-8597 | Score: 100% | 2026-02-13T21:49:28.544080

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))