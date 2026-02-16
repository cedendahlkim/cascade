# Task: gen-matrix-row_sum-8206 | Score: 100% | 2026-02-12T13:20:22.768727

def solve():
    rows, cols = map(int, input().split())
    matrix = []
    for _ in range(rows):
        row = list(map(int, input().split()))
        matrix.append(row)
    
    for row in matrix:
        print(sum(row))

solve()