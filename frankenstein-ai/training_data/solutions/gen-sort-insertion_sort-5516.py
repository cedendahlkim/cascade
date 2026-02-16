# Task: gen-sort-insertion_sort-5516 | Score: 100% | 2026-02-13T09:16:59.184987

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))