# Task: gen-sort-insertion_sort-5172 | Score: 100% | 2026-02-13T12:42:49.310185

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))