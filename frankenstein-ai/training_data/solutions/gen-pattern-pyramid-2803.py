# Task: gen-pattern-pyramid-2803 | Score: 100% | 2026-02-12T19:46:01.634030

n = int(input())
for i in range(n):
    print(" " * (n - i - 1) + "*" * (2 * i + 1))