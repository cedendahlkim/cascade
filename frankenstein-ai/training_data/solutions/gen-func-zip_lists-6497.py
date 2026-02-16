# Task: gen-func-zip_lists-6497 | Score: 100% | 2026-02-15T10:09:15.608081

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))