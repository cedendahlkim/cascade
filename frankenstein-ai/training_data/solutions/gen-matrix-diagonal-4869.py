# Task: gen-matrix-diagonal-4869 | Score: 100% | 2026-02-13T21:48:53.995229

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))