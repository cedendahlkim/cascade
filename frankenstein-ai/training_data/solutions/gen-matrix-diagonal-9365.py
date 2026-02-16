# Task: gen-matrix-diagonal-9365 | Score: 100% | 2026-02-13T19:05:38.264031

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))