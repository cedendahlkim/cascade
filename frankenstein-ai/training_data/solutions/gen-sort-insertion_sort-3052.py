# Task: gen-sort-insertion_sort-3052 | Score: 100% | 2026-02-13T19:47:49.955898

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))