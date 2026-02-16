# Task: gen-matrix-diagonal-7139 | Score: 100% | 2026-02-13T12:12:55.184096

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))