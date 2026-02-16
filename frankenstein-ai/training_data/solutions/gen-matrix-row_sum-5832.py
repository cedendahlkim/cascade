# Task: gen-matrix-row_sum-5832 | Score: 100% | 2026-02-10T15:43:01.751753

def solve():
    m, n = map(int, input().split())
    matrix = []
    for _ in range(m):
        row = list(map(int, input().split()))
        matrix.append(row)
    
    for row in matrix:
        print(sum(row))

solve()