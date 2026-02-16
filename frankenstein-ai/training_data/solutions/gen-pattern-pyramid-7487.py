# Task: gen-pattern-pyramid-7487 | Score: 100% | 2026-02-13T09:52:41.684158

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))