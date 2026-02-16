# Task: gen-heap-merge_sorted_lists-5255 | Score: 100% | 2026-02-13T18:38:44.690823

def solve():
    k = int(input())
    lists = []
    for _ in range(k):
        line = input().split()
        n = int(line[0])
        nums = list(map(int, line[1:]))
        lists.append(nums)
    
    merged = []
    for lst in lists:
        merged.extend(lst)
    
    merged.sort()
    
    print(*merged)

solve()