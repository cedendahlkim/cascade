# Task: gen-ll-detect_cycle_sim-3411 | Score: 100% | 2026-02-12T16:40:26.295778

def find_duplicate():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    seen = set()
    for num in nums:
        if num in seen:
            print(num)
            return
        seen.add(num)

find_duplicate()