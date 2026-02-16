# Task: gen-pattern-pyramid-5156 | Score: 100% | 2026-02-13T13:42:22.384964

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))