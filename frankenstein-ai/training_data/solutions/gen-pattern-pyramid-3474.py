# Task: gen-pattern-pyramid-3474 | Score: 100% | 2026-02-13T19:34:46.712980

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))