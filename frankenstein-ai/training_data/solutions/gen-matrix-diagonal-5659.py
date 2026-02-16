# Task: gen-matrix-diagonal-5659 | Score: 100% | 2026-02-15T13:00:29.894884

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))