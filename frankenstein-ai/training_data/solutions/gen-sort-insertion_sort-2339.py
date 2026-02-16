# Task: gen-sort-insertion_sort-2339 | Score: 100% | 2026-02-14T12:59:47.671285

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))