# Task: gen-sort-insertion_sort-2790 | Score: 100% | 2026-02-15T12:02:43.497714

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))