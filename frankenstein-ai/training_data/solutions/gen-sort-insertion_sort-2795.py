# Task: gen-sort-insertion_sort-2795 | Score: 100% | 2026-02-14T12:48:40.506432

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))