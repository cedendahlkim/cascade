# Task: gen-search-kth_smallest_matrix-9613 | Score: 100% | 2026-02-13T12:05:56.561179

from bisect import bisect_right
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])