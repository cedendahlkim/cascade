# Task: gen-dp-max_subarray-2606 | Score: 100% | 2026-02-10T17:28:44.823218

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    max_so_far = 0
    current_max = 0

    for num in nums:
        current_max += num
        if current_max < 0:
            current_max = 0
        if max_so_far < current_max:
            max_so_far = current_max

    if max_so_far == 0:
        max_so_far = max(nums)
        if max_so_far < 0:
            max_so_far = 0
    

    print(max_so_far)

solve()