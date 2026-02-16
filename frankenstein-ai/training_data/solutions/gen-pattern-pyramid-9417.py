# Task: gen-pattern-pyramid-9417 | Score: 100% | 2026-02-12T15:44:09.032522

n = int(input())
for i in range(n):
    print(' ' * (n - i - 1) + '*' * (2 * i + 1))