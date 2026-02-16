# Task: gen-sort-insertion_sort-1265 | Score: 100% | 2026-02-13T21:08:20.200684

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))