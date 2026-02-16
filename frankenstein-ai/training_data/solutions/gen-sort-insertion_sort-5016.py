# Task: gen-sort-insertion_sort-5016 | Score: 100% | 2026-02-13T20:16:59.888312

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))