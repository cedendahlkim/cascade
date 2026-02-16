# Task: gen-matrix-diagonal-2887 | Score: 100% | 2026-02-13T18:32:16.832772

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))