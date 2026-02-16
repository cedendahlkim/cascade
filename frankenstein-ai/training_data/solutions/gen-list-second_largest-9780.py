# Task: gen-list-second_largest-9780 | Score: 100% | 2026-02-12T12:28:05.817699

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    nums = sorted(list(set(nums)), reverse=True)
    
    if len(nums) > 1:
        print(nums[1])
    else:
        print(nums[0])

solve()