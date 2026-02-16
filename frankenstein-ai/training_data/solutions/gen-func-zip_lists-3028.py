# Task: gen-func-zip_lists-3028 | Score: 100% | 2026-02-15T09:02:32.246595

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))