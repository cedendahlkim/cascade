# Task: gen-interval-min_remove_overlap-2283 | Score: 100% | 2026-02-15T07:58:25.573221

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