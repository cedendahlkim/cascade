# Task: gen-matrix-row_sum-5600 | Score: 100% | 2026-02-15T08:24:09.055509

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))