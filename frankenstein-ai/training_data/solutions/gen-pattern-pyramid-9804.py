# Task: gen-pattern-pyramid-9804 | Score: 100% | 2026-02-13T18:29:52.853557

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))