# Task: gen-matrix-row_sum-5541 | Score: 100% | 2026-02-14T12:37:27.657239

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))