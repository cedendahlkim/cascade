# Task: gen-func-zip_lists-7628 | Score: 100% | 2026-02-13T12:51:58.608678

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))