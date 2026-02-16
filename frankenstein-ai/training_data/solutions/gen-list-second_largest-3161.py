# Task: gen-list-second_largest-3161 | Score: 100% | 2026-02-12T12:13:53.806814

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    nums = sorted(list(set(nums)))
    
    if len(nums) < 2:
        print(nums[0])
    else:
        print(nums[-2])

solve()