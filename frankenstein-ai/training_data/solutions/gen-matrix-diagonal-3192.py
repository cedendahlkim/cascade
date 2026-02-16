# Task: gen-matrix-diagonal-3192 | Score: 100% | 2026-02-14T13:11:51.595346

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))