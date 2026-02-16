# Task: gen-interval-min_remove_overlap-8472 | Score: 100% | 2026-02-11T19:54:48.546778

def solve():
    n = int(input())
    intervals = []
    for _ in range(n):
        start, end = map(int, input().split())
        intervals.append((start, end))
    
    intervals.sort(key=lambda x: x[1])
    
    non_overlapping = []
    
    for interval in intervals:
        if not non_overlapping:
            non_overlapping.append(interval)
        else:
            last_interval = non_overlapping[-1]
            if interval[0] >= last_interval[1]:
                non_overlapping.append(interval)
    
    print(n - len(non_overlapping))

solve()