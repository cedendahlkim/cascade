# Task: gen-search-kth_smallest_matrix-3523 | Score: 100% | 2026-02-13T09:19:29.298479

from bisect import bisect_right
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])