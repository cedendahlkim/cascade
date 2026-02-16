# Task: gen-interval-max_non_overlapping-2829 | Score: 100% | 2026-02-14T12:13:24.342832

n = int(input())
intervals = [tuple(map(int, input().split())) for _ in range(n)]
intervals.sort(key=lambda x: x[1])
count = 0
end = float('-inf')
for s, e in intervals:
    if s >= end:
        count += 1
        end = e
print(count)