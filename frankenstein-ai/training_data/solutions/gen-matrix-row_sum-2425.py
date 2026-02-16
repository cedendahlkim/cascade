# Task: gen-matrix-row_sum-2425 | Score: 100% | 2026-02-14T12:03:04.137697

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))