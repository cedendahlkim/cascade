# Task: gen-func-zip_lists-9706 | Score: 100% | 2026-02-14T13:26:43.257008

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))