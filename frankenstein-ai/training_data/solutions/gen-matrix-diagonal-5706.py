# Task: gen-matrix-diagonal-5706 | Score: 100% | 2026-02-13T14:56:38.290506

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))