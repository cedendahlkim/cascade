# Task: gen-matrix-diagonal-1237 | Score: 100% | 2026-02-14T12:20:54.043271

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))