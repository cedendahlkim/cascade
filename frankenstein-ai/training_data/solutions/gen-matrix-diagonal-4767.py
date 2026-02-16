# Task: gen-matrix-diagonal-4767 | Score: 100% | 2026-02-13T14:42:13.915757

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))