# Task: gen-pattern-pyramid-4085 | Score: 100% | 2026-02-12T12:17:31.601028

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))