# Task: gen-pattern-pyramid-6770 | Score: 100% | 2026-02-12T12:47:06.610649

n = int(input())
for i in range(n):
    print(" " * (n - i - 1) + "*" * (2 * i + 1))