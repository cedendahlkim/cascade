# Task: gen-matrix-row_sum-9485 | Score: 100% | 2026-02-13T10:03:01.094872

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))