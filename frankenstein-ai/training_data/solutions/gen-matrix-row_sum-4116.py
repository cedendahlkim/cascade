# Task: gen-matrix-row_sum-4116 | Score: 100% | 2026-02-13T18:29:40.105701

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))