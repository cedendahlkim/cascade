# Task: gen-matrix-diagonal-9703 | Score: 100% | 2026-02-15T10:09:31.079505

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))