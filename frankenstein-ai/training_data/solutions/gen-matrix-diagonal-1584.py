# Task: gen-matrix-diagonal-1584 | Score: 100% | 2026-02-13T16:47:51.565100

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))