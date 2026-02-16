# Task: gen-sort-insertion_sort-4007 | Score: 100% | 2026-02-14T13:26:15.232414

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))