# Task: gen-matrix-diagonal-2798 | Score: 100% | 2026-02-13T18:46:41.157500

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))