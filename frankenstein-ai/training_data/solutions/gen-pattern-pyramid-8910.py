# Task: gen-pattern-pyramid-8910 | Score: 100% | 2026-02-12T19:55:50.961611

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))