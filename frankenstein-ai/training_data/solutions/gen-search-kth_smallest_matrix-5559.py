# Task: gen-search-kth_smallest_matrix-5559 | Score: 100% | 2026-02-13T12:29:50.036335

from bisect import bisect_right
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])