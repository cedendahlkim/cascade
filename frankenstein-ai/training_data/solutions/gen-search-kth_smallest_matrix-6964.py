# Task: gen-search-kth_smallest_matrix-6964 | Score: 100% | 2026-02-13T18:58:33.134885

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])