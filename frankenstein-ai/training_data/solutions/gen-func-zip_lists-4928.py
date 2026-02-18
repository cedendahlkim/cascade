# Task: gen-func-zip_lists-4928 | Score: 100% | 2026-02-17T20:02:04.156735

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))