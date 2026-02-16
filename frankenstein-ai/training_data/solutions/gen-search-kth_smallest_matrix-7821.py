# Task: gen-search-kth_smallest_matrix-7821 | Score: 100% | 2026-02-13T13:03:08.410977

from bisect import bisect_right
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])