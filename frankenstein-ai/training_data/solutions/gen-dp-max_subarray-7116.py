# Task: gen-dp-max_subarray-7116 | Score: 100% | 2026-02-11T07:30:26.908525

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    max_so_far = float('-inf')
    current_max = 0

    for num in nums:
        current_max += num
        if current_max > max_so_far:
            max_so_far = current_max
        if current_max < 0:
            current_max = 0

    print(max_so_far)

solve()