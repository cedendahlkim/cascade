# Task: gen-matrix-diagonal-4120 | Score: 100% | 2026-02-15T09:17:02.702788

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))