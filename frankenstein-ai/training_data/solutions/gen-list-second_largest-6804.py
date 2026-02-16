# Task: gen-list-second_largest-6804 | Score: 100% | 2026-02-12T12:10:21.024728

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    nums.sort()
    
    largest = nums[-1]
    
    for i in range(n - 2, -1, -1):
        if nums[i] != largest:
            print(nums[i])
            return

solve()