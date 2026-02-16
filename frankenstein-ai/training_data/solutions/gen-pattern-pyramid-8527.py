# Task: gen-pattern-pyramid-8527 | Score: 100% | 2026-02-13T21:49:22.842447

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))