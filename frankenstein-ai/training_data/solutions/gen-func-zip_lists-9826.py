# Task: gen-func-zip_lists-9826 | Score: 100% | 2026-02-13T12:54:19.638787

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))