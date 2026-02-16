# Task: gen-func-zip_lists-4608 | Score: 100% | 2026-02-13T12:41:00.842169

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))