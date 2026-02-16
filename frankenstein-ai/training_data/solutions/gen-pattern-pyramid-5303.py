# Task: gen-pattern-pyramid-5303 | Score: 100% | 2026-02-12T12:17:43.564914

n = int(input())
for i in range(n):
    print(" " * (n - i - 1) + "*" * (2 * i + 1))