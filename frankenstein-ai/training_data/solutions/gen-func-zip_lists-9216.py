# Task: gen-func-zip_lists-9216 | Score: 100% | 2026-02-13T09:43:46.209531

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))