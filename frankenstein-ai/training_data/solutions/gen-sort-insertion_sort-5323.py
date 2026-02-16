# Task: gen-sort-insertion_sort-5323 | Score: 100% | 2026-02-15T08:24:14.364356

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))