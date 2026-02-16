# Task: gen-pattern-pyramid-8322 | Score: 100% | 2026-02-15T13:00:38.564934

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))