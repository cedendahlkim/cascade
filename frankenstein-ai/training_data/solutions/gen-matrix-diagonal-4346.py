# Task: gen-matrix-diagonal-4346 | Score: 100% | 2026-02-13T17:09:15.369704

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))