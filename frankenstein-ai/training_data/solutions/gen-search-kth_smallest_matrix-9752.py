# Task: gen-search-kth_smallest_matrix-9752 | Score: 100% | 2026-02-15T09:01:35.602794

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])