# Task: gen-matrix-diagonal-3954 | Score: 100% | 2026-02-13T12:04:18.233133

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))