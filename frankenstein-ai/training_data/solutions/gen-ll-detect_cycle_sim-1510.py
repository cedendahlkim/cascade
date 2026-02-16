# Task: gen-ll-detect_cycle_sim-1510 | Score: 100% | 2026-02-12T13:30:09.346428

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