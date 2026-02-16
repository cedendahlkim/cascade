# Task: gen-matrix-diagonal-4092 | Score: 100% | 2026-02-13T09:33:20.533964

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))