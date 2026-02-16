# Task: gen-func-zip_lists-1629 | Score: 100% | 2026-02-13T15:11:11.587160

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))