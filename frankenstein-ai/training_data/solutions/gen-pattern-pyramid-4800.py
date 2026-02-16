# Task: gen-pattern-pyramid-4800 | Score: 100% | 2026-02-12T12:09:53.557798

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))