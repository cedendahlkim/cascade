# Task: gen-func-zip_lists-5621 | Score: 100% | 2026-02-14T12:08:18.414191

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))