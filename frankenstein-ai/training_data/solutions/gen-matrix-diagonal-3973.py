# Task: gen-matrix-diagonal-3973 | Score: 100% | 2026-02-13T19:14:51.645545

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))