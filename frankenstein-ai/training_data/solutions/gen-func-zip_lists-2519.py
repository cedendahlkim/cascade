# Task: gen-func-zip_lists-2519 | Score: 100% | 2026-02-17T20:35:09.612882

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))