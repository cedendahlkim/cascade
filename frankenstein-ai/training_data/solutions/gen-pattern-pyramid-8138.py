# Task: gen-pattern-pyramid-8138 | Score: 100% | 2026-02-12T18:48:49.182958

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))