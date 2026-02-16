# Task: gen-matrix-diagonal-3752 | Score: 100% | 2026-02-14T12:20:04.099297

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))