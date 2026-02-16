# Task: gen-pattern-pyramid-1198 | Score: 100% | 2026-02-14T13:25:29.152533

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))