# Task: gen-func-zip_lists-9990 | Score: 100% | 2026-02-13T10:38:22.929599

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))