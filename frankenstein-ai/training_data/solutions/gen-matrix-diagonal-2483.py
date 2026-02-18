# Task: gen-matrix-diagonal-2483 | Score: 100% | 2026-02-17T19:57:40.118337

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))