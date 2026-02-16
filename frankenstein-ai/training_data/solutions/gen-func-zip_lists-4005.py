# Task: gen-func-zip_lists-4005 | Score: 100% | 2026-02-13T13:02:28.312893

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))