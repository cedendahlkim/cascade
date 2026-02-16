# Task: gen-interval-min_remove_overlap-7258 | Score: 100% | 2026-02-12T12:23:35.583413

def solve():
    n = int(input())
    intervals = []
    for _ in range(n):
        start, end = map(int, input().split())
        intervals.append((start, end))

    intervals.sort(key=lambda x: x[1])

    count = 0
    last_end = float('-inf')
    
    non_overlapping_count = 0
    for start, end in intervals:
        if start >= last_end:
            non_overlapping_count += 1
            last_end = end
    
    print(n - non_overlapping_count)

solve()