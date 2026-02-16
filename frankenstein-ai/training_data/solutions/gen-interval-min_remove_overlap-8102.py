# Task: gen-interval-min_remove_overlap-8102 | Score: 100% | 2026-02-11T14:07:34.198633

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