# Task: gen-sort-insertion_sort-4696 | Score: 100% | 2026-02-15T09:51:01.460263

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))