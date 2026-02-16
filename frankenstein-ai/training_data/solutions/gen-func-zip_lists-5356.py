# Task: gen-func-zip_lists-5356 | Score: 100% | 2026-02-13T12:30:44.093107

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))