# Task: gen-matrix-diagonal-9967 | Score: 100% | 2026-02-13T12:26:42.254577

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))