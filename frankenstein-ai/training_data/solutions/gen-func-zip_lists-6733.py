# Task: gen-func-zip_lists-6733 | Score: 100% | 2026-02-13T20:49:52.977512

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))