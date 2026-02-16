# Task: gen-func-zip_lists-3749 | Score: 100% | 2026-02-15T11:13:04.532178

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))