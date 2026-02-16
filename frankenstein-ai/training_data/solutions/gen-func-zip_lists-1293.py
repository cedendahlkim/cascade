# Task: gen-func-zip_lists-1293 | Score: 100% | 2026-02-13T21:28:17.959868

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))