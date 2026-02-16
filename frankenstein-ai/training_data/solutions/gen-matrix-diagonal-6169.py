# Task: gen-matrix-diagonal-6169 | Score: 100% | 2026-02-13T12:25:53.372906

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))