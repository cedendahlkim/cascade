# Task: gen-matrix-diagonal-5150 | Score: 100% | 2026-02-13T09:22:38.905461

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))