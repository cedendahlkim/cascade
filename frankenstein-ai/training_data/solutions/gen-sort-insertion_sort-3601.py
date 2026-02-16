# Task: gen-sort-insertion_sort-3601 | Score: 100% | 2026-02-13T09:52:53.734128

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))