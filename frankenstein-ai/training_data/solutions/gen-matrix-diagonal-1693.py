# Task: gen-matrix-diagonal-1693 | Score: 100% | 2026-02-15T10:29:12.819097

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))