# Task: gen-matrix-diagonal-5273 | Score: 100% | 2026-02-13T17:36:15.574383

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))