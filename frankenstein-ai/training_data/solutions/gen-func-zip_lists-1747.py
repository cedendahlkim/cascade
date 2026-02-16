# Task: gen-func-zip_lists-1747 | Score: 100% | 2026-02-13T09:26:03.770213

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))