# Task: gen-matrix-diagonal-2413 | Score: 100% | 2026-02-13T20:01:41.806822

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))