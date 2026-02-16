# Task: gen-matrix-row_sum-6265 | Score: 100% | 2026-02-12T12:10:50.765126

def solve():
    rows, cols = map(int, input().split())
    
    for _ in range(rows):
        row = list(map(int, input().split()))
        print(sum(row))

solve()