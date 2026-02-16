# Task: gen-algo-two_sum-1932 | Score: 100% | 2026-02-12T12:16:38.130353

n = int(input())
nums = []
for i in range(n):
    nums.append(int(input()))
target = int(input())

num_map = {}
for i, num in enumerate(nums):
    complement = target - num
    if complement in num_map:
        print(num_map[complement], i)
        exit()
    num_map[num] = i

print(-1)