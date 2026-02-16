# Task: gen-matrix-diagonal-8355 | Score: 100% | 2026-02-15T10:28:53.831666

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))