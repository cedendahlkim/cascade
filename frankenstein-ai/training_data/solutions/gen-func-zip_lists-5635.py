# Task: gen-func-zip_lists-5635 | Score: 100% | 2026-02-15T10:50:33.536291

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))