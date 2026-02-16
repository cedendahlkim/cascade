# Task: gen-algo-two_sum-5790 | Score: 100% | 2026-02-12T20:30:00.229711

def find_two_sum():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    target = int(input())

    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            print(num_map[complement], i)
            return
        num_map[num] = i

    print("-1")

find_two_sum()