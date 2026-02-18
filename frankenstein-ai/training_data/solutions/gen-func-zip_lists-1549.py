# Task: gen-func-zip_lists-1549 | Score: 100% | 2026-02-17T20:09:10.256979

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))