# Task: gen-search-kth_smallest_matrix-6552 | Score: 100% | 2026-02-13T12:46:02.104129

from bisect import bisect_right
n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])