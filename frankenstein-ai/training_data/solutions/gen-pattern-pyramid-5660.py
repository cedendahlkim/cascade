# Task: gen-pattern-pyramid-5660 | Score: 100% | 2026-02-12T17:54:05.681784

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))