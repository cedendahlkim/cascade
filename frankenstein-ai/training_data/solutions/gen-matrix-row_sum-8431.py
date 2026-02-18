# Task: gen-matrix-row_sum-8431 | Score: 100% | 2026-02-17T20:35:36.510955

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))