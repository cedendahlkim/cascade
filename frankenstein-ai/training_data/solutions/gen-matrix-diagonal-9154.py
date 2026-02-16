# Task: gen-matrix-diagonal-9154 | Score: 100% | 2026-02-14T12:46:59.144106

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))