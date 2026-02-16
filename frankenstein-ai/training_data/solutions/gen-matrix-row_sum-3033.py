# Task: gen-matrix-row_sum-3033 | Score: 100% | 2026-02-15T12:03:37.913988

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))