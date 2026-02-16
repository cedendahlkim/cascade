# Task: gen-matrix-diagonal-5059 | Score: 100% | 2026-02-15T07:53:08.495201

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))