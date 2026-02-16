# Task: gen-ll-detect_cycle_sim-7944 | Score: 100% | 2026-02-11T12:09:11.485566

def solve():
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

solve()