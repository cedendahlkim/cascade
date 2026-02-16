# Task: gen-func-zip_lists-2717 | Score: 100% | 2026-02-15T11:37:44.548343

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))