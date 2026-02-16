# Task: gen-func-zip_lists-3154 | Score: 100% | 2026-02-13T13:02:29.501048

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))