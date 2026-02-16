# Task: gen-pattern-pyramid-7503 | Score: 100% | 2026-02-15T10:28:27.076721

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))