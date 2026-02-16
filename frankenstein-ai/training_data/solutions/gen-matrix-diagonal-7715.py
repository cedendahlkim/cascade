# Task: gen-matrix-diagonal-7715 | Score: 100% | 2026-02-15T09:34:54.660649

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))