# Task: gen-pattern-pyramid-3150 | Score: 100% | 2026-02-13T18:45:59.454794

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))