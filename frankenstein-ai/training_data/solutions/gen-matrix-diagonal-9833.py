# Task: gen-matrix-diagonal-9833 | Score: 100% | 2026-02-13T11:09:02.271777

n = int(input())
mat = [list(map(int, input().split())) for _ in range(n)]
print(sum(mat[i][i] for i in range(n)))