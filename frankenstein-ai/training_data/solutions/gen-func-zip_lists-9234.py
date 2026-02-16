# Task: gen-func-zip_lists-9234 | Score: 100% | 2026-02-13T09:42:11.089482

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))