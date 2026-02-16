# Task: gen-matrix-diagonal-6291 | Score: 100% | 2026-02-13T14:42:22.379746

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))