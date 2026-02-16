# Task: gen-matrix-diagonal-3719 | Score: 100% | 2026-02-13T12:26:41.894746

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))