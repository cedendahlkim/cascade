# Task: gen-pattern-pyramid-7474 | Score: 100% | 2026-02-12T12:47:35.743810

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))