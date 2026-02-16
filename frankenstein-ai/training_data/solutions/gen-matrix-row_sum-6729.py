# Task: gen-matrix-row_sum-6729 | Score: 100% | 2026-02-14T13:26:02.597865

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))