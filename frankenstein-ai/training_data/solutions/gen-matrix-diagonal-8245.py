# Task: gen-matrix-diagonal-8245 | Score: 100% | 2026-02-15T08:15:04.834386

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))