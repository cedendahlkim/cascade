# Task: gen-func-zip_lists-6859 | Score: 100% | 2026-02-13T09:17:11.700842

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))