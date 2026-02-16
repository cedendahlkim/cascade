# Task: gen-sort-insertion_sort-8740 | Score: 100% | 2026-02-13T18:37:38.183809

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))