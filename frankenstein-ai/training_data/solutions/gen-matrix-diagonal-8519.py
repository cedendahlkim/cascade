# Task: gen-matrix-diagonal-8519 | Score: 100% | 2026-02-15T09:17:02.432210

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))