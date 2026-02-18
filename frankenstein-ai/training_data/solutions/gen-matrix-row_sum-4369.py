# Task: gen-matrix-row_sum-4369 | Score: 100% | 2026-02-17T20:35:37.639152

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))