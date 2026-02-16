# Task: gen-matrix-diagonal-6001 | Score: 100% | 2026-02-15T12:03:38.224655

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))