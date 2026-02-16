# Task: gen-search-kth_smallest_matrix-9549 | Score: 100% | 2026-02-13T10:59:06.710581

from bisect import bisect_right
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])