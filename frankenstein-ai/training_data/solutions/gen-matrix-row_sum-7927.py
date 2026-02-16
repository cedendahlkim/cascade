# Task: gen-matrix-row_sum-7927 | Score: 100% | 2026-02-15T10:29:16.281643

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))