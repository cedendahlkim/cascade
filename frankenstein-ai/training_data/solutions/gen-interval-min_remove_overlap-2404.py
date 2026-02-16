# Task: gen-interval-min_remove_overlap-2404 | Score: 100% | 2026-02-11T12:18:29.443227

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
            last_end = end
            count += 1
            
    print(n - count)

solve()