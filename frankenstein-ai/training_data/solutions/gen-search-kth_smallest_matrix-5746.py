# Task: gen-search-kth_smallest_matrix-5746 | Score: 100% | 2026-02-15T09:34:22.488766

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])