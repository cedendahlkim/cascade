# Task: gen-func-zip_lists-6060 | Score: 100% | 2026-02-13T11:17:12.312941

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))