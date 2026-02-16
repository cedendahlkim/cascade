# Task: gen-sort-insertion_sort-2176 | Score: 100% | 2026-02-13T11:06:27.943923

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))