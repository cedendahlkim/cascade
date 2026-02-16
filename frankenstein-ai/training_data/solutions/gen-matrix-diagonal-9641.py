# Task: gen-matrix-diagonal-9641 | Score: 100% | 2026-02-13T11:09:02.018623

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))