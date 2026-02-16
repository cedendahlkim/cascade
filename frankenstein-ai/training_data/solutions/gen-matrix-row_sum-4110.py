# Task: gen-matrix-row_sum-4110 | Score: 100% | 2026-02-13T18:46:41.917950

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))