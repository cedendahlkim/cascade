# Task: gen-func-zip_lists-8011 | Score: 100% | 2026-02-14T12:47:36.261839

n = int(input())
a = [int(input()) for _ in range(n)]
b = [int(input()) for _ in range(n)]
print(' '.join(f'{x},{y}' for x, y in zip(a, b)))