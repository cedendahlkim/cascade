# Task: gen-matrix-row_sum-2897 | Score: 100% | 2026-02-15T09:35:24.410199

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))