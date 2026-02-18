# Task: gen-math-matmul-6221 | Score: 100% | 2026-02-17T20:00:11.015840

def solve():
    r1, c1 = map(int, input().split())
    A = []
    for _ in range(r1):
        A.append(list(map(int, input().split())))
    
    c1_b, c2 = map(int, input().split())
    B = []
    for _ in range(c1_b):
        B.append(list(map(int, input().split())))
    
    C = []
    for i in range(r1):
        row = []
        for j in range(c2):
            val = sum(A[i][k] * B[k][j] for k in range(c1))
            row.append(val)
        C.append(row)
    
    for row in C:
        print(*row)

solve()