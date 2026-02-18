# Task: gen-search-kth_smallest_matrix-4988 | Score: 100% | 2026-02-17T20:37:37.104915

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])