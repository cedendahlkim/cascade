# Task: gen-func-zip_lists-4866 | Score: 100% | 2026-02-13T20:49:19.363736

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))