# Task: gen-sort-insertion_sort-1549 | Score: 100% | 2026-02-13T20:50:27.880851

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))