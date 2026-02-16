# Task: gen-matrix-row_sum-8938 | Score: 100% | 2026-02-13T11:23:17.108225

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))