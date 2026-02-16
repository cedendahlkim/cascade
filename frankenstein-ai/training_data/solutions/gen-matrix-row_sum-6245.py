# Task: gen-matrix-row_sum-6245 | Score: 100% | 2026-02-13T20:01:41.227130

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))