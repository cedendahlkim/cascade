# Task: gen-func-zip_lists-2877 | Score: 100% | 2026-02-13T18:29:14.670294

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))