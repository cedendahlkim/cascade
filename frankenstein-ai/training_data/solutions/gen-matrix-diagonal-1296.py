# Task: gen-matrix-diagonal-1296 | Score: 100% | 2026-02-13T18:46:06.972888

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))