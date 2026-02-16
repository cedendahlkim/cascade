# Task: gen-matrix-row_sum-4450 | Score: 100% | 2026-02-15T10:09:52.668543

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))