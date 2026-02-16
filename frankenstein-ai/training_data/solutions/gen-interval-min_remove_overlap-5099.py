# Task: gen-interval-min_remove_overlap-5099 | Score: 100% | 2026-02-12T09:42:31.540837

def solve():
    n = int(input())
    intervals = []
    for _ in range(n):
        start, end = map(int, input().split())
        intervals.append((start, end))

    intervals.sort(key=lambda x: x[1])

    count = 0
    last_end = float('-inf')
    
    non_overlapping_intervals = []

    for start, end in intervals:
        if start >= last_end:
            non_overlapping_intervals.append((start, end))
            last_end = end

    print(n - len(non_overlapping_intervals))

solve()