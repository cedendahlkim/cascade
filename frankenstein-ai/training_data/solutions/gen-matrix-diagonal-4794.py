# Task: gen-matrix-diagonal-4794 | Score: 100% | 2026-02-17T19:57:40.675569

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))