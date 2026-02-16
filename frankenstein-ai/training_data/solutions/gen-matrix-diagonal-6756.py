# Task: gen-matrix-diagonal-6756 | Score: 100% | 2026-02-13T18:19:35.034635

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))