# Task: gen-matrix-diagonal-7894 | Score: 100% | 2026-02-13T18:27:38.606912

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))