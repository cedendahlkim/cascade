# Task: gen-matrix-row_sum-3113 | Score: 100% | 2026-02-15T08:35:16.013138

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))