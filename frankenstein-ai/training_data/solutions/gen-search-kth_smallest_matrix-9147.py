# Task: gen-search-kth_smallest_matrix-9147 | Score: 100% | 2026-02-15T07:48:50.992077

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])