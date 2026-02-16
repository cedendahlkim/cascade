# Task: gen-func-zip_lists-2107 | Score: 100% | 2026-02-13T09:10:33.490848

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))