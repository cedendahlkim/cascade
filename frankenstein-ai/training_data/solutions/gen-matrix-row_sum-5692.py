# Task: gen-matrix-row_sum-5692 | Score: 100% | 2026-02-12T14:01:54.822220

def solve():
    rows, cols = map(int, input().split())
    matrix = []
    for _ in range(rows):
        row = list(map(int, input().split()))
        matrix.append(row)
    
    for row in matrix:
        print(sum(row))

solve()