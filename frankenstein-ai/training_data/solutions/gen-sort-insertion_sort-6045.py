# Task: gen-sort-insertion_sort-6045 | Score: 100% | 2026-02-15T10:28:47.314269

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))