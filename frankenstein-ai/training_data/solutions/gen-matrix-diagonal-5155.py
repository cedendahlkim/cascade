# Task: gen-matrix-diagonal-5155 | Score: 100% | 2026-02-15T08:36:26.010962

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))