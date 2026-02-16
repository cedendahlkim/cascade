# Task: gen-matrix-diagonal-1113 | Score: 100% | 2026-02-15T09:34:43.743502

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))