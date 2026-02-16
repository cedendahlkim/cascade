# Task: gen-matrix-row_sum-3018 | Score: 100% | 2026-02-13T12:05:49.593868

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))