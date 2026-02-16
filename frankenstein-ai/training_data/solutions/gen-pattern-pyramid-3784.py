# Task: gen-pattern-pyramid-3784 | Score: 100% | 2026-02-12T16:39:45.308044

n = int(input())
for i in range(n):
    print(" " * (n - i - 1) + "*" * (2 * i + 1))