# Task: gen-func-zip_lists-3207 | Score: 100% | 2026-02-13T15:11:19.100522

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))