# Task: gen-matrix-diagonal-7730 | Score: 100% | 2026-02-13T19:48:18.537018

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))