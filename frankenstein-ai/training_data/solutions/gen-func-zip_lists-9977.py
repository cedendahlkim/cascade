# Task: gen-func-zip_lists-9977 | Score: 100% | 2026-02-13T13:53:40.162688

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))