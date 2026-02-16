# Task: gen-matrix-diagonal-2332 | Score: 100% | 2026-02-14T12:59:45.084306

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))