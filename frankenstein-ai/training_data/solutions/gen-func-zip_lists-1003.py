# Task: gen-func-zip_lists-1003 | Score: 100% | 2026-02-17T20:33:06.911243

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))