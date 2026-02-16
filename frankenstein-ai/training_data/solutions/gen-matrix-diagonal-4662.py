# Task: gen-matrix-diagonal-4662 | Score: 100% | 2026-02-13T18:27:41.852876

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))