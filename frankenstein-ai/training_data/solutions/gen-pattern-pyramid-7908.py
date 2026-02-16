# Task: gen-pattern-pyramid-7908 | Score: 100% | 2026-02-14T12:04:31.331228

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))