# Task: gen-matrix-row_sum-9663 | Score: 100% | 2026-02-13T09:12:22.547488

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))