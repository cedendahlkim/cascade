# Task: gen-pattern-pyramid-3775 | Score: 100% | 2026-02-12T15:45:15.126241

n = int(input())
for i in range(n):
    print(" " * (n - i - 1) + "*" * (2 * i + 1))