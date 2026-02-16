# Task: gen-func-zip_lists-5713 | Score: 100% | 2026-02-13T15:28:36.152734

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))