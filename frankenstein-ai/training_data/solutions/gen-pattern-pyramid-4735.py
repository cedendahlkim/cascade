# Task: gen-pattern-pyramid-4735 | Score: 100% | 2026-02-12T12:19:04.855078

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))