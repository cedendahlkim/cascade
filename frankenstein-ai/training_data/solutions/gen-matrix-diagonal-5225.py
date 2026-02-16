# Task: gen-matrix-diagonal-5225 | Score: 100% | 2026-02-15T10:50:57.895598

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))