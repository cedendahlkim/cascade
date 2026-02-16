# Task: gen-matrix-diagonal-1872 | Score: 100% | 2026-02-14T12:13:43.098791

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))