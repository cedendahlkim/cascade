# Task: gen-sort-insertion_sort-6311 | Score: 100% | 2026-02-13T20:16:59.641757

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))