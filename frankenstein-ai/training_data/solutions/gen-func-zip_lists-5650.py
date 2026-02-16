# Task: gen-func-zip_lists-5650 | Score: 100% | 2026-02-13T13:03:20.307025

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))