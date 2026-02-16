# Task: gen-greedy-activity_selection-8022 | Score: 100% | 2026-02-15T12:03:26.402591

def solve():
    n = int(input())
    activities = []
    for _ in range(n):
        start, end = map(int, input().split())
        activities.append((start, end))
    
    activities.sort(key=lambda x: x[1])
    
    count = 0
    last_end = -1
    
    for start, end in activities:
        if start >= last_end:
            count += 1
            last_end = end
            
    print(count)

solve()