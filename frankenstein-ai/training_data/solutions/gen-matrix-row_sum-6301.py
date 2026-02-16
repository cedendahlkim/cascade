# Task: gen-matrix-row_sum-6301 | Score: 100% | 2026-02-13T12:12:53.904395

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))