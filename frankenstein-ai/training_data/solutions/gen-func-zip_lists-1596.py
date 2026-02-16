# Task: gen-func-zip_lists-1596 | Score: 100% | 2026-02-13T15:47:17.008591

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))