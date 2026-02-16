# Task: gen-list-second_largest-3191 | Score: 100% | 2026-02-12T20:27:34.307007

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    nums = sorted(list(set(nums)), reverse=True)
    
    if len(nums) > 1:
        print(nums[1])
    

solve()