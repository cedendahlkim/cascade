# Task: gen-matrix-diagonal-1785 | Score: 100% | 2026-02-13T21:07:38.056415

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))