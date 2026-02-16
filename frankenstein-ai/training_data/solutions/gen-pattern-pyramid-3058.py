# Task: gen-pattern-pyramid-3058 | Score: 100% | 2026-02-12T12:18:46.544787

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))