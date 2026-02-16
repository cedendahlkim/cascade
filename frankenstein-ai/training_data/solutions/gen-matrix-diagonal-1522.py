# Task: gen-matrix-diagonal-1522 | Score: 100% | 2026-02-14T12:03:09.075602

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))