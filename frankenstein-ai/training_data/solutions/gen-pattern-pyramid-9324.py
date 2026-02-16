# Task: gen-pattern-pyramid-9324 | Score: 100% | 2026-02-15T10:08:32.307313

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))