# Task: gen-matrix-diagonal-6901 | Score: 100% | 2026-02-13T14:56:48.975604

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))