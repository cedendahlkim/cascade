# Task: gen-sort-insertion_sort-5664 | Score: 100% | 2026-02-14T13:12:15.879423

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))