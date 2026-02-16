# Task: gen-sort-insertion_sort-2779 | Score: 100% | 2026-02-13T18:37:37.439615

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))