# Task: gen-pattern-pyramid-5530 | Score: 100% | 2026-02-12T15:46:03.335478

n = int(input())
for i in range(1, n + 1):
    print(" " * (n - i) + "*" * (2 * i - 1))