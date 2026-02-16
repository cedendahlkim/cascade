# Task: gen-matrix-diagonal-1434 | Score: 100% | 2026-02-13T13:47:28.065258

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))