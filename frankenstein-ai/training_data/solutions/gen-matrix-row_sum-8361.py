# Task: gen-matrix-row_sum-8361 | Score: 100% | 2026-02-12T20:54:39.671207

def solve():
    rows, cols = map(int, input().split())
    matrix = []
    for _ in range(rows):
        row = list(map(int, input().split()))
        matrix.append(row)
    
    for row in matrix:
        print(sum(row))

solve()