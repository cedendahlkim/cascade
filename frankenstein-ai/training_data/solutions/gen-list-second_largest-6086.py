# Task: gen-list-second_largest-6086 | Score: 100% | 2026-02-12T12:20:44.106135

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    unique_nums = sorted(list(set(nums)), reverse=True)
    
    if len(unique_nums) > 1:
        print(unique_nums[1])
    else:
        print(unique_nums[0])

solve()