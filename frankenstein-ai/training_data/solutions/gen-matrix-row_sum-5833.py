# Task: gen-matrix-row_sum-5833 | Score: 100% | 2026-02-15T08:14:31.932243

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))