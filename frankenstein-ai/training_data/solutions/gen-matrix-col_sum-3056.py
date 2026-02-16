# Task: gen-matrix-col_sum-3056 | Score: 100% | 2026-02-13T16:07:14.021247

line = input().split()
r, c = int(line[0]), int(line[1])
mat = [list(map(int, input().split())) for _ in range(r)]
print(' '.join(str(sum(mat[i][j] for i in range(r))) for j in range(c)))