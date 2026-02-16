# Task: gen-pattern-pyramid-7399 | Score: 100% | 2026-02-13T14:30:35.412206

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))