# Task: gen-func-zip_lists-6439 | Score: 100% | 2026-02-14T12:28:23.042964

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))