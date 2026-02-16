# Task: gen-matrix-diagonal-5564 | Score: 100% | 2026-02-13T14:30:21.019713

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))