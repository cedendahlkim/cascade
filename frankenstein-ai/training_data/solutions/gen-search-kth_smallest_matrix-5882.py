# Task: gen-search-kth_smallest_matrix-5882 | Score: 100% | 2026-02-17T20:37:31.632987

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])