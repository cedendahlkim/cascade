# Task: gen-matrix-col_sum-4583 | Score: 100% | 2026-02-10T15:42:18.175771

def solve():
    rows, cols = map(int, input().split())
    matrix = []
    for _ in range(rows):
        matrix.append(list(map(int, input().split())))
    
    col_sums = [0] * cols
    for j in range(cols):
        for i in range(rows):
            col_sums[j] += matrix[i][j]
    
    print(*col_sums)

solve()