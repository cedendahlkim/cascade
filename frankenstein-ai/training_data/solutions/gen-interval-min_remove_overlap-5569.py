# Task: gen-interval-min_remove_overlap-5569 | Score: 100% | 2026-02-11T14:20:36.376591

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
        else:
            count += 1

    print(count)

solve()