# Task: gen-interval-min_remove_overlap-8334 | Score: 100% | 2026-02-13T13:46:45.841571

n = int(input())
intervals = [tuple(map(int, input().split())) for _ in range(n)]
intervals.sort(key=lambda x: x[1])
count = 0
end = float('-inf')
for s, e in intervals:
    if s >= end:
        count += 1
        end = e
print(n - count)