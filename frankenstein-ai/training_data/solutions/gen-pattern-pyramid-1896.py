# Task: gen-pattern-pyramid-1896 | Score: 100% | 2026-02-12T15:38:54.623742

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))