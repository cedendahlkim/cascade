# Task: gen-pattern-pyramid-7566 | Score: 100% | 2026-02-13T19:15:08.016528

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))