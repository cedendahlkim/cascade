# Task: gen-pattern-pyramid-8374 | Score: 100% | 2026-02-13T09:28:55.910010

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))