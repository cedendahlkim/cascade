# Task: gen-search-kth_smallest_matrix-6142 | Score: 100% | 2026-02-13T09:22:25.972707

from bisect import bisect_right
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])