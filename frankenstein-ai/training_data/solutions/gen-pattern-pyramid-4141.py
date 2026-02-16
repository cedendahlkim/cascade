# Task: gen-pattern-pyramid-4141 | Score: 100% | 2026-02-12T17:26:58.622386

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))