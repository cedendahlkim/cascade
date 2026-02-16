# Task: gen-func-zip_lists-3254 | Score: 100% | 2026-02-13T20:49:18.542920

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))