# Task: gen-matrix-row_sum-1615 | Score: 100% | 2026-02-15T09:16:30.439158

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))