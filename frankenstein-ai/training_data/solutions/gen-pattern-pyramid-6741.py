# Task: gen-pattern-pyramid-6741 | Score: 100% | 2026-02-13T19:35:39.487930

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))