# Task: gen-matrix-diagonal-5138 | Score: 100% | 2026-02-15T12:29:58.168633

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))