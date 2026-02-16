# Task: gen-interval-min_remove_overlap-5729 | Score: 100% | 2026-02-11T20:47:55.129191

def solve():
    n = int(input())
    intervals = []
    for _ in range(n):
        start, end = map(int, input().split())
        intervals.append((start, end))

    intervals.sort(key=lambda x: x[1])

    count = 0
    last_end = float('-inf')
    
    non_overlapping = []
    
    for start, end in intervals:
        if start >= last_end:
            non_overlapping.append((start, end))
            last_end = end
            count += 1

    print(n - count)

solve()