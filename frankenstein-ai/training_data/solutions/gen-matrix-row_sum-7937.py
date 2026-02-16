# Task: gen-matrix-row_sum-7937 | Score: 100% | 2026-02-13T18:37:34.549399

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))