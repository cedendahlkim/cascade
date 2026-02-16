# Task: gen-matrix-diagonal-3277 | Score: 100% | 2026-02-13T12:30:41.943260

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))