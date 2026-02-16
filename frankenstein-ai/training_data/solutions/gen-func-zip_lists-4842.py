# Task: gen-func-zip_lists-4842 | Score: 100% | 2026-02-13T10:13:46.359067

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))