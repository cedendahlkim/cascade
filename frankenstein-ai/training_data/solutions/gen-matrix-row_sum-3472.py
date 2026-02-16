# Task: gen-matrix-row_sum-3472 | Score: 100% | 2026-02-15T10:50:58.442628

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))