# Task: gen-func-zip_lists-8120 | Score: 100% | 2026-02-15T11:37:43.483829

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))