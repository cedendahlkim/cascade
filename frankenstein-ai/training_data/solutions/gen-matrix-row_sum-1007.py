# Task: gen-matrix-row_sum-1007 | Score: 100% | 2026-02-15T09:34:43.412902

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))