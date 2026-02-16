# Task: gen-matrix-diagonal-9433 | Score: 100% | 2026-02-13T11:03:14.232993

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))