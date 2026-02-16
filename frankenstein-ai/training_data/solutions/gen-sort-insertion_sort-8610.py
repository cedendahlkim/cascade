# Task: gen-sort-insertion_sort-8610 | Score: 100% | 2026-02-13T21:48:49.620829

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))