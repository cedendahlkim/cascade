# Task: gen-pattern-pyramid-9871 | Score: 100% | 2026-02-15T07:58:43.654751

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))