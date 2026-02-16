# Task: gen-interval-max_non_overlapping-1717 | Score: 100% | 2026-02-12T10:32:02.578344

def solve():
    n = int(input())
    intervals = []
    for _ in range(n):
        start, end = map(int, input().split())
        intervals.append((start, end))
    
    intervals.sort(key=lambda x: x[1])
    
    count = 0
    last_end = float('-inf')
    
    for start, end in intervals:
        if start >= last_end:
            count += 1
            last_end = end
            
    print(count)

solve()