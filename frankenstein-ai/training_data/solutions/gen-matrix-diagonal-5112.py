# Task: gen-matrix-diagonal-5112 | Score: 100% | 2026-02-13T09:34:34.800536

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))