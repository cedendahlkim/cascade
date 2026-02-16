# Task: gen-heap-merge_sorted_lists-7923 | Score: 100% | 2026-02-13T18:38:36.116525

import heapq

def solve():
    k = int(input())
    lists = []
    for _ in range(k):
        line = list(map(int, input().split()))
        lists.append(line[1:])
    
    merged_list = []
    for l in lists:
        merged_list.extend(l)
    
    merged_list.sort()
    print(*merged_list)

solve()