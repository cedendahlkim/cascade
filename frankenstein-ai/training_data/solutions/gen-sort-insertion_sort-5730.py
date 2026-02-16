# Task: gen-sort-insertion_sort-5730 | Score: 100% | 2026-02-14T12:13:20.049246

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))