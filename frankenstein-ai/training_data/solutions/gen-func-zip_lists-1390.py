# Task: gen-func-zip_lists-1390 | Score: 100% | 2026-02-13T12:41:01.137960

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))