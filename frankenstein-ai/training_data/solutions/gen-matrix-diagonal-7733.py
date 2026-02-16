# Task: gen-matrix-diagonal-7733 | Score: 100% | 2026-02-15T08:24:11.167331

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))