# Task: gen-matrix-row_sum-8842 | Score: 100% | 2026-02-13T11:53:59.195434

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))