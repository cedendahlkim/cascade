# Task: gen-matrix-row_sum-7233 | Score: 100% | 2026-02-15T10:50:58.173776

line = input().split()
r, c = int(line[0]), int(line[1])
for _ in range(r):
    row = list(map(int, input().split()))
    print(sum(row))