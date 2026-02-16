# Task: gen-matrix-diagonal-9656 | Score: 100% | 2026-02-15T13:30:44.249497

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))