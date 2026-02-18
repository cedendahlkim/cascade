# Task: gen-math-matmul-1475 | Score: 100% | 2026-02-17T20:36:40.102823

def matrix_multiplication():
    r1, c1 = map(int, input().split())
    A = []
    for _ in range(r1):
        A.append(list(map(int, input().split())))
    
    c1_b, c2 = map(int, input().split())
    B = []
    for _ in range(c1_b):
        B.append(list(map(int, input().split())))
    
    C = [[0 for _ in range(c2)] for _ in range(r1)]
    
    for i in range(r1):
        for j in range(c2):
            for k in range(c1):
                C[i][j] += A[i][k] * B[k][j]
    
    for row in C:
        print(*row)

matrix_multiplication()