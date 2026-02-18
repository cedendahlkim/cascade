# Task: gen-func-zip_lists-8901 | Score: 100% | 2026-02-17T19:58:43.108866

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))