# Task: gen-matrix-diagonal-1913 | Score: 100% | 2026-02-13T12:05:48.409465

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))