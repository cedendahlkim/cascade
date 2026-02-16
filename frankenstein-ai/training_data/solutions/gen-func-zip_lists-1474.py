# Task: gen-func-zip_lists-1474 | Score: 100% | 2026-02-14T13:11:57.505878

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))