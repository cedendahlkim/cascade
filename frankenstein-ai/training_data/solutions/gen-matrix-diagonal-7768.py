# Task: gen-matrix-diagonal-7768 | Score: 100% | 2026-02-15T08:35:14.581945

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))