# Task: gen-matrix-diagonal-3194 | Score: 100% | 2026-02-13T12:13:21.180007

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))