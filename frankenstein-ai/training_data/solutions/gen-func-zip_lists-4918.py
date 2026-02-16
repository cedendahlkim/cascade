# Task: gen-func-zip_lists-4918 | Score: 100% | 2026-02-13T18:45:51.015806

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))