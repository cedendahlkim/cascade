# Task: gen-interval-min_remove_overlap-9967 | Score: 100% | 2026-02-12T11:08:48.864310

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
            if intervals[i][0] >= non_overlapping[-1][1]:
                non_overlapping.append(intervals[i])
    
    print(n - len(non_overlapping))

solve()