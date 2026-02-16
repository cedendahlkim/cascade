# Task: gen-pattern-pyramid-7007 | Score: 100% | 2026-02-13T12:20:17.791899

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))