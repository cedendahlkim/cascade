# Task: gen-pattern-pyramid-4732 | Score: 100% | 2026-02-12T16:37:45.890181

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))