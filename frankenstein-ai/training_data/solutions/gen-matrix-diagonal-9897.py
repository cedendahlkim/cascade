# Task: gen-matrix-diagonal-9897 | Score: 100% | 2026-02-13T12:30:39.302847

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))