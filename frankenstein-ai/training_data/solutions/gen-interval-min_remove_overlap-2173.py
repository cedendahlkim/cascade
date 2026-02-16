# Task: gen-interval-min_remove_overlap-2173 | Score: 100% | 2026-02-14T12:13:25.742769

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