# Task: gen-matrix-diagonal-3255 | Score: 100% | 2026-02-15T13:30:43.381900

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))