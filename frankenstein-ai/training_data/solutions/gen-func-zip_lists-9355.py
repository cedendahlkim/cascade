# Task: gen-func-zip_lists-9355 | Score: 100% | 2026-02-13T09:10:29.260408

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))