# Task: gen-matrix-diagonal-9148 | Score: 100% | 2026-02-13T13:11:40.314591

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))