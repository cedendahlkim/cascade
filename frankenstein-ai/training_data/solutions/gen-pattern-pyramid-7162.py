# Task: gen-pattern-pyramid-7162 | Score: 100% | 2026-02-12T18:48:24.658484

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))