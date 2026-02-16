# Task: gen-func-zip_lists-3615 | Score: 100% | 2026-02-13T09:34:20.445292

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))