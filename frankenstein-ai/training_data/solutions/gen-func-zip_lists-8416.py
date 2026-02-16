# Task: gen-func-zip_lists-8416 | Score: 100% | 2026-02-13T18:29:00.550521

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))