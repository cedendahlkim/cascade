# Task: gen-interval-min_remove_overlap-5359 | Score: 100% | 2026-02-12T10:27:00.133653

def solve():
    n = int(input())
    intervals = []
    for _ in range(n):
        start, end = map(int, input().split())
        intervals.append((start, end))
    
    intervals.sort(key=lambda x: x[1])
    
    non_overlapping = []
    
    if intervals:
        non_overlapping.append(intervals[0])
        
        for i in range(1, len(intervals)):
            current_start, current_end = intervals[i]
            last_end = non_overlapping[-1][1]
            
            if current_start >= last_end:
                non_overlapping.append(intervals[i])
    
    print(n - len(non_overlapping))

solve()