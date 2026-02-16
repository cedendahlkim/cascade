# Task: gen-matrix-row_sum-5183 | Score: 100% | 2026-02-15T09:01:49.285586

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))