# Task: gen-search-kth_smallest_matrix-3579 | Score: 100% | 2026-02-13T19:23:48.753459

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])