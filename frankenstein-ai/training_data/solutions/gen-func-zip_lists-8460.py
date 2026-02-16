# Task: gen-func-zip_lists-8460 | Score: 100% | 2026-02-13T20:49:48.921498

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))