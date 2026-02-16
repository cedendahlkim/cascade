# Task: gen-pattern-pyramid-3973 | Score: 100% | 2026-02-12T16:28:07.070209

n = int(input())
for i in range(n):
    print(" " * (n - i - 1) + "*" * (2 * i + 1))