# Task: gen-pattern-pyramid-6466 | Score: 100% | 2026-02-15T10:50:13.429958

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))