# Task: gen-pattern-pyramid-1250 | Score: 100% | 2026-02-13T21:49:26.511370

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))