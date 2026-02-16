# Task: gen-pattern-pyramid-9517 | Score: 100% | 2026-02-13T18:29:30.198719

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))