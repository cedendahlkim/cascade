# Task: gen-matrix-row_sum-9440 | Score: 100% | 2026-02-15T12:30:11.053707

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))