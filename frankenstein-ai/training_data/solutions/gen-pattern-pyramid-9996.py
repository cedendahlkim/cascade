# Task: gen-pattern-pyramid-9996 | Score: 100% | 2026-02-13T18:51:25.576106

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))