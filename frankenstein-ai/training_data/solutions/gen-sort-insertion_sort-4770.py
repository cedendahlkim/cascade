# Task: gen-sort-insertion_sort-4770 | Score: 100% | 2026-02-14T12:28:29.277221

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))