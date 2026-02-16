# Task: gen-func-zip_lists-9028 | Score: 100% | 2026-02-15T08:36:16.773024

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))