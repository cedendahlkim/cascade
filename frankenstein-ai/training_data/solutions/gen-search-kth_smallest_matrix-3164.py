# Task: gen-search-kth_smallest_matrix-3164 | Score: 100% | 2026-02-13T12:45:59.195721

from bisect import bisect_right
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])