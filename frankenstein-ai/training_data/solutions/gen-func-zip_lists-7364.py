# Task: gen-func-zip_lists-7364 | Score: 100% | 2026-02-14T12:20:10.769815

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))