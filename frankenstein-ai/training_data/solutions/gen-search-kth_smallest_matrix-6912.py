# Task: gen-search-kth_smallest_matrix-6912 | Score: 100% | 2026-02-15T13:31:06.955979

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])