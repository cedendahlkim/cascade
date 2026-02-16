# Task: gen-func-zip_lists-7335 | Score: 100% | 2026-02-15T07:49:10.986771

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))