# Task: gen-sort-insertion_sort-3345 | Score: 100% | 2026-02-13T10:14:38.330879

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))