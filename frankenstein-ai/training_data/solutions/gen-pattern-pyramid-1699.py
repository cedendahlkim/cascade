# Task: gen-pattern-pyramid-1699 | Score: 100% | 2026-02-13T19:48:43.580338

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))