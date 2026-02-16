# Task: gen-search-kth_smallest_matrix-8127 | Score: 100% | 2026-02-14T12:59:33.486566

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])