# Task: gen-pattern-pyramid-4877 | Score: 100% | 2026-02-15T12:30:27.725364

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))