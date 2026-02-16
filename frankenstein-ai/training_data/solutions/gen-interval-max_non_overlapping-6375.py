# Task: gen-interval-max_non_overlapping-6375 | Score: 100% | 2026-02-13T10:11:44.352992

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