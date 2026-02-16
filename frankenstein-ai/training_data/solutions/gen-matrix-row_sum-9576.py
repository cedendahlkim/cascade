# Task: gen-matrix-row_sum-9576 | Score: 100% | 2026-02-15T13:30:44.788393

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))