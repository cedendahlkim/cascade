# Task: gen-matrix-diagonal-7478 | Score: 100% | 2026-02-13T20:50:20.608470

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))