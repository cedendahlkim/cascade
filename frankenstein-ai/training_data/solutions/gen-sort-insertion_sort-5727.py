# Task: gen-sort-insertion_sort-5727 | Score: 100% | 2026-02-14T12:02:45.245355

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))