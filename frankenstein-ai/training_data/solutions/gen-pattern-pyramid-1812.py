# Task: gen-pattern-pyramid-1812 | Score: 100% | 2026-02-13T11:03:05.010704

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))