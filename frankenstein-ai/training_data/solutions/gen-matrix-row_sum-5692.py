# Task: gen-matrix-row_sum-5692 | Score: 100% | 2026-02-17T19:57:41.923953

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))