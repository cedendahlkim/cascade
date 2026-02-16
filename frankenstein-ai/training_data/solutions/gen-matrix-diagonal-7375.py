# Task: gen-matrix-diagonal-7375 | Score: 100% | 2026-02-15T13:29:45.395255

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))