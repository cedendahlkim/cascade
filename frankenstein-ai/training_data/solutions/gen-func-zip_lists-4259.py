# Task: gen-func-zip_lists-4259 | Score: 100% | 2026-02-13T14:19:16.580735

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))