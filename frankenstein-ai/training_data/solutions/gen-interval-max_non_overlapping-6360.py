# Task: gen-interval-max_non_overlapping-6360 | Score: 100% | 2026-02-17T20:34:34.812803

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