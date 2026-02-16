# Task: gen-matrix-diagonal-1130 | Score: 100% | 2026-02-12T17:15:46.096864

n = int(input())
matrix = []
for _ in range(n):
    row = list(map(int, input().split()))
    matrix.append(row)

diagonal_sum = 0
for i in range(n):
    diagonal_sum += matrix[i][i]

print(diagonal_sum)