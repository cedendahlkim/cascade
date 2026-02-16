# Task: gen-greedy-activity_selection-4327 | Score: 100% | 2026-02-13T19:36:06.269486

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