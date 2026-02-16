# Task: gen-matrix-diagonal-3961 | Score: 100% | 2026-02-14T12:08:13.035113

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))