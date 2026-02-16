# Task: gen-matrix-diagonal-3398 | Score: 100% | 2026-02-15T13:59:59.317293

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))