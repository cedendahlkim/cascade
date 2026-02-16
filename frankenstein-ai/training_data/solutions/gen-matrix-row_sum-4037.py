# Task: gen-matrix-row_sum-4037 | Score: 100% | 2026-02-14T12:46:58.657378

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))