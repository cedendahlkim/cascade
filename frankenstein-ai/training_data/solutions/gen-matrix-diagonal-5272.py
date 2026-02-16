# Task: gen-matrix-diagonal-5272 | Score: 100% | 2026-02-15T09:02:15.515224

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))