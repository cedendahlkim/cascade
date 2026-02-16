# Task: gen-matrix-row_sum-1487 | Score: 100% | 2026-02-12T13:13:53.621537

def solve():
    rows, cols = map(int, input().split())
    matrix = []
    for _ in range(rows):
        row = list(map(int, input().split()))
        matrix.append(row)
    
    for row in matrix:
        print(sum(row))

solve()