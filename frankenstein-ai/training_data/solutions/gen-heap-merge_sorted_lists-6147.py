# Task: gen-heap-merge_sorted_lists-6147 | Score: 100% | 2026-02-15T11:37:30.909026

import heapq

def merge_sorted_lists():
    k = int(input())
    heap = []
    for _ in range(k):
        line = list(map(int, input().split()))
        n = line[0]
        for i in range(1, n + 1):
            heapq.heappush(heap, line[i])
    
    result = []
    while heap:
        result.append(heapq.heappop(heap))
    
    print(*result)

merge_sorted_lists()