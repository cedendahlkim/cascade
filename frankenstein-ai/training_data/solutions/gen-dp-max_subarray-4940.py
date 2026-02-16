# Task: gen-dp-max_subarray-4940 | Score: 100% | 2026-02-11T09:23:14.469596

n = int(input())
nums = []
for _ in range(n):
  nums.append(int(input()))

max_so_far = nums[0]
current_max = nums[0]

for i in range(1, n):
  current_max = max(nums[i], current_max + nums[i])
  max_so_far = max(max_so_far, current_max)

print(max_so_far)