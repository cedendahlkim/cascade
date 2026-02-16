# Task: gen-matrix-diagonal-9202 | Score: 100% | 2026-02-15T08:14:45.629698

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))