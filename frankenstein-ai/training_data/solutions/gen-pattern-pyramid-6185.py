# Task: gen-pattern-pyramid-6185 | Score: 100% | 2026-02-12T12:09:47.730357

n = int(input())
for i in range(n):
    print(' ' * (n - i - 1) + '*' * (2 * i + 1))