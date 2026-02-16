# Task: gen-matrix-row_sum-3496 | Score: 100% | 2026-02-15T10:29:07.012882

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))