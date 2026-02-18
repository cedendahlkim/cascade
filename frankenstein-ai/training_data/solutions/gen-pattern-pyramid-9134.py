# Task: gen-pattern-pyramid-9134 | Score: 100% | 2026-02-17T20:11:59.258502

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))