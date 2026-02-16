# Task: gen-matrix-diagonal-9082 | Score: 100% | 2026-02-15T11:36:45.481226

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))