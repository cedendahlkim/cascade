# Task: gen-func-zip_lists-3223 | Score: 100% | 2026-02-15T12:02:50.618476

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))