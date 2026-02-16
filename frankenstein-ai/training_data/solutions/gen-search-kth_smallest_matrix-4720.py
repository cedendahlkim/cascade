# Task: gen-search-kth_smallest_matrix-4720 | Score: 100% | 2026-02-13T19:24:40.637868

n = int(input())
matrix = [list(map(int, input().split())) for _ in range(n)]
k = int(input())
flat = sorted(x for row in matrix for x in row)
print(flat[k-1])