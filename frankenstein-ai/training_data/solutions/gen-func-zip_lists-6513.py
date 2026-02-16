# Task: gen-func-zip_lists-6513 | Score: 100% | 2026-02-13T09:08:53.349625

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))