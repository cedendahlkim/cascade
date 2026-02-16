# Task: gen-func-zip_lists-2784 | Score: 100% | 2026-02-15T09:51:12.406598

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))