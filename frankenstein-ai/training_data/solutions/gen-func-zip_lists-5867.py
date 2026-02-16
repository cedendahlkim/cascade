# Task: gen-func-zip_lists-5867 | Score: 100% | 2026-02-14T12:21:01.084026

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))