# Task: gen-pattern-pyramid-4231 | Score: 100% | 2026-02-13T12:43:59.900411

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))