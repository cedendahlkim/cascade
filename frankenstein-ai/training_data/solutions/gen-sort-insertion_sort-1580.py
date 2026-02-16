# Task: gen-sort-insertion_sort-1580 | Score: 100% | 2026-02-14T12:37:23.209658

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))