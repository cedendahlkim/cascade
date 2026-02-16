# Task: gen-matrix-diagonal-4548 | Score: 100% | 2026-02-13T18:37:34.801093

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))