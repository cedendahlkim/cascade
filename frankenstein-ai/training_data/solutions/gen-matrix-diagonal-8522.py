# Task: gen-matrix-diagonal-8522 | Score: 100% | 2026-02-13T11:04:00.306840

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))