# Task: gen-algo-two_sum-7422 | Score: 100% | 2026-02-12T17:11:16.480218

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
        exit()
    num_map[num] = i

print(-1)