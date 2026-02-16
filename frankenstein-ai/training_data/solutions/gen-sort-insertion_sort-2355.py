# Task: gen-sort-insertion_sort-2355 | Score: 100% | 2026-02-13T17:36:38.497518

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))