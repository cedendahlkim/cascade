# Task: gen-dp-max_subarray-6767 | Score: 100% | 2026-02-11T08:42:50.887241

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    max_so_far = float('-inf')
    current_max = 0
    
    for i in range(n):
        current_max += nums[i]
        if current_max > max_so_far:
            max_so_far = current_max
        if current_max < 0:
            current_max = 0
            
    if max_so_far == float('-inf'):
        print(max(nums))
    elif max_so_far == 0:
        max_so_far = float('-inf')
        for num in nums:
          if num > max_so_far:
            max_so_far = num
        print(max_so_far)


    else:
        print(max_so_far)

solve()