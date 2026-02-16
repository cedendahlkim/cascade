# Task: gen-matrix-diagonal-5146 | Score: 100% | 2026-02-14T12:37:26.947491

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))