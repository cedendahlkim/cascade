# Task: gen-matrix-row_sum-6136 | Score: 100% | 2026-02-17T20:09:05.388937

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))