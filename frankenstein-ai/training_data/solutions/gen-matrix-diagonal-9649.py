# Task: gen-matrix-diagonal-9649 | Score: 100% | 2026-02-15T08:14:32.289432

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))