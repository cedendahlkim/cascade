# Task: gen-matrix-diagonal-2128 | Score: 100% | 2026-02-13T11:23:15.487778

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))