# Task: gen-pattern-pyramid-6088 | Score: 100% | 2026-02-12T15:44:09.236081

n = int(input())
for i in range(n):
    print(' ' * (n - i - 1) + '*' * (2 * i + 1))