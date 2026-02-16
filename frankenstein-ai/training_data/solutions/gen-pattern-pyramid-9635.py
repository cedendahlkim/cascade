# Task: gen-pattern-pyramid-9635 | Score: 100% | 2026-02-13T18:51:59.096697

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))