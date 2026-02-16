# Task: gen-func-zip_lists-3508 | Score: 100% | 2026-02-13T12:03:15.521783

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))