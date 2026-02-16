# Task: gen-func-zip_lists-9815 | Score: 100% | 2026-02-13T13:42:17.675477

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))