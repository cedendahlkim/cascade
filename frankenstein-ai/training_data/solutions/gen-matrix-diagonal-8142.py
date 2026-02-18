# Task: gen-matrix-diagonal-8142 | Score: 100% | 2026-02-17T20:03:22.323027

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))