# Task: gen-matrix-col_sum-1840 | Score: 100% | 2026-02-14T12:03:03.602541

line = input().split()
r, c = int(line[0]), int(line[1])
mat = [list(map(int, input().split())) for _ in range(r)]
print(' '.join(str(sum(mat[i][j] for i in range(r))) for j in range(c)))