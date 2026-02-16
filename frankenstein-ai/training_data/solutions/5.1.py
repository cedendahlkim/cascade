# Task: 5.1 | Score: 100% | 2026-02-13T18:31:54.441113

def solve():
    r, c = map(int, input().split())
    matrix = []
    for _ in range(r):
        matrix.append(list(map(int, input().split())))
    
    transposed = [[matrix[j][i] for j in range(r)] for i in range(c)]
    
    for row in transposed:
        print(*row)

solve()