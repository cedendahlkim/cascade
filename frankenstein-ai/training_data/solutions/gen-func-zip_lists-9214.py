# Task: gen-func-zip_lists-9214 | Score: 100% | 2026-02-15T07:59:06.151832

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))