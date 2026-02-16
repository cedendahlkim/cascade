# Task: gen-func-zip_lists-1180 | Score: 100% | 2026-02-15T14:00:08.537981

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))