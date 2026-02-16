# Task: gen-matrix-diagonal-2029 | Score: 100% | 2026-02-13T10:39:39.209896

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))