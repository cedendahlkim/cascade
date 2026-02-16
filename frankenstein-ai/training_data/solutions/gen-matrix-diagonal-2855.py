# Task: gen-matrix-diagonal-2855 | Score: 100% | 2026-02-13T18:32:18.476354

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))